// modules/auth/controller.js
import crypto from "crypto";
import UserRepository from "../repositories/UserRepository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailer from "../../../core/mailer/index.js";
import config from "../../../config/index.js";
import authConfig from "../../../config/auth.js";
import UserVerification from "../models/UserVerification.js";
import RefreshToken from "../models/RefreshToken.js";
import PartnerAgency from "../models/PartnerAgency.js";
import User from "../models/User.js";

const NODE_ENV = (config.NODE_ENV || process.env.NODE_ENV || "development").toString().trim();
const IS_PRODUCTION = !!config.IS_PRODUCTION;
const AUTH_COOKIE_DOMAIN = (config.AUTH_COOKIE_DOMAIN || process.env.AUTH_COOKIE_DOMAIN || "").toString().trim();
const USE_SHARED_COOKIE_DOMAIN = IS_PRODUCTION && Boolean(AUTH_COOKIE_DOMAIN);

// JWT config (use config.JWT which was normalized in server/config.js)
const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (config.JWT && config.JWT.accessExpires) || process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_SECRET = (config.JWT && config.JWT.refreshSecret) || process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = (config.JWT && config.JWT.refreshExpires) || process.env.JWT_REFRESH_EXPIRES_IN || "30d";
const REFRESH_COOKIE_NAME = IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "__Host-refresh-token" : "refresh_token";

// Admin creation secret from config (production-safe)
const ADMIN_CREATION_SECRET = (config.ADMIN_CREATION_SECRET || "").toString().trim();
const MASTER_ADMIN_EMAIL = config.MASTER_ADMIN_EMAIL;
const MASTER_ADMIN_PHONE = config.MASTER_ADMIN_PHONE;

// OTP TTL (ms) - from config
const OTP_TTL = Number(config.OTP_TTL_MS || 1000 * 60 * 5);
const OTP_MAX_ATTEMPTS = Number(config.OTP_MAX_ATTEMPTS || 3);
const OTP_RESEND_COOLDOWN_MS = Number(config.OTP_RESEND_COOLDOWN_MS || 30 * 1000);

// Debug flag
const DEBUG = !!config.DEBUG;

/**
 * signTokenForUser - create JWT for a user
 * payload contains sub (user id) and role/name/email for convenience
 */
const signTokenForUser = (user) =>
    jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            tokenVersion: user.tokenVersion || 0,
            agentRef: user.agentRef || "",
            agencyRef: user.agencyRef || "",
            partnerAgencyRef: user.partnerAgencyRef || "",
            agentApprovalStatus: user.agentApprovalStatus || "not_required",
            adminLevel: user.adminLevel || "none",
            adminApprovalStatus: user.adminApprovalStatus || "not_required",
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

const COOKIE_NAME = IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "__Host-token" : "token";
const sharedCookieOptions = USE_SHARED_COOKIE_DOMAIN ? { domain: AUTH_COOKIE_DOMAIN } : {};

const setTokenCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "strict" : "lax",
        path: "/",
        ...sharedCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const clearTokenCookie = (res) => {
    res.cookie(COOKIE_NAME, "", {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "strict" : "lax",
        path: "/",
        ...sharedCookieOptions,
        maxAge: 0,
    });
};

const parseDuration = (duration) => {
    const match = String(duration).match(/^(\d+)\s*(s|m|h|d)$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return num * (multipliers[unit] || 86400000);
};

const setRefreshTokenCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "strict" : "lax",
        path: "/api/auth",
        ...sharedCookieOptions,
        maxAge: parseDuration(JWT_REFRESH_EXPIRES_IN),
    });
};

const clearRefreshTokenCookie = (res) => {
    res.cookie(REFRESH_COOKIE_NAME, "", {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "strict" : "lax",
        path: "/api/auth",
        ...sharedCookieOptions,
        maxAge: 0,
    });
};

const generateRefreshToken = (user) => {
    const raw = crypto.randomBytes(48).toString("hex");
    const family = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + parseDuration(JWT_REFRESH_EXPIRES_IN));
    return { raw, family, expiresAt };
};

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

const issueRefreshToken = async (user, res) => {
    await RefreshToken.cleanupExpired();
    const refresh = generateRefreshToken(user);
    await RefreshToken.create({
        userId: user._id,
        tokenHash: hashToken(refresh.raw),
        family: refresh.family,
        expiresAt: refresh.expiresAt,
    });
    setRefreshTokenCookie(res, refresh.raw);
};

