import jwt from "jsonwebtoken";
import config from "../config/index.js";
import User from "../modules/auth/models/User.js";
import PartnerAgency from "../modules/auth/models/PartnerAgency.js";
import { getPortalCookieNames, normalizePortalScope } from "../core/auth/portalSession.js";
import { REALTIME_ERROR_CODES } from "./realtime.constants.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;

const authFailure = (message, code = REALTIME_ERROR_CODES.UNAUTHORIZED) => ({
    ok: false,
    code,
    message,
});

function readCookie(cookieHeader, name) {
    if (!cookieHeader || !name) return null;
    for (const part of cookieHeader.split(";")) {
        const separator = part.indexOf("=");
        if (separator === -1) continue;
        if (part.slice(0, separator).trim() !== name) continue;
        return decodeURIComponent(part.slice(separator + 1).trim());
    }
    return null;
}

/**
 * Authenticates a Socket.IO handshake using the platform's existing JWT
 * session (HttpOnly portal cookie or Bearer token). No second login system.
 *
 * Browser websocket upgrades cannot send custom headers, so the portal scope
 * is passed in the handshake auth payload and selects the matching portal
 * cookie. The JWT payload's own portal claim must match the requested scope.
 */
export async function authenticateHandshake(handshake) {
    if (!JWT_SECRET)
        return authFailure(
            "Server authentication is not configured.",
            REALTIME_ERROR_CODES.INTERNAL_ERROR,
        );

    const portal = normalizePortalScope(handshake?.auth?.portal);
    let token = typeof handshake?.auth?.token === "string" ? handshake.auth.token : null;
    if (!token) {
        const { access } = getPortalCookieNames(portal);
        token = readCookie(handshake?.headers?.cookie, access);
    }
    if (!token) return authFailure("Authentication required.");

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload.portal || normalizePortalScope(payload.portal) !== portal) {
            return authFailure("Session belongs to a different portal.");
        }

        const user = await User.findById(payload.sub)
            .select("role adminLevel agencyRole agencyId accountStatus tokenVersion")
            .lean();
        if (!user || Number(user.tokenVersion || 0) !== Number(payload.tokenVersion || 0)) {
            return authFailure("Session has been revoked.");
        }
        if ((user.accountStatus || "active") !== "active") {
            return authFailure(`Account is ${user.accountStatus}.`, REALTIME_ERROR_CODES.FORBIDDEN);
        }
        if (user.agencyId) {
            const agency = await PartnerAgency.findById(user.agencyId).select("status").lean();
            if (!agency || agency.status !== "active") {
                return authFailure("Agency access is not active.", REALTIME_ERROR_CODES.FORBIDDEN);
            }
        }

        // Only safe identity fields ever reach the socket context.
        return {
            ok: true,
            context: {
                userId: String(user._id),
                role: user.role,
                adminLevel: user.adminLevel || "none",
                agencyId: user.agencyId ? String(user.agencyId) : null,
                agencyRole: user.agencyRole || "none",
                portal,
                sessionId: payload.sessionId ? String(payload.sessionId) : null,
            },
        };
    } catch {
        return authFailure("Invalid or expired session.");
    }
}

export default authenticateHandshake;
