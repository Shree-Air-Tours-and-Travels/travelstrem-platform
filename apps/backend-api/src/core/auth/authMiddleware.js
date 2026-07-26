// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import config from "../../config/index.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
const IS_PRODUCTION = !!config.IS_PRODUCTION;
const USE_SHARED_COOKIE_DOMAIN = IS_PRODUCTION && Boolean((config.AUTH_COOKIE_DOMAIN || process.env.AUTH_COOKIE_DOMAIN || "").toString().trim());
const COOKIE_NAME = IS_PRODUCTION && !USE_SHARED_COOKIE_DOMAIN ? "__Host-token" : "token";

/**
 * authMiddleware - verifies JWT from httpOnly cookie or Bearer token; attaches decoded payload to req.user
 * Replies 401 if no token or invalid/expired.
 */
export default function authMiddleware(req, res, next) {
  const token = (() => {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (authHeader && authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];
    if (req.headers["x-ignore-cookie-auth"] === "true") return null;
    return req.cookies?.[COOKIE_NAME] || req.cookies?.token || req.cookies?.["__Host-token"] || null;
  })();

  if (!token) {
    return res.status(401).json({ status: "error", message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error("[authMiddleware] JWT verification failed:", err.message);
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}