const revokeUserRefreshTokens = async (userId) => {
    await RefreshToken.deleteMany({ userId });
};

const isPrivilegedRole = (role) => role === "admin" || role === "agent";
const TRAVELSTREM_AGENT_DOMAIN = config.AGENT_EMAIL_DOMAIN;

const normalizePhone = (phone = "") => String(phone || "").replace(/[^\d]/g, "");
const matchesMasterPhone = (phone = "") => {
    const normalizedPhone = normalizePhone(phone);
    const masterPhone = normalizePhone(MASTER_ADMIN_PHONE);
    if (!normalizedPhone) return true;
    return normalizedPhone === masterPhone || normalizedPhone.endsWith(masterPhone);
};
const isMasterAdminIdentity = ({ email = "", phone = "" } = {}) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    return normalizedEmail === MASTER_ADMIN_EMAIL && matchesMasterPhone(phone);
};

const hasApprovedMasterAdmin = () =>
    User.exists({
        role: "admin",
        adminLevel: "master",
        adminApprovalStatus: "approved",
    });

const slugRef = (value = "", fallback = "agency") => {
    const slug = String(value || fallback)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || fallback;
};

const makeAgencyRef = (name = "", email = "") => {
    const local = String(email || "").split("@")[0] || name || "agency";
    return `agency-${slugRef(name || local)}`;
};

const makePartnerAgencyRef = (name = "") => `partner-${slugRef(name, "agency")}`;
const makeAgentRef = (email = "") => `agent-${slugRef(String(email).split("@")[0] || "user")}`;

const getAgentRoleContext = async ({ requestedRole, normalizedEmail, body = {} }) => {
    if (requestedRole !== "agent") return {};

    if (!TRAVELSTREM_AGENT_DOMAIN) {
        const err = new Error("AGENT_EMAIL_DOMAIN is not configured.");
        err.status = 503;
        throw err;
    }
    const domain = normalizedEmail.split("@")[1] || "";
    if (domain !== TRAVELSTREM_AGENT_DOMAIN) {
        const err = new Error(`Agent accounts must use an @${TRAVELSTREM_AGENT_DOMAIN} email address.`);
        err.status = 400;
        throw err;
    }

    const requestedPartnerAgencyRef = String(body.partnerAgencyRef || "").trim();
    let partnerAgencyRef = "";
    if (requestedPartnerAgencyRef) {
        const partner = await PartnerAgency.findOne({
            partnerAgencyRef: requestedPartnerAgencyRef,
            status: "approved",
        });
        if (!partner) {
            const err = new Error("Partner agency must be approved before its agents can register.");
            err.status = 403;
            throw err;
        }
        partnerAgencyRef = partner.partnerAgencyRef;
    }

    return {
        agentRef: makeAgentRef(normalizedEmail),
        agencyRef: partnerAgencyRef ? "" : String(body.agencyRef || makeAgencyRef(body.agencyName || body.name, normalizedEmail)).trim(),
        partnerAgencyRef,
        agentApprovalStatus: "pending",
    };
};

