import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../../../config/index.js";
import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";
import {
    DEFAULT_PROFILE_AVATAR,
    normalizeProfileAvatar,
} from "../profileAvatar.constants.js";
import {
    getPortalCookieNames,
    getPortalScope,
    normalizePortalScope,
    portalCookieOptions,
    readPortalAccessToken,
    readPortalRefreshToken,
} from "../../../core/auth/portalSession.js";

const parseDuration = (duration, fallback = 30 * 86400000) => {
    const match = String(duration || "").match(/^(\d+)\s*(s|m|h|d)$/);
    if (!match) return fallback;
    return Number(match[1]) * ({ s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]] || 1);
};

export const SESSION_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const sessionPolicy = () => ({ inactivityTimeoutMs: SESSION_INACTIVITY_TIMEOUT_MS });

export const hashToken = (raw) => crypto.createHash("sha256").update(String(raw)).digest("hex");
const requestPortal = (req, override) =>
    normalizePortalScope(override || req?.authPortalOverride || getPortalScope(req));

const toStringId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "bigint") return String(value);
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") {
        const result = value.toString();
        return result === "[object Object]" ? "" : result;
    }
    return "";
};

export const safeAuthUser = (user) => ({
    id: toStringId(user._id || user.id),
    name: user.name,
    email: user.email || null,
    mobile: user.mobile || user.phone || null,
    phone: user.mobile || user.phone || "",
    emailVerified: Boolean(user.emailVerified),
    mobileVerified: Boolean(user.mobileVerified),
    avatar: normalizeProfileAvatar(user.avatar),
    role: user.role,
    accountStatus: user.accountStatus || "active",
    agentRef: user.agentRef || "",
    agencyRef: user.agencyRef || "",
    partnerAgencyRef: user.partnerAgencyRef || "",
    agentApprovalStatus: user.agentApprovalStatus || "not_required",
    adminLevel: user.adminLevel || "none",
    adminApprovalStatus: user.adminApprovalStatus || "not_required",
    agencyRole: user.agencyRole || "none",
    agencyId: toStringId(user.agencyId) || null,
    productAccess: user.productAccess || [],
    internalTeamRoles: user.internalTeamRoles || [],
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
});

const signAccessToken = (user, portal, sessionId) =>
    jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email || null,
            tokenVersion: user.tokenVersion || 0,
            portal,
            sid: sessionId,
        },
        config.JWT.accessSecret,
        { expiresIn: config.JWT.accessExpires },
    );

const setCookie = (res, name, value, maxAge) => {
    res.cookie(name, value, portalCookieOptions({ maxAge }));
};

export const clearAuthCookies = (req, res, portalOverride) => {
    const names = getPortalCookieNames(requestPortal(req, portalOverride));
    setCookie(res, names.access, "", 0);
    setCookie(res, names.refresh, "", 0);
};

export const createSession = async ({
    user,
    req,
    res,
    portal: portalOverride,
    family = null,
    rememberMe = false,
}) => {
    const normalizedAvatar = normalizeProfileAvatar(user.avatar);
    if (user.avatar !== normalizedAvatar) {
        const previousAvatar = user.avatar ?? null;
        user.avatar = normalizedAvatar;
        await User.updateOne(
            { _id: user._id, avatar: previousAvatar },
            { $set: { avatar: normalizedAvatar } },
        );
    }
    const portal = requestPortal(req, portalOverride);
    const rawRefreshToken = crypto.randomBytes(48).toString("base64url");
    const sessionId = crypto.randomUUID();
    const refreshExpiresAt = new Date(Date.now() + parseDuration(config.JWT.refreshExpires));
    const refreshFamily = family || crypto.randomUUID();

    await RefreshToken.create({
        userId: user._id,
        portal,
        tokenHash: hashToken(rawRefreshToken),
        family: refreshFamily,
        sessionId,
        expiresAt: refreshExpiresAt,
        userAgent: String(req.get?.("user-agent") || "").slice(0, 500),
        ipAddress: String(req.ip || "").slice(0, 100),
        lastUsedAt: new Date(),
        rememberMe: rememberMe === true,
    });

    const accessToken = signAccessToken(user, portal, sessionId);
    const names = getPortalCookieNames(portal);
    setCookie(
        res,
        names.access,
        accessToken,
        rememberMe ? parseDuration(config.JWT.accessExpires, 15 * 60000) : undefined,
    );
    setCookie(
        res,
        names.refresh,
        rawRefreshToken,
        rememberMe ? parseDuration(config.JWT.refreshExpires) : undefined,
    );

    return {
        status: "success",
        success: true,
        authenticated: true,
        portal,
        user: safeAuthUser(user),
        sessionVersion: String(user.tokenVersion || 0),
        config: { session: sessionPolicy() },
    };
};

