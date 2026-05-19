// modules/auth/controller.js
import UserRepository from "../repositories/UserRepository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailer from "../../../core/mailer/index.js";
import config from "../../../config/index.js";
import authConfig from "../../../config/auth.js";

const NODE_ENV = (config.NODE_ENV || process.env.NODE_ENV || "development").toString().trim();
const IS_PRODUCTION = !!config.IS_PRODUCTION;

// JWT config (use config.JWT which was normalized in server/config.js)
const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET || "replace_this_in_production";
const JWT_EXPIRES_IN = (config.JWT && config.JWT.accessExpires) || process.env.JWT_EXPIRES_IN || "7d";

// Admin creation secret from config (production-safe)
const ADMIN_CREATION_SECRET = (config.ADMIN_CREATION_SECRET || "").toString().trim();

// SMTP detection (from config)
const SMTP_AVAILABLE = !!config.SMTP_AVAILABLE || !!process.env.SMTP_HOST;

// OTP TTL (ms) - from config
const OTP_TTL = Number(config.OTP_TTL_MS || 1000 * 60 * 15);

// Debug flag
const DEBUG = !!config.DEBUG;
const privilegedRegistrationOtps = new Map();

/**
 * signTokenForUser - create JWT for a user
 * payload contains sub (user id) and role/name/email for convenience
 */