const getAdminRoleContext = async ({ requestedRole, normalizedEmail, body = {} }) => {
    if (requestedRole !== "admin") return {};

    const phone = String(body.phone || "").trim();
    const masterExists = await hasApprovedMasterAdmin();

    if (!masterExists) {
        if (!isMasterAdminIdentity({ email: normalizedEmail, phone })) {
            const err = new Error(`First admin must be registered by the master admin identity: ${MASTER_ADMIN_EMAIL}.`);
            err.status = 403;
            throw err;
        }

        return {
            phone,
            adminLevel: "master",
            adminApprovalStatus: "approved",
        };
    }

    return {
        phone,
        adminLevel: "standard",
        adminApprovalStatus: "pending",
    };
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpMail = async ({ email, otp, subject, label }) => {
    const text = `Your ${label} OTP is: ${otp}. It is valid for ${Math.round(OTP_TTL / 60000)} minutes.`;
    const html = `<p>Your ${label} OTP is: <strong>${otp}</strong></p><p>This code is valid for ${Math.round(OTP_TTL / 60000)} minutes.</p>`;
    await mailer.sendMail({ to: email, subject, text, html });
};

const createVerification = async ({ email, type, metadata = {}, deleteExisting = true }) => {
    await UserVerification.cleanupExpired();
    if (deleteExisting) {
        await UserVerification.deleteMany({ email, type, verified: false });
    }
    const otp = generateOtp();
    const verification = await UserVerification.create({
        email,
        type,
        otp,
        expiresAt: new Date(Date.now() + OTP_TTL),
        verified: false,
        attempts: 0,
        metadata,
    });
    return { verification, otp };
};

const consumeVerificationOtp = async ({ email, type, otp }) => {
    await UserVerification.cleanupExpired();
    const verification = await UserVerification.findOne({
        email,
        type,
        verified: false,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verification) {
        return { ok: false, status: 400, message: "Invalid or expired OTP." };
    }

    if (verification.attempts >= OTP_MAX_ATTEMPTS) {
        await UserVerification.deleteOne({ _id: verification._id });
        return { ok: false, status: 400, message: "Too many failed attempts. Please request a new OTP." };
    }

    if (verification.otp !== otp.toString().trim()) {
        verification.attempts += 1;
        await verification.save();
        const remaining = OTP_MAX_ATTEMPTS - verification.attempts;
        return {
            ok: false,
            status: 400,
            message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        };
    }

    verification.verified = true;
    verification.verifiedAt = new Date();
    verification.attempts += 1;
    await verification.save();
    return { ok: true, verification };
};

const validateMasterAdminRegistration = async ({ email, adminOtp, adminSecret }) => {
    const normalizedOtp = (adminOtp ?? "").toString().trim();
    if (normalizedOtp) {
        const record = await UserVerification.findOne({
            email,
            type: "registration",
            verified: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });
        if (!record) return { ok: false, message: "Invalid or expired admin registration OTP." };
        const result = await consumeVerificationOtp({ email, type: "registration", otp: normalizedOtp });
        return result.ok ? { ok: true } : { ok: false, message: result.message };
    }

    const adminSecretReceived = (adminSecret ?? "").toString().trim();
    if (adminSecretReceived && adminSecretReceived === ADMIN_CREATION_SECRET) {
        return { ok: true };
    }

    if (DEBUG) {
        console.warn("[register] privileged registration verification failed", {
            role: "admin",
            email,
            otpProvided: Boolean(normalizedOtp),
            secretProvided: Boolean(adminSecretReceived),
            secretConfigured: Boolean(ADMIN_CREATION_SECRET),
        });
    }

    return { ok: false, message: "Master admin registration OTP is required." };
};

const maskEmail = (email) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    const masked = visible + "*".repeat(Math.max(local.length - 2, 1));
    return `${masked}@${domain}`;
};

const issueUserToken = async (user, res) => {
    const token = signTokenForUser(user);
    setTokenCookie(res, token);
    await issueRefreshToken(user, res);
    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            agentRef: user.agentRef || "",
            agencyRef: user.agencyRef || "",
            partnerAgencyRef: user.partnerAgencyRef || "",
            agentApprovalStatus: user.agentApprovalStatus || "not_required",
            phone: user.phone || "",
            adminLevel: user.adminLevel || "none",
            adminApprovalStatus: user.adminApprovalStatus || "not_required",
        },
    };
};

const safeAuthUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    agentRef: user.agentRef || "",
    agencyRef: user.agencyRef || "",
    partnerAgencyRef: user.partnerAgencyRef || "",
    agentApprovalStatus: user.agentApprovalStatus || "not_required",
    phone: user.phone || "",
    avatar: user.avatar || "user",
    adminLevel: user.adminLevel || "none",
    adminApprovalStatus: user.adminApprovalStatus || "not_required",
});

const assertApprovedAdmin = async (req, res) => {
    if (req.user?.role !== "admin") {
        res.status(403).json({status: "error", message: "Only approved admins can perform this action." });
        return null;
    }

    const admin = await UserRepository.findById(req.user.sub || req.user.id);
    if (!admin || admin.role !== "admin" || admin.adminApprovalStatus !== "approved") {
        res.status(403).json({status: "error", message: "Admin approval is required before this action." });
        return null;
    }
    return admin;
};