export const revokeCurrentSession = async (req, res, portalOverride) => {
    const portal = requestPortal(req, portalOverride);
    const raw = readPortalRefreshToken({
        ...req,
        headers: { ...req.headers, "x-travelstrem-portal": portal },
    });
    if (raw) {
        await RefreshToken.updateOne(
            { tokenHash: hashToken(raw), portal, revokedAt: null },
            { $set: { revokedAt: new Date() } },
        );
    }
    clearAuthCookies(req, res, portal);
};

export const revokePresentedRefreshToken = async (req, portalOverride) => {
    const portal = requestPortal(req, portalOverride);
    const scopedReq = { ...req, headers: { ...req.headers, "x-travelstrem-portal": portal } };
    const raw = readPortalRefreshToken(scopedReq);
    if (!raw) return;
    await RefreshToken.updateOne(
        { tokenHash: hashToken(raw), portal, revokedAt: null },
        { $set: { revokedAt: new Date() } },
    );
};

export const revokeUserSessions = (userId, portal = null) =>
    RefreshToken.updateMany(
        { userId, revokedAt: null, ...(portal ? { portal: normalizePortalScope(portal) } : {}) },
        { $set: { revokedAt: new Date() } },
    );

export const rotateSession = async ({ req, res, portal: portalOverride }) => {
    const portal = requestPortal(req, portalOverride);
    const scopedReq = { ...req, headers: { ...req.headers, "x-travelstrem-portal": portal } };
    const raw = readPortalRefreshToken(scopedReq);
    if (!raw) {
        clearAuthCookies(req, res, portal);
        return null;
    }

    await RefreshToken.cleanupExpired();
    const stored = await RefreshToken.findOne({ tokenHash: hashToken(raw), portal });
    if (!stored || stored.expiresAt <= new Date()) {
        clearAuthCookies(req, res, portal);
        return null;
    }

    const lastActivityAt = new Date(stored.lastUsedAt || stored.createdAt || 0).getTime();
    if (!lastActivityAt || Date.now() - lastActivityAt >= SESSION_INACTIVITY_TIMEOUT_MS) {
        await RefreshToken.updateMany(
            { family: stored.family, revokedAt: null },
            { $set: { revokedAt: new Date() } },
        );
        clearAuthCookies(req, res, portal);
        return null;
    }

    // Keep refresh records issued before the authentication migration usable.
    if (!stored.sessionId) stored.sessionId = crypto.randomUUID();
    if (stored.revokedAt) {
        await RefreshToken.updateMany(
            { family: stored.family, revokedAt: null },
            { $set: { revokedAt: new Date() } },
        );
        clearAuthCookies(req, res, portal);
        return null;
    }

    const user = await User.findById(stored.userId);
    if (!user || user.accountStatus !== "active") {
        stored.revokedAt = new Date();
        await stored.save();
        clearAuthCookies(req, res, portal);
        return null;
    }

    stored.revokedAt = new Date();
    stored.lastUsedAt = new Date();
    const result = await createSession({
        user,
        req,
        res,
        portal,
        family: stored.family,
        rememberMe: stored.rememberMe === true,
    });
    const replacement = await RefreshToken.findOne({
        sessionId: { $ne: stored.sessionId },
        family: stored.family,
    }).sort({ createdAt: -1 });
    stored.replacedBySessionId = replacement?.sessionId || null;
    await stored.save();
    return result;
};

export const getSessionUser = async ({ req, res, portal: portalOverride, allowRefresh = true }) => {
    const portal = requestPortal(req, portalOverride);
    const scopedReq = { ...req, headers: { ...req.headers, "x-travelstrem-portal": portal } };
    const accessToken = readPortalAccessToken(scopedReq);
    if (accessToken) {
        try {
            const payload = jwt.verify(accessToken, config.JWT.accessSecret);
            if (normalizePortalScope(payload.portal) !== portal) throw new Error("portal mismatch");
            const user = await User.findById(payload.sub);
            if (
                user &&
                Number(user.tokenVersion || 0) === Number(payload.tokenVersion || 0) &&
                user.accountStatus === "active"
            ) {
                if (payload.sid) {
                    await RefreshToken.updateOne(
                        { sessionId: payload.sid, portal, revokedAt: null },
                        { $set: { lastUsedAt: new Date() } },
                    ).catch((error) =>
                        console.warn(
                            "[auth] session activity touch failed:",
                            error?.message || error,
                        ),
                    );
                }
                return user;
            }
        } catch {
            const { access } = getPortalCookieNames(portal);
            setCookie(res, access, "", 0);
        }
    }
    if (!allowRefresh) return null;
    const rotated = await rotateSession({ req, res, portal });
    return rotated ? User.findById(rotated.user.id) : null;
};
