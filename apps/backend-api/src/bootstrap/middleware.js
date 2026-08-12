import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import config from "../config/index.js";
import logger from "../shared/logger/index.js";
import { getRedis, disconnectRedis } from "../shared/redis/client.js";
import {
  generateCsrfToken,
  validateCsrfToken,
  appendAuditEvent,
} from "../shared/redis/store.js";

const allowedOrigins = Array.isArray(config.FRONTENDS) ? config.FRONTENDS : [];
const allowedDomainSuffixes = Array.isArray(config.CORS_ALLOWED_DOMAIN_SUFFIXES)
  ? config.CORS_ALLOWED_DOMAIN_SUFFIXES.map((suffix) => suffix.toLowerCase())
  : [];

const matchesAllowedDomainSuffix = (origin) => {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return allowedDomainSuffixes.some((suffix) => {
      const normalized = suffix.startsWith(".") ? suffix : `.${suffix}`;
      return hostname === normalized.slice(1) || hostname.endsWith(normalized);
    });
  } catch {
    return false;
  }
};

// Input sanitization middleware
function sanitizeInputMiddleware(req, res, next) {
  if (req.body && typeof req.body === "object") {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === "string") {
          obj[key] = obj[key]
            .replace(/<[^>]*>/g, "")
            .replace(/[<>]/g, "")
            .trim();
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (
      config.IS_DEVELOPMENT
      && /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)
    ) {
      return callback(null, true);
    }
    if (matchesAllowedDomainSuffix(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-ignore-cookie-auth",
    "X-CSRF-Token",
    "X-Travelstrem-Portal",
    "X-Guest-Session-Id",
  ],
  exposedHeaders: ["Content-Disposition"],
};

export default function registerMiddleware(app) {
  app.set("trust proxy", true);

  // Initialize Redis connection
  getRedis();

  // ── 1. CORS + Preflight (FIRST — must handle OPTIONS before anything else) ──
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // ── 2. Helmet (after CORS, before body parsers) ──
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // ── 3. Body parsers (before anything that reads req.body) ──
  app.use(app.express.json({ limit: "20mb" }));
  app.use(app.express.urlencoded({ extended: true }));

  // ── 4. Cookie parser (before CSRF validation, before auth) ──
  app.use(cookieParser());

  // ── 5. Request logging ──
  app.use(morgan(config.DEBUG ? "dev" : "combined"));

  // ── 6. Static files ──
  app.use("/uploads", app.express.static(path.resolve("uploads")));

  // ── 7. Security response headers ──
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    next();
  });

  // ── 8. Debug logging ──
  if (config.DEBUG) {
    app.use((req, res, next) => {
      logger.debug(new Date().toISOString(), req.method, req.originalUrl, "Origin:", req.headers.origin || "n/a");
      next();
    });
  }

  // ── 9. CSRF token endpoint (after CORS so preflight passes) ──
  app.get("/api/csrf-token", async (req, res) => {
    try {
      const token = await generateCsrfToken();
      res.json({ token });
    } catch (err) {
      console.error("[CSRF] Token generation failed:", err.message);
      res.status(500).json({ status: "error", message: "Failed to generate CSRF token" });
    }
  });

  // ── 10. CSRF validation for state-changing requests (optional — skip if no header) ──
  app.use((req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const csrfHeader = req.headers["x-csrf-token"];
      // Only validate if a token is provided; allow requests without it for backwards compat
      if (csrfHeader) {
        validateCsrfToken(csrfHeader).then((valid) => {
          if (!valid) {
            appendAuditEvent({ type: "csrf_invalid", ip: req.ip, path: req.path, method: req.method });
            return res.status(403).json({ status: "error", message: "Invalid or expired CSRF token" });
          }
          next();
        }).catch(() => next());
      } else {
        next();
      }
    } else {
      next();
    }
  });

  // ── 11. Input sanitization (after body parser) ──
  app.use(sanitizeInputMiddleware);

  // ── 12. Global rate limiter (production only) ──
  if (!config.IS_DEVELOPMENT) {
    app.use(rateLimit({
      windowMs: config.RATE_LIMIT.windowMs,
      max: config.RATE_LIMIT.max,
      skip: (req) => req.method === "OPTIONS",
    }));
  }

  // ── 13. Graceful shutdown ──
  const shutdown = async () => {
    console.log("[Middleware] Shutting down Redis connection...");
    await disconnectRedis();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