const assertMasterAdmin = async (req, res) => {
    const admin = await assertApprovedAdmin(req, res);
    if (!admin) return null;
    if (admin.adminLevel !== "master") {
        res.status(403).json({status: "error", message: "Only the master admin can perform this action." });
        return null;
    }
    return admin;
};

const enforceActivePrivilegedUser = async (user) => {
    if (user.role === "admin") {
        if (user.email === MASTER_ADMIN_EMAIL && user.adminLevel !== "master") {
            user.adminLevel = "master";
            user.adminApprovalStatus = "approved";
            await user.save();
        }
        if (user.adminApprovalStatus !== "approved") {
            const err = new Error(
                user.adminApprovalStatus === "removed"
                    ? "Admin access has been removed by the master admin."
                    : "Admin account is pending master admin approval."
            );
            err.status = 403;
            throw err;
        }
    }

    if (user.role === "agent" && user.agentApprovalStatus !== "approved") {
        const err = new Error("Agent account is pending admin approval.");
        err.status = 403;
        throw err;
    }
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
 * Generates an OTP for admin/agent registration, stored in UserVerification collection.
 */
export const requestAdminRegistrationOtp = async (req, res) => {
    try {
        const { email, role, phone } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(400).json({status: "error", message: "Email is required." });
        }

        const requestedRole = role || "admin";
        if (requestedRole !== "admin") {
            return res.status(400).json({status: "error", message: "OTP is only available for master admin registration." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (!isMasterAdminIdentity({ email: normalizedEmail, phone })) {
            return res.status(403).json({status: "error", message: `Master admin OTP can only be requested by ${MASTER_ADMIN_EMAIL}.` });
        }

        if (await hasApprovedMasterAdmin()) {
            return res.status(409).json({status: "error", message: "Master admin already exists. New admins must register and wait for master admin approval." });
        }

        const existing = await UserRepository.findByEmail(normalizedEmail);
        if (existing) {
            return res.status(409).json({status: "error", message: "Email already in use." });
        }

        const { otp } = await createVerification({
            email: normalizedEmail,
            type: "registration",
            metadata: { role: requestedRole },
        });

        await sendOtpMail({
            email: normalizedEmail,
            otp,
            subject: "Your AdminTREM registration OTP",
            label: "registration",
        });

        return res.json({
            message: "Registration OTP sent.",
            expiresInMs: OTP_TTL,
        });
    } catch (err) {
        console.error("requestAdminRegistrationOtp error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to generate registration OTP." });
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
            return res.status(409).json({status: "error", message: "Email already in use." });
        }

        const requestedRole = role || "member";
        const adminContext = await getAdminRoleContext({ requestedRole, normalizedEmail, body: req.body || {} });
        if (requestedRole === "admin" && adminContext.adminLevel === "master") {
            const verification = await validateMasterAdminRegistration({
                email: normalizedEmail,
                adminOtp: req.body.adminOtp || req.body.registrationOtp,
                adminSecret: req.body.adminSecret,
            });
            if (!verification.ok) return res.status(403).json({status: "error", message: verification.message });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const roleContext = await getAgentRoleContext({ requestedRole, normalizedEmail, body: req.body || {} });

        const user = UserRepository.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: requestedRole,
            ...adminContext,
            ...roleContext,
        });

        await user.save();

        if (requestedRole === "agent") {
            return res.status(202).json({
                status: "pending_approval",
                message: "Agent registration submitted. Admin approval is required before login.",
                user: safeAuthUser(user),
            });
        }

        if (requestedRole === "admin" && user.adminApprovalStatus === "pending") {
            return res.status(202).json({
                status: "pending_approval",
                message: "Admin registration submitted. Master admin approval is required before login.",
                user: safeAuthUser(user),
            });
        }

        const result = await issueUserToken(user, res);
        return res.status(201).json(result);
    } catch (err) {
        console.error("Auth register error:", err && err.stack ? err.stack : err);
        return res.status(err.status || 500).json({status: "error", message: err.message || "Server error during registration." });
    }
};