const signTokenForUser = (user) =>
    jwt.sign(
        { sub: user._id.toString(), role: user.role, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

const COOKIE_NAME = IS_PRODUCTION ? "__Host-token" : "token";

const setTokenCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION ? "strict" : "lax",
        path: "/",
        ...(IS_PRODUCTION ? {} : {}),
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const clearTokenCookie = (res) => {
    res.cookie(COOKIE_NAME, "", {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION ? "strict" : "lax",
        path: "/",
        maxAge: 0,
    });
};

const isPrivilegedRole = (role) => role === "admin" || role === "agent";

const getPrivilegedOtpKey = (email, role) => `${role}:${email}`;

const pruneExpiredPrivilegedOtps = () => {
    const now = Date.now();
    for (const [key, entry] of privilegedRegistrationOtps.entries()) {
        if (!entry?.expiresAt || entry.expiresAt <= now) privilegedRegistrationOtps.delete(key);
    }
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const validatePrivilegedRegistration = ({ email, role, adminOtp, adminSecret }) => {
    if (!isPrivilegedRole(role)) return { ok: true };

    pruneExpiredPrivilegedOtps();

    const normalizedOtp = (adminOtp ?? "").toString().trim();
    if (normalizedOtp) {
        const key = getPrivilegedOtpKey(email, role);
        const entry = privilegedRegistrationOtps.get(key);
        if (!entry || entry.otp !== normalizedOtp || entry.expiresAt <= Date.now()) {
            return { ok: false, message: "Invalid or expired admin registration OTP." };
        }
        privilegedRegistrationOtps.delete(key);
        return { ok: true };
    }

    const adminSecretReceived = (adminSecret ?? "").toString().trim();
    if (adminSecretReceived && adminSecretReceived === ADMIN_CREATION_SECRET) {
        return { ok: true };
    }

    if (DEBUG) {
        console.warn("[register] privileged registration verification failed", {
            role,
            email,
            otpProvided: Boolean(normalizedOtp),
            secretProvided: Boolean(adminSecretReceived),
            secretConfigured: Boolean(ADMIN_CREATION_SECRET),
        });
    }

    return { ok: false, message: "Admin registration OTP is required." };
};

// ---------------------- Controller actions ----------------------

/**
 * GET /auth/config
 * Load a local JSON config used by the frontend auth UI (if present).
 */
export const getAuthConfig = async (req, res) => {
    return res.json(authConfig);
};

/**
 * POST /auth/admin-registration-otp
 * Generates an OTP for local backend-console verification of admin/agent registration.
 */
export const requestAdminRegistrationOtp = async (req, res) => {
    try {
        const { email, role } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Email is required." });
        }

        const requestedRole = role || "admin";
        if (!isPrivilegedRole(requestedRole)) {
            return res.status(400).json({ message: "OTP is only available for admin or agent registration." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await UserRepository.findByEmail(normalizedEmail);
        if (existing) {
            return res.status(409).json({ message: "Email already in use." });
        }

        pruneExpiredPrivilegedOtps();
        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_TTL;
        privilegedRegistrationOtps.set(getPrivilegedOtpKey(normalizedEmail, requestedRole), {
            otp,
            expiresAt,
        });

        console.info("====================================================");
        console.info(`[AdminTREM registration OTP] role=${requestedRole} email=${normalizedEmail}`);
        console.info(`[AdminTREM registration OTP] code=${otp}`);
        console.info(`[AdminTREM registration OTP] expiresInMs=${OTP_TTL}`);
        console.info("====================================================");

        return res.json({
            message: "Registration OTP generated. Check the backend console.",
            expiresInMs: OTP_TTL,
        });
    } catch (err) {
        console.error("requestAdminRegistrationOtp error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ message: "Failed to generate registration OTP." });
    }
};

/**
 * POST /auth/register
 */
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await UserRepository.findByEmail(normalizedEmail);
        if (existing) {
            return res.status(409).json({ message: "Email already in use." });
        }

        const requestedRole = role || "member";

        if (isPrivilegedRole(requestedRole)) {
            const verification = validatePrivilegedRegistration({
                email: normalizedEmail,
                role: requestedRole,
                adminOtp: req.body.adminOtp || req.body.registrationOtp,
                adminSecret: req.body.adminSecret,
            });

            if (!verification.ok) {
                return res.status(403).json({ message: verification.message });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = UserRepository.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: requestedRole,
        });

        await user.save();

        const token = signTokenForUser(user);
        setTokenCookie(res, token);
        const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };
        return res.status(201).json({ token, user: safeUser });
    } catch (err) {
        console.error("Auth register error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ message: "Server error during registration." });
    }
};

/**
 * POST /auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        const normalizedEmail = email.toLowerCase().trim();
        const user = await UserRepository.findByEmail(normalizedEmail);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        if (!user.passwordHash || typeof user.passwordHash !== "string") {
            console.error(`[login] user ${normalizedEmail} missing/invalid passwordHash`);
            return res.status(500).json({ message: "User password is not configured correctly." });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = signTokenForUser(user);
        setTokenCookie(res, token);
        const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };
        return res.json({ token, user: safeUser });
    } catch (err) {
        console.error("Auth login error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ message: "Server error during login." });
    }
};

// Defensive versions of forgotPassword and resetPassword
// Paste into your controller file (make sure User, bcrypt, mailer, OTP_TTL, SMTP_AVAILABLE, signTokenForUser are in scope)

const isDev = process.env.NODE_ENV !== "production";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Email is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await UserRepository.findByEmail(normalizedEmail);

        if (!user) {
            // For security you might want to always return 200 — but original code returned 404.
            return res.status(404).json({ message: "No account found with that email address." });
        }

        // Generate 6-digit OTP as string
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + (typeof OTP_TTL === "number" ? OTP_TTL : 1000 * 60 * 15); // fallback 15 min
        // If using Mongoose with strict schemas make sure these fields are allowed
        try {
            await user.save();
        } catch (saveErr) {
            console.error("[forgotPassword] failed to save OTP on user:", saveErr);
            return res.status(500).json({ message: "Failed to set OTP on user." });
        }

        const subject = "Your password reset code";
        const text = `Your password reset code is: ${otp}. It is valid for 15 minutes.`;
        const html = `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code is valid for 15 minutes.</p>`;

        try {
            if (typeof SMTP_AVAILABLE !== "undefined" && SMTP_AVAILABLE && mailer && typeof mailer.sendMail === "function") {
                await mailer.sendMail({ to: user.email, subject, text, html });
            } else {
                console.info(`[forgotPassword] SMTP not available - OTP for ${user.email}: ${otp}`);
            }
        } catch (emailErr) {
            console.error("[forgotPassword] Error sending OTP email:", emailErr);
            // don't leak internals to clients in production
            return res.status(500).json({ message: "Failed to send OTP email. Try again later." });
        }

        return res.json({ message: "OTP sent to registered email address." });
    } catch (err) {
        console.error("Auth forgotPassword error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ message: isDev ? `Server error: ${err.message}` : "Server error" });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body || {};
        if (!email || !otp || !password) {
            return res.status(400).json({ message: "Email, OTP and new password are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // find user and verify otp valid and not expired
        const user = await UserRepository.findForPasswordReset(normalizedEmail, otp);

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        if (typeof bcrypt === "undefined" || typeof bcrypt.hash !== "function") {
            console.error("[resetPassword] bcrypt not available");
            return res.status(500).json({ message: "Server misconfiguration: bcrypt missing." });
        }

        // Hash password - use the same field your app expects. Support both 'password' and 'passwordHash' fields.
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashed = await bcrypt.hash(password, salt);

        // Try to detect user's password field - prefer 'passwordHash' then 'password'
        if ("passwordHash" in user || user.schema?.paths?.passwordHash) {
            user.passwordHash = hashed;
        } else if ("password" in user || user.schema?.paths?.password) {
            // some apps store hashed password on `password`
            user.password = hashed;
        } else {
            // fallback: set passwordHash
            user.passwordHash = hashed;
        }

        // clear otp fields
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;

        try {
            await user.save();
        } catch (saveErr) {
            console.error("[resetPassword] failed to save new password:", saveErr);
            return res.status(500).json({ message: "Failed to save new password." });
        }

        // Issue token
        if (typeof signTokenForUser !== "function") {
            console.error("[resetPassword] signTokenForUser not available");
            // still return success but without token (or return server error depending on your auth flow)
            const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };
            return res.json({ message: "Password reset successful. (no token issued)", user: safeUser });
        }

        const token = signTokenForUser(user);
        setTokenCookie(res, token);
        const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };

        return res.json({ message: "Password reset successful.", token, user: safeUser });
    } catch (err) {
        console.error("Auth resetPassword error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ message: isDev ? `Server error: ${err.message}` : "Server error resetting password." });
    }
};


/**
 * POST /auth/logout
 * Clears the auth cookie.
 */
export const logout = async (req, res) => {
    clearTokenCookie(res);
    return res.json({ message: "Logged out successfully." });
};

/**
 * GET /auth/me
 * Return current user (requires middleware that sets req.user from JWT)
 */
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const user = await UserRepository.findById(req.user.sub, "name email role");
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        console.error("getCurrentUser error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ message: "Server error" });
    }
};
