// server/config.js
/**
 * Central configuration for the server
 * - Loads .env.<NODE_ENV> if present, otherwise falls back to .env
 * - Exposes named exports and a default export object
 * - Designed to be a single import target for all controllers/middleware
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

/* ------------------------------
   1) Load environment file
   ------------------------------ */
// normalize node env early
const RAW_NODE_ENV = (process.env.NODE_ENV || "development").toString().trim();
const NODE_ENV = RAW_NODE_ENV || "development";

// Prefer .env.<env> when present (development/test). In production, rely on real env vars.
const projectRoot = process.cwd();
const envFileCandidate = path.join(projectRoot, `.env.${NODE_ENV}`);
if (NODE_ENV !== "production" && fs.existsSync(envFileCandidate)) {
    dotenv.config({ path: envFileCandidate });
    // Note: don't log secrets; only presence
    // eslint-disable-next-line no-console
    console.log(`✅ Loaded environment from ${envFileCandidate}`);
} else {
    // fallback to plain .env if present (safe no-op)
    dotenv.config();
    // eslint-disable-next-line no-console
    if (NODE_ENV !== "production") console.log(`⚠️ Loaded fallback .env (or none) for ${NODE_ENV}`);
}

/* ------------------------------
   2) Small helpers
   ------------------------------ */
const get = (key, fallback) => (typeof process.env[key] !== "undefined" ? process.env[key] : fallback);

const parseFrontends = (raw) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch (err) {
        // fallback to comma separated
    }
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
};

/* ------------------------------
   3) Core runtime settings
   ------------------------------ */
const IS_PRODUCTION = NODE_ENV === "production";
const IS_DEVELOPMENT = NODE_ENV === "development";
const IS_TEST = NODE_ENV === "test";

const APP_NAME = (get("APP_NAME", "TravelsTREM")).toString();
const PORT = Number(get("PORT", 5000));
const BASE_URL = (get("BASE_URL", `http://localhost:${PORT}`)).toString();

/* ------------------------------
   4) Frontends / CORS
   ------------------------------ */
const frontendsRaw = get("FRONTENDS", "http://localhost:3000");
const FRONTENDS = Array.isArray(frontendsRaw) ? frontendsRaw : parseFrontends(frontendsRaw);

/* ------------------------------
   5) JWT / Auth
   Accept both JWT_ACCESS_SECRET and JWT_SECRET for backward compatibility.
   ------------------------------ */
const jwtAccessEnv = get("JWT_ACCESS_SECRET", null);
const jwtFallbackEnv = get("JWT_SECRET", null); // allow JWT_SECRET as a fallback
const jwtRefreshEnv = get("JWT_REFRESH_SECRET", null);

const JWT = {
    accessSecret: (jwtAccessEnv || jwtFallbackEnv || get("JWT_SECRET_DEV", "dev_access_secret")).toString(),
    refreshSecret: (jwtRefreshEnv || get("JWT_REFRESH_SECRET_DEV", "dev_refresh_secret")).toString(),
    accessExpires: get("ACCESS_TOKEN_EXPIRES_IN", get("JWT_EXPIRES_IN", "15m")),
    refreshExpires: get("REFRESH_TOKEN_EXPIRES_IN", "30d"),
};

/* ------------------------------
   6) Admin creation secret (env-driven)
   - In production: require ADMIN_CREATION_SECRET
   - In non-production: allow ADMIN_CREATION_SECRET_DEV or fallback to dev secret
   ------------------------------ */
const ADMIN_CREATION_SECRET = IS_PRODUCTION
    ? (get("ADMIN_CREATION_SECRET", "")).toString().trim()
    : (get("ADMIN_CREATION_SECRET_DEV", get("ADMIN_CREATION_SECRET", "dev-secret-123"))).toString().trim();

if (IS_PRODUCTION && !ADMIN_CREATION_SECRET) {
    // Fail fast when missing in production
    throw new Error("Missing ADMIN_CREATION_SECRET in production environment!");
}

/* ------------------------------
   7) DB & Rate limiting
   ------------------------------ */
const MONGO_URI = IS_PRODUCTION
    ? (get("MONGO_URI", "")).toString().trim()
    : (get("MONGO_URI_DEV", "mongodb://127.0.0.1:27017/travelstrem")).toString().trim();

const RATE_LIMIT = {
    windowMs: Number(get("RATE_WINDOW_MS", 60 * 1000)), // ms
    max: Number(get("RATE_MAX", 60)),
};

/* ------------------------------
   8) Mail / SMTP
   ------------------------------ */
const SMTP = {
    host: get("SMTP_HOST", "") || null,
    port: Number(get("SMTP_PORT", 0)) || null,
    user: get("SMTP_USER", "") || null,
    pass: get("SMTP_PASS", "") || null,
    from: get("SMTP_FROM", "") || null,
};
const SMTP_AVAILABLE = Boolean(SMTP.host && SMTP.port && SMTP.user && SMTP.pass);

/* ------------------------------
   9) Dev helpers & features
   ------------------------------ */
const DEBUG = get("ENABLE_DEBUG_LOGS", IS_DEVELOPMENT ? "true" : "false") === "true";
const ENABLE_EMAILS = get("ENABLE_EMAILS", "false") === "true";
const DEV_DELAY_MS = Number(get("DEV_DELAY_MS", 3000));

/* ------------------------------
   10) OTP and other application-level settings
   ------------------------------ */
const OTP_TTL_MS = Number(get("OTP_TTL_MS", 15 * 60 * 1000)); // 15 minutes by default

/* ------------------------------
   11) Config summary helper
   ------------------------------ */
function logConfigSummary() {
    if (!DEBUG) return;
    // DO NOT print secrets
    console.log("=== Loaded config summary ===");
    console.log({
        NODE_ENV,
        APP_NAME,
        PORT,
        BASE_URL,
        IS_PRODUCTION,
        FRONTENDS: FRONTENDS.length,
        MONGO_URI: MONGO_URI ? "***SET***" : "MISSING",
        JWT_ACCESS_PRESENT: Boolean(JWT.accessSecret) ? "***SET***" : "MISSING",
        SMTP_AVAILABLE,
        ADMIN_CREATION_SECRET: ADMIN_CREATION_SECRET ? "***SET***" : "MISSING",
        RATE_LIMIT,
        DEV_DELAY_MS,
        DEBUG,
    });
    console.log("=============================");
}

/* ------------------------------
   12) Export (named + default)
   ------------------------------ */
const config = {
    NODE_ENV,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_TEST,
    APP_NAME,
    PORT,
    BASE_URL,
    FRONTENDS,
    JWT,
    ADMIN_CREATION_SECRET,
    MONGO_URI,
    RATE_LIMIT,
    SMTP,
    SMTP_AVAILABLE,
    ENABLE_EMAILS,
    DEBUG,
    DEV_DELAY_MS,
    OTP_TTL_MS,
    logConfigSummary,
};

export {
    NODE_ENV,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_TEST,
    APP_NAME,
    PORT,
    BASE_URL,
    FRONTENDS,
    JWT,
    ADMIN_CREATION_SECRET,
    MONGO_URI,
    RATE_LIMIT,
    SMTP,
    SMTP_AVAILABLE,
    ENABLE_EMAILS,
    DEBUG,
    DEV_DELAY_MS,
    OTP_TTL_MS,
    logConfigSummary,
};

export default config;