/**
 * POST /auth/login
 * For admin/agent roles, returns a verificationId and requires OTP verification
 * before issuing a JWT. Member roles bypass OTP and get direct JWT.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        const normalizedEmail = email.toLowerCase().trim();
        const user = await UserRepository.findByEmail(normalizedEmail);
        if (!user) {
            return res.status(401).json({status: "error", message: "Invalid credentials." });
        }

        try {
            await enforceActivePrivilegedUser(user);
        } catch (statusErr) {
            return res.status(statusErr.status || 403).json({status: "error", message: statusErr.message });
        }

        if (!user.passwordHash || typeof user.passwordHash !== "string") {
            console.error(`[login] user ${normalizedEmail} missing/invalid passwordHash`);
            return res.status(500).json({status: "error", message: "User password is not configured correctly." });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({status: "error", message: "Invalid credentials." });
        }

        // Privileged roles (admin/agent) require OTP verification
        if (isPrivilegedRole(user.role)) {
            const { verification, otp } = await createVerification({
                email: normalizedEmail,
                type: "login",
                metadata: { role: user.role },
            });

            await sendOtpMail({
                email: normalizedEmail,
                otp,
                subject: "Your AdminTREM login OTP",
                label: "login",
            });

            return res.json({
                status: "verify_otp",
                verificationId: verification._id.toString(),
                email: maskEmail(normalizedEmail),
                expiresInMs: OTP_TTL,
            });
        }

        const result = await issueUserToken(user, res);
        return res.json(result);
    } catch (err) {
        console.error("Auth login error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Server error during login." });
    }
};

/**
 * POST /auth/verify-otp
 * Verifies the OTP for a login verificationId and issues a JWT.
 */
export const verifyLoginOtp = async (req, res) => {
    try {
        const { verificationId, otp } = req.body || {};
        if (!verificationId || !otp) {
            return res.status(400).json({status: "error", message: "Verification ID and OTP are required." });
        }

        await UserVerification.cleanupExpired();

        const verification = await UserVerification.findById(verificationId);
        if (!verification) {
            return res.status(400).json({status: "error", message: "Verification session not found or expired." });
        }

        if (verification.verified) {
            return res.status(400).json({status: "error", message: "OTP already verified. Please log in again." });
        }

        if (new Date() > verification.expiresAt) {
            await UserVerification.deleteOne({ _id: verificationId });
            return res.status(400).json({status: "error", message: "OTP has expired. Please request a new one." });
        }

        if (verification.attempts >= OTP_MAX_ATTEMPTS) {
            await UserVerification.deleteOne({ _id: verificationId });
            return res.status(400).json({status: "error", message: "Too many failed attempts. Please log in again." });
        }

        if (verification.otp !== otp.toString().trim()) {
            verification.attempts += 1;
            await verification.save();
            const remaining = OTP_MAX_ATTEMPTS - verification.attempts;
            return res.status(400).json({
                status: "error",
                message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
            });
        }

        const user = await UserRepository.findByEmail(verification.email);
        if (!user) {
            await UserVerification.deleteOne({ _id: verificationId });
            return res.status(400).json({status: "error", message: "User not found." });
        }

        try {
            await enforceActivePrivilegedUser(user);
        } catch (statusErr) {
            await UserVerification.deleteOne({ _id: verificationId });
            return res.status(statusErr.status || 403).json({status: "error", message: statusErr.message });
        }

        verification.verified = true;
        verification.verifiedAt = new Date();
        verification.attempts += 1;
        await verification.save();

        const result = await issueUserToken(user, res);
        return res.json(result);
    } catch (err) {
        console.error("verifyLoginOtp error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Server error during OTP verification." });
    }
};

/**
 * POST /auth/resend-otp
 * Generates a new OTP for an existing verification session.
 */
export const resendLoginOtp = async (req, res) => {
    try {
        const { verificationId } = req.body || {};
        if (!verificationId) {
            return res.status(400).json({status: "error", message: "Verification ID is required." });
        }

        const verification = await UserVerification.findById(verificationId);
        if (!verification) {
            return res.status(400).json({status: "error", message: "Verification session not found or expired." });
        }

        if (verification.verified) {
            return res.status(400).json({status: "error", message: "OTP already verified. Please log in again." });
        }

        const cooldownMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - new Date(verification.createdAt).getTime());
        if (cooldownMs > 0) {
            return res.status(429).json({
                status: "error",
                message: `Please wait ${Math.ceil(cooldownMs / 1000)} seconds before requesting a new OTP.`,
                retryAfterMs: cooldownMs,
            });
        }

        verification.otp = generateOtp();
        verification.expiresAt = new Date(Date.now() + OTP_TTL);
        verification.attempts = 0;
        verification.createdAt = new Date();
        await verification.save();

        await sendOtpMail({
            email: verification.email,
            otp: verification.otp,
            subject: verification.type === "password_reset" ? "Your password reset OTP" : "Your AdminTREM login OTP",
            label: verification.type === "password_reset" ? "password reset" : "login",
        });

        return res.json({
            message: "New OTP sent.",
            expiresInMs: OTP_TTL,
        });
    } catch (err) {
        console.error("resendLoginOtp error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Server error during OTP resend." });
    }
};

