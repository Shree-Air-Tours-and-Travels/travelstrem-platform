// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import config from "../../config/index.js";
import User from "../../modules/auth/models/User.js";
import PartnerAgency from "../../modules/auth/models/PartnerAgency.js";
import { getPortalScope, normalizePortalScope, readPortalAccessToken } from "./portalSession.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;

/**
 * authMiddleware - verifies JWT from httpOnly cookie or Bearer token; attaches decoded payload to req.user
 * Replies 401 if no token or invalid/expired.
 */
export default async function authMiddleware(req, res, next) {
  const token = (() => {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (authHeader && authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];
    if (req.headers["x-ignore-cookie-auth"] === "true") return null;
    return readPortalAccessToken(req);
  })();

  if (!token) {
    return res.status(401).json({ status: "error", code: "AUTH_REQUIRED", message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.portal || normalizePortalScope(payload.portal) !== getPortalScope(req)) {
      return res.status(401).json({ status: "error", code: "INVALID_SESSION", message: "Session belongs to a different portal." });
    }
    const user = await User.findById(payload.sub).select("role adminLevel agencyRole agencyId partnerAgencyRef accountStatus tokenVersion productAccess permissionGrants permissionDenials").lean();
    if (!user || Number(user.tokenVersion || 0) !== Number(payload.tokenVersion || 0)) {
      return res.status(401).json({ status: "error", code: "SESSION_REVOKED", message: "Session has been revoked." });
    }
    if ((user.accountStatus || "active") !== "active") {
      return res.status(403).json({ status: "error", message: `Account is ${user.accountStatus}.` });
    }
    if (user.agencyId) {
      const agency = await PartnerAgency.findById(user.agencyId).select("status").lean();
      if (!agency || agency.status !== "active") return res.status(403).json({ status: "error", message: "Agency access is not active." });
    }
    req.user = { ...payload, ...user, sub: payload.sub };
    return next();
  } catch (err) {
    return res.status(401).json({ status: "error", code: "INVALID_SESSION", message: "Invalid or expired session." });
  }
}
