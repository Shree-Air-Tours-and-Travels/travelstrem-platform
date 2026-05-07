// server/middleware/authMiddleware.js
import { config } from "dotenv";
import jwt from "jsonwebtoken";

const JWT_SECRET = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET || "replace_this_in_production";

/**
 * authMiddleware - verifies Bearer token; attaches decoded payload to req.user
 * Replies 401 if no token or invalid/expired.
 */
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload should contain: { sub, role, name, email, iat, exp }
    // attach full payload to req.user for controllers to use
    req.user = payload;
    // Helpful debug (remove in production)
    // console.log("[authMiddleware] token payload:", payload);
    return next();
  } catch (err) {
    console.error("[authMiddleware] JWT verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