const isDev = process.env.NODE_ENV !== "production";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(400).json({status: "error", message: "Email is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await UserRepository.findByEmail(normalizedEmail);

        if (!user) {
            // For security you might want to always return 200 , but original code returned 404.
            return res.status(404).json({status: "error", message: "No account found with that email address." });
        }

        const { otp } = await createVerification({
            email: normalizedEmail,
            type: "password_reset",
            metadata: { userId: user._id.toString() },
        });

        await sendOtpMail({
            email: user.email,
            otp,
            subject: "Your password reset OTP",
            label: "password reset",
        });

        return res.json({ message: "OTP sent to registered email address." });
    } catch (err) {
        console.error("Auth forgotPassword error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: isDev ? `Server error: ${err.message}` : "Server error" });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body || {};
        if (!email || !otp || !password) {
            return res.status(400).json({status: "error", message: "Email, OTP and new password are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const verificationResult = await consumeVerificationOtp({
            email: normalizedEmail,
            type: "password_reset",
            otp,
        });
        if (!verificationResult.ok) {
            return res.status(verificationResult.status).json({status: "error", message: verificationResult.message });
        }

        const user = await UserRepository.findByEmail(normalizedEmail);
        if (!user) return res.status(400).json({status: "error", message: "User not found." });

        if (typeof bcrypt === "undefined" || typeof bcrypt.hash !== "function") {
            console.error("[resetPassword] bcrypt not available");
            return res.status(500).json({status: "error", message: "Server misconfiguration: bcrypt missing." });
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

        try {
            await user.save();
        } catch (saveErr) {
            console.error("[resetPassword] failed to save new password:", saveErr);
            return res.status(500).json({status: "error", message: "Failed to save new password." });
        }

        // Increment tokenVersion to invalidate existing sessions
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        await revokeUserRefreshTokens(user._id);

        const result = await issueUserToken(user, res);
        return res.json({ message: "Password reset successful.", ...result });
    } catch (err) {
        console.error("Auth resetPassword error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: isDev ? `Server error: ${err.message}` : "Server error resetting password." });
    }
};


/**
 * POST /auth/refresh
 * Validates refresh token from httpOnly cookie, rotates it, and issues new access + refresh tokens.
 */
export const refreshTokenEndpoint = async (req, res) => {
    try {
        const refreshTokenRaw = req.cookies?.[REFRESH_COOKIE_NAME] || req.cookies?.refresh_token || req.body?.refreshToken;
        if (!refreshTokenRaw) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({status: "error", message: "Refresh token not provided." });
        }

        await RefreshToken.cleanupExpired();

        const tokenHash = hashToken(refreshTokenRaw);
        const stored = await RefreshToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } });

        if (!stored) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({status: "error", message: "Invalid or expired refresh token." });
        }

        const user = await UserRepository.findById(stored.userId);
        if (!user) {
            await RefreshToken.deleteMany({ userId: stored.userId });
            clearRefreshTokenCookie(res);
            return res.status(401).json({status: "error", message: "User not found." });
        }

        await revokeUserRefreshTokens(user._id);

        const result = await issueUserToken(user, res);
        return res.json(result);
    } catch (err) {
        console.error("refreshTokenEndpoint error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Server error during token refresh." });
    }
};

/**
 * POST /auth/logout
 * Clears the auth cookie and deletes refresh token.
 */
export const logout = async (req, res) => {
    clearTokenCookie(res);

    const refreshTokenRaw = req.cookies?.[REFRESH_COOKIE_NAME] || req.cookies?.refresh_token;
    if (refreshTokenRaw) {
        try {
            await RefreshToken.deleteOne({ tokenHash: hashToken(refreshTokenRaw) });
        } catch (err) {
            console.error("[logout] failed to delete refresh token:", err.message);
        }
    }

    clearRefreshTokenCookie(res);
    return res.json({ message: "Logged out successfully." });
};

