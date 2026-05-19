// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import config from "../../config/index.js";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET || "replace_this_in_production";
const IS_PRODUCTION = !!config.IS_PRODUCTION;
const COOKIE_NAME = IS_PRODUCTION ? "__Host-token" : "token";

/**
 * authMiddleware - verifies JWT from httpOnly cookie or Bearer token; attaches decoded payload to req.user
 * Replies 401 if no token or invalid/expired.
 */
export default function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME] || (() => {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    return authHeader.split(" ")[1];
  })();

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error("[authMiddleware] JWT verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
