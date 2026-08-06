// modules/auth/controller.js
import crypto from "crypto";
import UserRepository from "../repositories/UserRepository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendLoginEmail, sendPasswordResetEmail } from "../../../services/email.service.js";
import config from "../../../config/index.js";
import authConfig from "../../../config/auth.js";
import UserVerification from "../models/UserVerification.js";
import RefreshToken from "../models/RefreshToken.js";
import PartnerAgency from "../models/PartnerAgency.js";
import PartnershipRequest from "../../tenancy/models/PartnershipRequest.js";
import User from "../models/User.js";
import {
    getPortalCookieNames,
    getPortalScope,
    portalCookieOptions,
    readPortalAccessToken,
    readPortalRefreshToken,
} from "../../../core/auth/portalSession.js";

const NODE_ENV = (config.NODE_ENV || process.env.NODE_ENV || "development").toString().trim();

// JWT config (use config.JWT which was normalized in server/config.js)
const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (config.JWT && config.JWT.accessExpires) || process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_SECRET = (config.JWT && config.JWT.refreshSecret) || process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = (config.JWT && config.JWT.refreshExpires) || process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// Admin creation secret from config (production-safe)
const ADMIN_CREATION_SECRET = (config.ADMIN_CREATION_SECRET || "").toString().trim();
const MASTER_ADMIN_EMAIL = config.MASTER_ADMIN_EMAIL;
const MASTER_ADMIN_PHONE = config.MASTER_ADMIN_PHONE;
const MASTER_ADMIN_PIN = (config.MASTER_ADMIN_PIN || "").toString().trim();

// OTP TTL (ms) - from config
const OTP_TTL = Number(config.OTP_TTL_MS || 1000 * 60 * 5);
const OTP_MAX_ATTEMPTS = Number(config.OTP_MAX_ATTEMPTS || 3);
const OTP_RESEND_COOLDOWN_MS = Number(config.OTP_RESEND_COOLDOWN_MS || 30 * 1000);

// Non-production bypass: never email OTPs and accept any submitted OTP.
const DEV_OTP_BYPASS = !!config.DEV_OTP_BYPASS;

// Debug flag
const DEBUG = !!config.DEBUG;

/**
 * signTokenForUser - create JWT for a user
 * payload contains sub (user id) and role/name/email for convenience
 */
const signTokenForUser = (user, portal) =>
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
            agencyRole: user.agencyRole || "none",
            agencyId: user.agencyId || null,
            productAccess: user.productAccess || [],
            portal,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

const setTokenCookie = (res, token) => {
    const { access } = getPortalCookieNames(res.req);
    res.cookie(access, token, portalCookieOptions({ maxAge: 7 * 24 * 60 * 60 * 1000 }));
};

const clearTokenCookie = (res) => {
    const { access } = getPortalCookieNames(res.req);
    res.cookie(access, "", portalCookieOptions({ maxAge: 0 }));
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
    const { refresh } = getPortalCookieNames(res.req);
    res.cookie(refresh, token, portalCookieOptions({ maxAge: parseDuration(JWT_REFRESH_EXPIRES_IN) }));
};

const clearRefreshTokenCookie = (res) => {
    const { refresh } = getPortalCookieNames(res.req);
    res.cookie(refresh, "", portalCookieOptions({ maxAge: 0 }));
};

const setAuthNoStoreHeaders = (res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Referrer-Policy", "no-referrer");
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
        portal: getPortalScope(res.req),
        tokenHash: hashToken(refresh.raw),
        family: refresh.family,
        expiresAt: refresh.expiresAt,
    });
    setRefreshTokenCookie(res, refresh.raw);
};

const revokeUserRefreshTokens = async (userId, portal = null) => {
    await RefreshToken.deleteMany({ userId, ...(portal ? { portal } : {}) });
};

const revokeCurrentRefreshToken = async (req) => {
    const refreshTokenRaw = readPortalRefreshToken(req);
    if (!refreshTokenRaw) return;
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshTokenRaw) });
};

const isPrivilegedRole = (role) => role === "admin" || role === "agent";