/**
 * GET /auth/session
 * Returns the current user AND a fresh access token so the frontend can
 * store it in memory for Bearer-header auth (needed for cross-origin API
 * calls where the httpOnly cookie is blocked by SameSite policy).
 */
export const getSession = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ status: "error", message: "Unauthorized" });

        const user = await UserRepository.findById(
            req.user.sub,
            "name email phone role agentRef agencyRef partnerAgencyRef agentApprovalStatus adminLevel adminApprovalStatus avatar"
        );
        if (!user) return res.status(404).json({ status: "error", message: "User not found" });

        try {
            await enforceActivePrivilegedUser(user);
        } catch (statusErr) {
            return res.status(statusErr.status || 403).json({ status: "error", message: statusErr.message });
        }

        const token = signTokenForUser(user);
        setTokenCookie(res, token);

        return res.json({
            token,
            user: safeAuthUser(user),
        });
    } catch (err) {
        console.error("[getSession] error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ status: "error", message: "Server error" });
    }
};

/**
 * GET /auth/me
 * Return current user (requires middleware that sets req.user from JWT)
 */
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({status: "error", message: "Unauthorized" });

        const user = await UserRepository.findById(req.user.sub, "name email phone role agentRef agencyRef partnerAgencyRef agentApprovalStatus adminLevel adminApprovalStatus avatar");
        if (!user) return res.status(404).json({status: "error", message: "User not found" });
        try {
            await enforceActivePrivilegedUser(user);
        } catch (statusErr) {
            return res.status(statusErr.status || 403).json({status: "error", message: statusErr.message });
        }

        return res.json(safeAuthUser(user));
    } catch (err) {
        console.error("getCurrentUser error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Server error" });
    }
};

export const applyPartnerAgency = async (req, res) => {
    try {
        const body = req.body || {};
        const agencyName = String(body.agencyName || body.name || "").trim();
        if (!agencyName) return res.status(400).json({status: "error", message: "Agency name is required." });

        const partnerAgencyRef = String(body.partnerAgencyRef || makePartnerAgencyRef(agencyName)).trim();
        const existing = await PartnerAgency.findOne({ partnerAgencyRef });
        if (existing) {
            return res.status(409).json({status: "error", message: "Partner agency application already exists.", partnerAgencyRef });
        }

        const application = await PartnerAgency.create({
            agencyName,
            partnerAgencyRef,
            contactName: String(body.contactName || "").trim(),
            contactEmail: String(body.contactEmail || body.email || "").trim().toLowerCase(),
            contactPhone: String(body.contactPhone || body.phone || "").trim(),
            website: String(body.website || "").trim(),
            gstNumber: String(body.gstNumber || "").trim(),
            notes: String(body.notes || "").trim(),
        });

        return res.status(201).json({
            status: "success",
            message: "Partner agency application submitted.",
            partnerAgency: application,
        });
    } catch (err) {
        console.error("applyPartnerAgency error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to submit partner agency application." });
    }
};

export const checkPartnerAgency = async (req, res) => {
    try {
        const email = String(req.query?.email || "").trim().toLowerCase();
        if (!email) return res.status(400).json({status: "error", message: "Email query parameter is required." });
        const application = await PartnerAgency.findOne({ contactEmail: email }).sort({ createdAt: -1 });
        return res.json({ status: "success", data: application || null });
    } catch (err) {
        console.error("checkPartnerAgency error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to check partner agency application." });
    }
};

export const listPartnerAgencies = async (req, res) => {
    try {
        const admin = await assertApprovedAdmin(req, res);
        if (!admin) return;
        const status = String(req.query?.status || "").trim();
        const query = status ? { status } : {};
        const agencies = await PartnerAgency.find(query).sort({ createdAt: -1 });
        return res.json({ status: "success", data: agencies });
    } catch (err) {
        console.error("listPartnerAgencies error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to list partner agencies." });
    }
};

export const reviewPartnerAgency = async (req, res) => {
    try {
        const admin = await assertApprovedAdmin(req, res);
        if (!admin) return;
        const status = String(req.body?.status || "approved").trim().toLowerCase();
        if (!["approved", "rejected"].includes(status)) return res.status(400).json({status: "error", message: "status must be approved or rejected." });

        const agency = await PartnerAgency.findById(req.params.id);
        if (!agency) return res.status(404).json({status: "error", message: "Partner agency not found." });
        agency.status = status;
        agency.notes = String(req.body?.notes || agency.notes || "").trim();
        agency.approvedBy = admin._id || req.user.sub || req.user.id || null;
        agency.approvedAt = new Date();
        await agency.save();

        return res.json({ status: "success", message: `Partner agency ${status}.`, data: agency });
    } catch (err) {
        console.error("reviewPartnerAgency error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to update partner agency." });
    }
};

export const listAgents = async (req, res) => {
    try {
        const admin = await assertApprovedAdmin(req, res);
        if (!admin) return;
        const status = String(req.query?.status || "").trim();
        const query = { role: "agent" };
        if (status) query.agentApprovalStatus = status;
        const agents = await User.find(query)
            .select("name email role agentRef agencyRef partnerAgencyRef agentApprovalStatus createdAt approvedAt")
            .sort({ createdAt: -1 });
        return res.json({ status: "success", data: agents });
    } catch (err) {
        console.error("listAgents error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to list agents." });
    }
};

export const reviewAgent = async (req, res) => {
    try {
        const admin = await assertApprovedAdmin(req, res);
        if (!admin) return;
        const status = String(req.body?.status || "approved").trim().toLowerCase();
        if (!["approved", "rejected"].includes(status)) return res.status(400).json({status: "error", message: "status must be approved or rejected." });

        const user = await UserRepository.findById(req.params.id);
        if (!user || user.role !== "agent") return res.status(404).json({status: "error", message: "Agent not found." });
        user.agentApprovalStatus = status;
        user.approvedBy = admin._id || req.user.sub || req.user.id || null;
        user.approvedAt = new Date();
        await user.save();

        return res.json({ status: "success", message: `Agent ${status}.`, data: safeAuthUser(user) });
    } catch (err) {
        console.error("reviewAgent error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to update agent." });
    }
};

export const listAdmins = async (req, res) => {
    try {
        const master = await assertMasterAdmin(req, res);
        if (!master) return;

        const status = String(req.query?.status || "").trim();
        const query = { role: "admin" };
        if (status) query.adminApprovalStatus = status;
        const admins = await User.find(query)
            .select("name email phone role adminLevel adminApprovalStatus createdAt approvedAt")
            .sort({ adminLevel: -1, createdAt: -1 });

        return res.json({ status: "success", data: admins });
    } catch (err) {
        console.error("listAdmins error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to list admins." });
    }
};

export const reviewAdmin = async (req, res) => {
    try {
        const master = await assertMasterAdmin(req, res);
        if (!master) return;

        const status = String(req.body?.status || "approved").trim().toLowerCase();
        if (!["approved", "rejected"].includes(status)) return res.status(400).json({status: "error", message: "status must be approved or rejected." });

        const user = await UserRepository.findById(req.params.id);
        if (!user || user.role !== "admin") return res.status(404).json({status: "error", message: "Admin not found." });
        if (user.adminLevel === "master") return res.status(403).json({status: "error", message: "Master admin cannot be reviewed or downgraded." });

        user.adminLevel = "standard";
        user.adminApprovalStatus = status;
        user.approvedBy = master._id;
        user.approvedAt = new Date();
        await user.save();

        return res.json({ status: "success", message: `Admin ${status}.`, data: safeAuthUser(user) });
    } catch (err) {
        console.error("reviewAdmin error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to update admin." });
    }
};

export const removeAdmin = async (req, res) => {
    try {
        const master = await assertMasterAdmin(req, res);
        if (!master) return;

        const user = await UserRepository.findById(req.params.id);
        if (!user || user.role !== "admin") return res.status(404).json({status: "error", message: "Admin not found." });
        if (String(user._id) === String(master._id) || user.adminLevel === "master") {
            return res.status(403).json({status: "error", message: "Master admin cannot remove itself." });
        }

        user.adminApprovalStatus = "removed";
        user.approvedBy = master._id;
        user.approvedAt = new Date();
        await user.save();

        return res.json({ status: "success", message: "Admin access removed.", data: safeAuthUser(user) });
    } catch (err) {
        console.error("removeAdmin error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to remove admin." });
    }
};