const normalizePhone = (phone = "") => String(phone || "").replace(/[^\d]/g, "");
// Compare the national number so "+91 98765 43210" and "9876543210" are equivalent.
const normalizeMasterPhone = (phone = "") => {
    const digits = normalizePhone(phone);
    return digits.length >= 10 ? digits.slice(-10) : digits;
};
const matchesMasterPhone = (phone = "") => {
    const normalizedPhone = normalizeMasterPhone(phone);
    const masterPhone = normalizeMasterPhone(MASTER_ADMIN_PHONE);
    if (normalizedPhone.length !== 10 || masterPhone.length !== 10) return false;
    return normalizedPhone === masterPhone;
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

const makePartnerAgencyRef = (name = "") => `partner-${slugRef(name, "agency")}`;

const getAgentRoleContext = async ({ requestedRole }) => {
    if (requestedRole !== "agent") return {};

    // Agency accounts are provisioned only through a single-use invitation.
    // Public self-registration must never allow a caller to choose an agency or role.
    const invitationError = new Error("Partner accounts require an invitation from an authorized agency administrator.");
    invitationError.status = 403;
    throw invitationError;
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
    if (DEV_OTP_BYPASS) {
        console.log(`[otp:dev] OTP ${label} for ${email} skipped (dev bypass, no email sent).`);
        return { success: true, skipped: true };
    }
    const payload = {
        to: email,
        otp,
        subject,
        purpose: label,
        expiresInMinutes: Math.round(OTP_TTL / 60000),
    };
    const result = label === "password reset"
        ? await sendPasswordResetEmail(payload)
        : await sendLoginEmail(payload);
    if (!result.success) {
        const error = new Error(result.message);
        error.status = 503;
        throw error;
    }
    return result;
};

// In dev, any non-empty OTP is accepted so no one is blocked by an emailed code.
const acceptsOtp = (storedOtp, submittedOtp) => {
    const submitted = String(submittedOtp || "").trim();
    if (!submitted) return false;
    if (DEV_OTP_BYPASS) return true;
    return storedOtp === submitted;
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

    if (!acceptsOtp(verification.otp, otp)) {
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

const secureEqual = (received = "", expected = "") => {
    const receivedBuffer = Buffer.from(String(received));
    const expectedBuffer = Buffer.from(String(expected));
    return receivedBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const validateMasterAdminRegistration = async ({ email, verificationId, adminPin }) => {
    if (!verificationId) return { ok: false, message: "Verify the registration OTP before entering the Admin PIN." };
    if (!/^[a-f\d]{24}$/i.test(String(verificationId))) {
        return { ok: false, message: "The verified registration session is invalid or expired." };
    }
    const verification = await UserVerification.findOne({
        _id: verificationId,
        email,
        type: "registration",
        verified: true,
        expiresAt: { $gt: new Date() },
        "metadata.purpose": "master_admin_registration",
    });
    if (!verification) return { ok: false, message: "The verified registration session is invalid or expired." };
    if (!MASTER_ADMIN_PIN || !secureEqual(String(adminPin || "").trim(), MASTER_ADMIN_PIN)) {
        const pinAttempts = Number(verification.metadata?.pinAttempts || 0) + 1;
        verification.metadata = { ...(verification.metadata || {}), pinAttempts };
        verification.markModified("metadata");
        if (pinAttempts >= OTP_MAX_ATTEMPTS) {
            await UserVerification.deleteOne({ _id: verification._id });
            return { ok: false, message: "Too many invalid PIN attempts. Request and verify a new OTP." };
        }
        await verification.save();
        return { ok: false, message: "Invalid Admin PIN." };
    }
    return { ok: true, verification };
};

const maskEmail = (email) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    const masked = visible + "*".repeat(Math.max(local.length - 2, 1));
    return `${masked}@${domain}`;
};

const issueUserToken = async (user, res) => {
    const portal = getPortalScope(res.req);
    const token = signTokenForUser(user, portal);
    setTokenCookie(res, token);
    await issueRefreshToken(user, res);
    return {
        status: "success",
        success: true,
        authenticated: true,
        portal,
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
            agencyRole: user.agencyRole || "none",
            agencyId: user.agencyId || null,
            productAccess: user.productAccess || [],
        },
        sessionVersion: String(user.tokenVersion || 0),
        redirectTo: config.TRAVELSTREM_APP_URL || config.APP_URL || process.env.TRAVELSTREM_APP_URL || process.env.APP_URL || "https://app.travelstrem.com",
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
    agencyRole: user.agencyRole || "none",
    agencyId: user.agencyId || null,
    accountStatus: user.accountStatus || "active",
    productAccess: user.productAccess || [],
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
    if ((user.accountStatus || "active") !== "active") {
        const err = new Error(`Account is ${user.accountStatus}.`);
        err.status = 403;
        throw err;
    }
    if (user.agencyId) {
        const agency = await PartnerAgency.findById(user.agencyId).select("status");
        if (!agency || agency.status !== "active") {
            const err = new Error("Your partner agency is not active.");
            err.status = 403;
            throw err;
        }
    }
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
    setAuthNoStoreHeaders(res);
    return res.json(authConfig);
};

/**
 * POST /auth/admin-registration-otp
 * Generates an OTP for admin/agent registration, stored in UserVerification collection.
 */
export const requestAdminRegistrationOtp = async (req, res) => {
    setAuthNoStoreHeaders(res);
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
        if (normalizedEmail !== MASTER_ADMIN_EMAIL) {
            return res.status(403).json({status: "error", message: "Enter the configured master administrator email address." });
        }
        if (!matchesMasterPhone(phone)) {
            return res.status(403).json({status: "error", message: "Enter the configured master administrator mobile number." });
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
            metadata: { role: requestedRole, purpose: "master_admin_registration" },
        });

        await sendOtpMail({
            email: normalizedEmail,
            otp,
            subject: `Your ${config.COMPANY_NAME} registration OTP`,
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

/** Verify ownership first; the private Admin PIN is requested only after this succeeds. */
export const verifyAdminRegistrationOtp = async (req, res) => {
    setAuthNoStoreHeaders(res);
    try {
        const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
        const otp = String(req.body?.otp || "").trim();
        if (!isMasterAdminIdentity({ email: normalizedEmail, phone: req.body?.phone })) {
            return res.status(403).json({ status: "error", message: "This identity cannot create the master administrator." });
        }
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ status: "error", message: "Enter the 6 digit registration OTP." });
        }
        if (await hasApprovedMasterAdmin()) {
            return res.status(409).json({ status: "error", message: "Master admin already exists." });
        }
        const result = await consumeVerificationOtp({ email: normalizedEmail, type: "registration", otp });
        if (!result.ok) return res.status(result.status || 400).json({ status: "error", message: result.message });
        result.verification.metadata = {
            ...(result.verification.metadata || {}),
            purpose: "master_admin_registration",
        };
        await result.verification.save();
        return res.json({
            status: "verified",
            message: "OTP verified. Enter your private Admin PIN to finish registration.",
            verificationId: result.verification._id.toString(),
            expiresInMs: Math.max(0, result.verification.expiresAt.getTime() - Date.now()),
        });
    } catch (err) {
        console.error("verifyAdminRegistrationOtp error:", err?.stack || err);
        return res.status(500).json({ status: "error", message: "Could not verify the registration OTP." });
    }
};

/**
 * POST /auth/register
 */
export const register = async (req, res) => {
    setAuthNoStoreHeaders(res);
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
                verificationId: req.body.adminVerificationId,
                adminPin: req.body.adminPin,
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

        if (requestedRole === "admin" && adminContext.adminLevel === "master") {
            await UserVerification.deleteOne({ _id: req.body.adminVerificationId });
        }

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

        await revokeCurrentRefreshToken(req);
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
    setAuthNoStoreHeaders(res);
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

        // Privileged roles (admin/agent) require OTP verification, except in
        // non-production where the OTP step is bypassed entirely.
        if (isPrivilegedRole(user.role) && !DEV_OTP_BYPASS) {
            const { verification, otp } = await createVerification({
                email: normalizedEmail,
                type: "login",
                metadata: { role: user.role, portal: getPortalScope(req) },
            });

            await sendOtpMail({
                email: normalizedEmail,
                otp,
                subject: `Your ${config.COMPANY_NAME} login OTP`,
                label: "login",
            });

            return res.json({
                status: "verify_otp",
                verificationId: verification._id.toString(),
                email: maskEmail(normalizedEmail),
                expiresInMs: OTP_TTL,
            });
        }

        await revokeCurrentRefreshToken(req);
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
    setAuthNoStoreHeaders(res);
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

        if (verification.metadata?.portal && verification.metadata.portal !== getPortalScope(req)) {
            return res.status(403).json({ status: "error", message: "This OTP belongs to a different portal login." });
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

        if (!acceptsOtp(verification.otp, otp)) {
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

        await revokeCurrentRefreshToken(req);
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
    setAuthNoStoreHeaders(res);
    try {
        const { verificationId } = req.body || {};
        if (!verificationId) {
            return res.status(400).json({status: "error", message: "Verification ID is required." });
        }

        const verification = await UserVerification.findById(verificationId);
        if (!verification) {
            return res.status(400).json({status: "error", message: "Verification session not found or expired." });
        }

        if (verification.metadata?.portal && verification.metadata.portal !== getPortalScope(req)) {
            return res.status(403).json({ status: "error", message: "This OTP belongs to a different portal login." });
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
            subject: verification.type === "password_reset"
                ? `Your ${config.COMPANY_NAME} password reset OTP`
                : `Your ${config.COMPANY_NAME} login OTP`,
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
    setAuthNoStoreHeaders(res);
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
            subject: `Your ${config.COMPANY_NAME} password reset OTP`,
            label: "password reset",
        });

        return res.json({ message: "OTP sent to registered email address." });
    } catch (err) {
        console.error("Auth forgotPassword error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: isDev ? `Server error: ${err.message}` : "Server error" });
    }
};


export const resetPassword = async (req, res) => {
    setAuthNoStoreHeaders(res);
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

        await revokeCurrentRefreshToken(req);
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
    setAuthNoStoreHeaders(res);
    try {
        const portal = getPortalScope(req);
        const refreshTokenRaw = readPortalRefreshToken(req);
        if (!refreshTokenRaw) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({status: "error", message: "Refresh token not provided." });
        }

        await RefreshToken.cleanupExpired();

        const tokenHash = hashToken(refreshTokenRaw);
        const stored = await RefreshToken.findOne({ tokenHash, portal, expiresAt: { $gt: new Date() } });

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

        await enforceActivePrivilegedUser(user);

        await revokeUserRefreshTokens(user._id, portal);

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
    setAuthNoStoreHeaders(res);
    clearTokenCookie(res);

    const refreshTokenRaw = readPortalRefreshToken(req);
    if (refreshTokenRaw) {
        try {
            await RefreshToken.deleteOne({ tokenHash: hashToken(refreshTokenRaw) });
        } catch (err) {
            console.error("[logout] failed to delete refresh token:", err.message);
        }
    }

    clearRefreshTokenCookie(res);
    return res.json({ success: true, message: "Logged out successfully." });
};

const readAccessTokenFromRequest = (req) => readPortalAccessToken(req);

const findUserForPayload = async (payload) => {
    if (!payload?.sub) return null;
    return UserRepository.findById(
        payload.sub,
        "name email phone role agentRef agencyRef partnerAgencyRef agentApprovalStatus adminLevel adminApprovalStatus avatar tokenVersion agencyRole agencyId accountStatus productAccess permissionGrants permissionDenials"
    );
};

const resolveSessionUser = async (req, res) => {
    const accessToken = readAccessTokenFromRequest(req);
    if (accessToken) {
        try {
            const payload = jwt.verify(accessToken, JWT_SECRET);
            if (!payload.portal || payload.portal !== getPortalScope(req)) throw new Error("Portal session mismatch");
            const user = await findUserForPayload(payload);
            if (user && Number(user.tokenVersion || 0) === Number(payload.tokenVersion || 0)) return user;
            throw new Error("Session has been revoked");
        } catch (err) {
            clearTokenCookie(res);
        }
    }

    const portal = getPortalScope(req);
    const refreshTokenRaw = readPortalRefreshToken(req);
    if (!refreshTokenRaw) return null;

    await RefreshToken.cleanupExpired();
    const stored = await RefreshToken.findOne({
        tokenHash: hashToken(refreshTokenRaw),
        portal,
        expiresAt: { $gt: new Date() },
    });
    if (!stored) {
        clearRefreshTokenCookie(res);
        return null;
    }

    const user = await findUserForPayload({ sub: stored.userId });
    if (!user) {
        await RefreshToken.deleteMany({ userId: stored.userId });
        clearRefreshTokenCookie(res);
        return null;
    }

    await RefreshToken.deleteOne({ _id: stored._id });
    await issueUserToken(user, res);
    return user;
};

/**
 * GET /auth/session
 * Returns the current user AND a fresh access token so the frontend can
 * store it in memory for Bearer-header auth (needed for cross-origin API
 * calls where the httpOnly cookie is blocked by SameSite policy).
 */
export const getSession = async (req, res) => {
    setAuthNoStoreHeaders(res);
    try {
        const user = await resolveSessionUser(req, res);
        if (!user) return res.json({ authenticated: false, user: null });

        try {
            await enforceActivePrivilegedUser(user);
        } catch (statusErr) {
            return res.status(statusErr.status || 403).json({ status: "error", message: statusErr.message });
        }

        return res.json({
            status: "success",
            authenticated: true,
            portal: getPortalScope(req),
            user: safeAuthUser(user),
            sessionVersion: String(user.tokenVersion || 0),
            componentData: {
                data: {
                    user: safeAuthUser(user),
                },
            },
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
    setAuthNoStoreHeaders(res);
    try {
        if (!req.user) return res.status(401).json({status: "error", message: "Unauthorized" });

        const user = await UserRepository.findById(
            req.user.sub,
            "name email phone role agentRef agencyRef partnerAgencyRef agentApprovalStatus adminLevel adminApprovalStatus avatar agencyRole agencyId designation accountStatus productAccess permissionGrants permissionDenials tokenVersion"
        );
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

        const contactEmail = String(body.contactEmail || body.email || "").trim().toLowerCase();
        if (!contactEmail) return res.status(400).json({status: "error", message: "Contact email is required." });
        const existing = await PartnershipRequest.findOne({
            companyEmail: contactEmail,
            status: { $nin: ["rejected", "converted"] },
        });
        if (existing) {
            return res.status(409).json({status: "error", message: "Partner agency application already exists.", requestId: existing.id });
        }

        const application = await PartnershipRequest.create({
            agencyName,
            legalName: String(body.legalName || agencyName).trim(),
            companyEmail: contactEmail,
            companyPhone: String(body.contactPhone || body.phone || "").trim(),
            website: String(body.website || "").trim(),
            gstNumber: String(body.gstNumber || "").trim(),
            notes: String(body.notes || "").trim(),
            requestedProducts: body.requestedProducts || [],
            primaryContact: {
                fullName: String(body.contactName || body.primaryContact?.fullName || "Primary contact").trim(),
                designation: String(body.designation || body.primaryContact?.designation || "").trim(),
                email: contactEmail,
                mobile: String(body.contactPhone || body.phone || body.primaryContact?.mobile || "").trim(),
            },
            status: "submitted",
            history: [{ status: "submitted", note: "Submitted through legacy partnership endpoint." }],
        });

        return res.status(201).json({
            status: "success",
            message: "Partner agency application submitted.",
            partnershipRequest: application,
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
        const application = await PartnershipRequest.findOne({ companyEmail: email }).sort({ createdAt: -1 });
        return res.json({ status: "success", data: application ? {
            id: application.id,
            agencyName: application.agencyName,
            status: application.status,
            submittedAt: application.submittedAt,
            updatedAt: application.updatedAt,
        } : null });
    } catch (err) {
        console.error("checkPartnerAgency error:", err && err.stack ? err.stack : err);
        return res.status(500).json({status: "error", message: "Failed to check partner agency application." });
    }
};

export const listPartnerAgencies = async (req, res) => {
    try {
        const admin = await assertMasterAdmin(req, res);
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
        const admin = await assertMasterAdmin(req, res);
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
        const admin = await assertMasterAdmin(req, res);
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
        const admin = await assertMasterAdmin(req, res);
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
