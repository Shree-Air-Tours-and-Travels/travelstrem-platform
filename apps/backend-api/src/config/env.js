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
import {
    validateGoogleConfiguration,
    validateMobileDevelopmentMode,
} from "../modules/auth/services/authConfigValidation.js";

/* ------------------------------
   1) Load environment file
   ------------------------------ */
// normalize node env early
const RAW_NODE_ENV = (process.env.NODE_ENV || "development").toString().trim();
const NODE_ENV = RAW_NODE_ENV || "development";
const IS_PRODUCTION_LIKE_ENV = NODE_ENV === "production" || NODE_ENV === "test";

// Runtime environment variables are primary. Local dotenv loading is opt-in.
const projectRoot = process.cwd();
const envFileCandidate = path.join(projectRoot, `.env.${NODE_ENV}`);
const localEnvFileCandidate = path.join(projectRoot, `.env.${NODE_ENV}.local`);
const USE_DOTENV = process.env.USE_DOTENV === "true";
if (USE_DOTENV && fs.existsSync(envFileCandidate)) {
    dotenv.config({ path: envFileCandidate });
    // Note: don't log secrets; only presence

    if (!IS_PRODUCTION_LIKE_ENV) console.log(`✅ Loaded environment from ${envFileCandidate}`);
} else {
    if (USE_DOTENV) dotenv.config();

    if (USE_DOTENV && !IS_PRODUCTION_LIKE_ENV)
        console.log(`⚠️ Loaded fallback .env (or none) for ${NODE_ENV}`);
}
if (USE_DOTENV && fs.existsSync(localEnvFileCandidate)) {
    dotenv.config({ path: localEnvFileCandidate, override: true });
    if (!IS_PRODUCTION_LIKE_ENV)
        console.log(`✅ Loaded local environment overrides from ${localEnvFileCandidate}`);
}

/* ------------------------------
   2) Small helpers
   ------------------------------ */
const hasEnv = (key) =>
    typeof process.env[key] !== "undefined" && String(process.env[key]).trim() !== "";
const get = (key, fallback) => (hasEnv(key) ? process.env[key] : fallback);
const getSecret = (keys, fallback) => {
    const candidates = Array.isArray(keys) ? keys : [keys];
    const key = candidates.find((candidate) => hasEnv(candidate));
    return key ? process.env[key] : fallback;
};

const normalizePortalEnv = (value) => {
    const raw = (value || "").toString().trim().toLowerCase();
    if (raw === "production" || raw === "prod") return "production";
    if (raw === "staging" || raw === "stage") return "staging";
    return "development";
};

const readPortalJsonConfig = () => {
    const portalEnv = normalizePortalEnv(process.env.PORTAL_ENV || NODE_ENV);
    const fileName = `${portalEnv}.json`;
    const candidates = [
        path.resolve(projectRoot, "../config", fileName),
        path.resolve(projectRoot, "config", fileName),
    ];

    const configPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!configPath) return {};

    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!IS_PRODUCTION_LIKE_ENV) console.log(`✅ Loaded portal config from ${configPath}`);
        return parsed;
    } catch (err) {
        throw new Error(`Failed to parse portal config ${configPath}: ${err.message}`);
    }
};

const portalJsonConfig = readPortalJsonConfig();

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
const IS_PRODUCTION = IS_PRODUCTION_LIKE_ENV;
const IS_DEVELOPMENT = NODE_ENV === "development";
const IS_TEST = NODE_ENV === "test";

const APP_NAME = get("APP_NAME", portalJsonConfig.appName || "TravelsTrem").toString();
const PORT = Number(get("PORT", portalJsonConfig?.backend?.port || 5000));
const BASE_URL = String(get("BASE_URL", portalJsonConfig?.backend?.baseUrl || "") || "").trim();

if (!BASE_URL) {
    throw new Error("Missing BASE_URL environment variable.");
}

/* ------------------------------
   4) Frontends / CORS
   ------------------------------ */
const frontendsRaw = get(
    "FRONTENDS",
    JSON.stringify(
        portalJsonConfig?.cors?.frontends ||
            [
                portalJsonConfig?.frontends?.shell?.baseUrl,
                portalJsonConfig?.frontends?.trevista?.baseUrl,
                portalJsonConfig?.frontends?.trevio?.baseUrl,
                portalJsonConfig?.frontends?.adminTREM?.baseUrl,
            ].filter(Boolean),
    ),
);
const FRONTENDS = Array.isArray(frontendsRaw) ? frontendsRaw : parseFrontends(frontendsRaw);
const parseList = (raw) => {
    if (Array.isArray(raw)) return raw.map((value) => String(value).trim()).filter(Boolean);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
            return parsed.map((value) => String(value).trim()).filter(Boolean);
    } catch (err) {
        // Comma-separated environment values are supported too.
    }
    return String(raw)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
};

const CORS_ALLOWED_DOMAIN_SUFFIXES = parseList(get("CORS_ALLOWED_DOMAIN_SUFFIXES", ""));
const TREVIO_URL = String(
    get("TREVIO_URL", portalJsonConfig?.frontends?.trevio?.baseUrl || "") || "",
).trim();
const TREVISTA_URL = String(
    get("TREVISTA_URL", portalJsonConfig?.frontends?.trevista?.baseUrl || "") || "",
).trim();
const SHELL_URL = String(
    get("SHELL_URL", portalJsonConfig?.frontends?.shell?.baseUrl || "") || "",
).trim();
const AUTH_APP_URL = String(
    get("AUTH_APP_URL", portalJsonConfig?.frontends?.auth?.baseUrl || "") || "",
).trim();
const PARTNER_URL = String(
    get(
        "PARTNER_URL",
        portalJsonConfig?.frontends?.partnerTREM?.baseUrl ||
            portalJsonConfig?.frontends?.agentTREM?.baseUrl ||
            (IS_DEVELOPMENT ? "http://localhost:3004" : ""),
    ) || "",
).trim();
const ADMIN_URL = String(
    get("ADMIN_URL", portalJsonConfig?.frontends?.adminTREM?.baseUrl || "") || "",
).trim();
const ADMIN_REMOTE_URL = String(
    get("ADMIN_REMOTE_URL", portalJsonConfig?.frontends?.adminTREM?.remoteEntry || ADMIN_URL) || "",
).trim();
const COMPANY_NAME = String(
    get("COMPANY_NAME", portalJsonConfig?.company?.name || APP_NAME) || "",
).trim();
const COMPANY_TAGLINE = String(
    get("COMPANY_TAGLINE", portalJsonConfig?.company?.tagline || "") || "",
).trim();
const SUPPORT_EMAIL = String(
    get("SUPPORT_EMAIL", portalJsonConfig?.company?.supportEmail || "") || "",
).trim();
// Operational inbox that receives customer enquiry notifications. It can be
// separated from public support later without changing form controllers.
const ENQUIRY_EMAIL = String(get("ENQUIRY_EMAIL", SUPPORT_EMAIL) || "").trim();
const SUPPORT_PHONE = String(
    get("SUPPORT_PHONE", portalJsonConfig?.company?.supportPhone || "") || "",
).trim();
const DEFAULT_TOUR_IMAGE = String(
    get("DEFAULT_TOUR_IMAGE", portalJsonConfig?.assets?.defaultTourImage || "") || "",
).trim();
const AGENT_EMAIL_DOMAIN = String(get("AGENT_EMAIL_DOMAIN", "") || "")
    .trim()
    .toLowerCase();
const INVITATION_TTL_HOURS = Math.min(
    168,
    Math.max(1, Number(get("INVITATION_TTL_HOURS", 48)) || 48),
);
const WHATSAPP_CHANNEL_URL = String(get("WHATSAPP_CHANNEL_URL", "") || "").trim();
const WHATSAPP_CHANNEL_NAME = String(get("WHATSAPP_CHANNEL_NAME", "") || "").trim();

/* ------------------------------
   5) JWT / Auth
   Accept both JWT_ACCESS_SECRET and JWT_SECRET for backward compatibility.
   ------------------------------ */
const jwtAccessEnv = getSecret("JWT_ACCESS_SECRET", null);
const jwtFallbackEnv = getSecret("JWT_SECRET", null); // allow JWT_SECRET as a fallback
const jwtRefreshEnv = getSecret("JWT_REFRESH_SECRET", null);

if (IS_PRODUCTION && !jwtAccessEnv && !jwtFallbackEnv) {
    throw new Error(
        "Missing JWT_ACCESS_SECRET (or JWT_SECRET) in production environment! " +
            "Set JWT_ACCESS_SECRET in your environment variables.",
    );
}

if (IS_PRODUCTION && !jwtRefreshEnv) {
    throw new Error(
        "Missing JWT_REFRESH_SECRET in production environment! " +
            "Set JWT_REFRESH_SECRET in your environment variables.",
    );
}

if (!jwtAccessEnv && !jwtFallbackEnv) {
    throw new Error(
        "Missing JWT_ACCESS_SECRET (or JWT_SECRET). " +
            "Set JWT_ACCESS_SECRET in your environment variables.",
    );
}

if (!jwtRefreshEnv) {
    throw new Error(
        "Missing JWT_REFRESH_SECRET. " + "Set JWT_REFRESH_SECRET in your environment variables.",
    );
}

const JWT = {
    accessSecret: (jwtAccessEnv || jwtFallbackEnv).toString(),
    refreshSecret: jwtRefreshEnv.toString(),
    accessExpires: get(
        "ACCESS_TOKEN_EXPIRES_IN",
        get("JWT_EXPIRES_IN", portalJsonConfig?.auth?.accessTokenExpiresIn || "15m"),
    ),
    refreshExpires: get(
        "REFRESH_TOKEN_EXPIRES_IN",
        portalJsonConfig?.auth?.refreshTokenExpiresIn || "30d",
    ),
};

/* ------------------------------
   6) Admin creation secret (env-driven)
   - In production: require ADMIN_CREATION_SECRET
   - In non-production: allow ADMIN_CREATION_SECRET_DEV or fallback to dev secret
   ------------------------------ */
const ADMIN_CREATION_SECRET = getSecret("ADMIN_CREATION_SECRET", "").toString().trim();

if (!ADMIN_CREATION_SECRET) {
    throw new Error("Missing ADMIN_CREATION_SECRET environment variable!");
}

/* ------------------------------
   7) DB & Rate limiting
   ------------------------------ */
const MONGO_URI = IS_PRODUCTION
    ? getSecret("MONGO_URI", portalJsonConfig?.backend?.mongoUri || "")
          .toString()
          .trim()
    : getSecret("MONGO_URI_DEV", getSecret("MONGO_URI", portalJsonConfig?.backend?.mongoUri || ""))
          .toString()
          .trim();

if (!MONGO_URI) {
    throw new Error(
        `Missing ${IS_PRODUCTION ? "MONGO_URI" : "MONGO_URI_DEV (or MONGO_URI)"} environment variable.`,
    );
}

const RATE_LIMIT = {
    windowMs: Number(get("RATE_WINDOW_MS", portalJsonConfig?.rateLimit?.windowMs || 60 * 1000)), // ms
    max: Number(get("RATE_MAX", portalJsonConfig?.rateLimit?.max || (IS_DEVELOPMENT ? 1000 : 60))),
};

/* ------------------------------
   8) Mail / SMTP
   ------------------------------ */
const SMTP = {
    host: get("SMTP_HOST", portalJsonConfig?.smtp?.host || "") || null,
    port: Number(get("SMTP_PORT", portalJsonConfig?.smtp?.port || 0)) || null,
    secure:
        String(get("SMTP_SECURE", portalJsonConfig?.smtp?.secure ?? "")).toLowerCase() === "true" ||
        (!hasEnv("SMTP_SECURE") &&
            Number(get("SMTP_PORT", portalJsonConfig?.smtp?.port || 0)) === 465),
    user: get("SMTP_USER", portalJsonConfig?.smtp?.user || "") || null,
    pass: get("SMTP_PASS", portalJsonConfig?.smtp?.pass || "") || null,
    fromName: get("SMTP_FROM_NAME", portalJsonConfig?.smtp?.fromName || COMPANY_NAME) || null,
    fromEmail:
        get("SMTP_FROM_EMAIL", get("SMTP_FROM", portalJsonConfig?.smtp?.fromEmail || "")) ||
        get("SMTP_USER", portalJsonConfig?.smtp?.user || "") ||
        null,
};
const SMTP_AVAILABLE = Boolean(SMTP.host && SMTP.port && SMTP.user && SMTP.pass && SMTP.fromEmail);

/* ------------------------------
   9) Dev helpers & features
   ------------------------------ */
const DEBUG =
    get(
        "ENABLE_DEBUG_LOGS",
        portalJsonConfig?.features?.debug ?? (IS_DEVELOPMENT ? "true" : "false"),
    ).toString() === "true";
const ENABLE_EMAILS =
    get("ENABLE_EMAILS", portalJsonConfig?.features?.emails ?? "false").toString() === "true";
const DEV_DELAY_MS = Number(get("DEV_DELAY_MS", portalJsonConfig?.features?.devDelayMs ?? 3000));

/* ------------------------------
    10) Cloudinary config
    ------------------------------ */
const CLOUDINARY_NAME = get("CLOUDINARY_NAME", portalJsonConfig?.cloudinary?.name || "") || null;
const CLOUDINARY_KEY = get("CLOUDINARY_KEY", portalJsonConfig?.cloudinary?.key || "") || null;
const CLOUDINARY_SECRET =
    get("CLOUDINARY_SECRET", portalJsonConfig?.cloudinary?.secret || "") || null;

/* ------------------------------
    10.5) Cloudflare R2 / Object Storage
    ------------------------------ */
const R2_ACCOUNT_ID = get("R2_ACCOUNT_ID", "") || "";
const R2_ACCESS_KEY_ID = get("R2_ACCESS_KEY_ID", "") || "";
const R2_SECRET_ACCESS_KEY = get("R2_SECRET_ACCESS_KEY", "") || "";
const R2_BUCKET_NAME = get("R2_BUCKET_NAME", "") || "";
const R2_ENDPOINT =
    get("R2_ENDPOINT", R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "") ||
    "";

/* ------------------------------
    11) OTP and other application-level settings
    ------------------------------ */
const OTP_TTL_MS = Number(
    get("OTP_TTL_MS", portalJsonConfig?.features?.otpTtlMs || 5 * 60 * 1000),
); // 5 minutes by default
const OTP_MAX_ATTEMPTS = Math.min(10, Math.max(3, Number(get("OTP_MAX_ATTEMPTS", 3)) || 3));
const OTP_RESEND_COOLDOWN_MS = Math.min(
    5 * 60 * 1000,
    Math.max(15 * 1000, Number(get("OTP_RESEND_COOLDOWN_MS", 30 * 1000)) || 30 * 1000),
);
// In non-production environments the OTP flow is bypassed: no OTP emails are
// sent and any submitted OTP is accepted. Production always keeps real OTPs.
const DEV_OTP_BYPASS = get("DEV_OTP_BYPASS", "false").toString() === "true";
if (IS_PRODUCTION && DEV_OTP_BYPASS)
    throw new Error("DEV_OTP_BYPASS cannot be enabled in production.");
const AUTH_COOKIE_DOMAIN = (
    get("AUTH_COOKIE_DOMAIN", portalJsonConfig?.auth?.cookieDomain || "") || ""
)
    .toString()
    .trim();

const GOOGLE_AUTH_ENABLED = String(get("GOOGLE_AUTH_ENABLED", "false")).toLowerCase() === "true";
const GOOGLE_CLIENT_ID = String(get("GOOGLE_CLIENT_ID", "") || "").trim();
const GOOGLE_CLIENT_SECRET = String(get("GOOGLE_CLIENT_SECRET", "") || "").trim();
const GOOGLE_CALLBACK_URL = String(
    get("GOOGLE_CALLBACK_URL", `${BASE_URL.replace(/\/$/, "")}/api/auth/google/callback`) || "",
).trim();
const GOOGLE_PLACES_API_KEY = String(get("GOOGLE_PLACES_API_KEY", "") || "").trim();
const GOOGLE_PLACES_API_BASE_URL = String(
    get("GOOGLE_PLACES_API_BASE_URL", "https://places.googleapis.com/v1") || "",
).replace(/\/$/, "");
const OAUTH_TRANSACTION_TTL_SECONDS = Math.min(
    900,
    Math.max(60, Number(get("OAUTH_TRANSACTION_TTL_SECONDS", 600)) || 600),
);

validateGoogleConfiguration({
    enabled: GOOGLE_AUTH_ENABLED,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackUrl: GOOGLE_CALLBACK_URL,
});

const MOBILE_AUTH_ENABLED = String(get("MOBILE_AUTH_ENABLED", "true")).toLowerCase() === "true";
const MOBILE_AUTH_PROVIDER = String(get("MOBILE_AUTH_PROVIDER", "") || "")
    .trim()
    .toLowerCase();
const MOBILE_AUTH_DEV_MODE = String(get("MOBILE_AUTH_DEV_MODE", "false")).toLowerCase() === "true";
const MOBILE_AUTH_TEST_OTP = String(get("MOBILE_AUTH_TEST_OTP", "") || "").trim();
const MOBILE_OTP_EXPIRY_SECONDS = Math.min(
    900,
    Math.max(60, Number(get("MOBILE_OTP_EXPIRY_SECONDS", 300)) || 300),
);
const MOBILE_OTP_MAX_ATTEMPTS = Math.min(
    10,
    Math.max(3, Number(get("MOBILE_OTP_MAX_ATTEMPTS", 5)) || 5),
);
const MOBILE_OTP_RESEND_COOLDOWN_SECONDS = Math.min(
    300,
    Math.max(15, Number(get("MOBILE_OTP_RESEND_COOLDOWN_SECONDS", 60)) || 60),
);

validateMobileDevelopmentMode({
    isProduction: IS_PRODUCTION,
    devMode: MOBILE_AUTH_DEV_MODE,
    testOtp: MOBILE_AUTH_TEST_OTP,
});

process.env.MONGO_URI = process.env.MONGO_URI || MONGO_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || JWT.accessSecret;
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || JWT.accessSecret;
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT.refreshSecret;
process.env.SMTP_HOST = process.env.SMTP_HOST || SMTP.host || "";
process.env.SMTP_PORT = process.env.SMTP_PORT || (SMTP.port ? String(SMTP.port) : "");
process.env.SMTP_SECURE = process.env.SMTP_SECURE || String(SMTP.secure);
process.env.SMTP_USER = process.env.SMTP_USER || SMTP.user || "";
process.env.SMTP_PASS = process.env.SMTP_PASS || SMTP.pass || "";
process.env.SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || SMTP.fromName || "";
process.env.SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP.fromEmail || "";
process.env.AGENT_WEBHOOK_URL =
    process.env.AGENT_WEBHOOK_URL || portalJsonConfig?.webhooks?.agentWebhookUrl || "";
process.env.CLOUDINARY_NAME = process.env.CLOUDINARY_NAME || CLOUDINARY_NAME || "";
process.env.CLOUDINARY_KEY = process.env.CLOUDINARY_KEY || CLOUDINARY_KEY || "";
process.env.CLOUDINARY_SECRET = process.env.CLOUDINARY_SECRET || CLOUDINARY_SECRET || "";

/* ------------------------------
    12) Master admin credentials (env only, no defaults)
    ------------------------------ */
const MASTER_ADMIN_EMAIL = (process.env.MASTER_ADMIN_EMAIL || "").toString().trim().toLowerCase();
const MASTER_ADMIN_PHONE = (process.env.MASTER_ADMIN_PHONE || "").toString().trim();
const MASTER_ADMIN_PIN = getSecret("MASTER_ADMIN_PIN", IS_DEVELOPMENT ? "123456" : "")
    .toString()
    .trim();

if (IS_PRODUCTION && !MASTER_ADMIN_PIN) {
    throw new Error("Missing MASTER_ADMIN_PIN environment variable!");
}
if (MASTER_ADMIN_PIN && !/^\d{6}$/.test(MASTER_ADMIN_PIN)) {
    throw new Error("MASTER_ADMIN_PIN must contain exactly 6 digits.");
}

/* ------------------------------
    13) Redis
    ------------------------------ */
const REDIS_URL = getSecret("REDIS_URL", portalJsonConfig?.redis?.url || "")
    .toString()
    .trim();
const ENABLE_REDIS_SOCKET_ADAPTER =
    get("ENABLE_REDIS_SOCKET_ADAPTER", "false").toString().trim().toLowerCase() === "true";

/* ------------------------------
    14) Config summary helper
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
        JWT_ACCESS_PRESENT: JWT.accessSecret ? "***SET***" : "MISSING",
        SMTP_AVAILABLE,
        ADMIN_CREATION_SECRET: ADMIN_CREATION_SECRET ? "***SET***" : "MISSING",
        CLOUDINARY: CLOUDINARY_NAME
            ? `***SET*** (${CLOUDINARY_NAME})`
            : "NOT_CONFIGURED (local fallback)",
        R2: R2_BUCKET_NAME ? `***SET*** (${R2_BUCKET_NAME})` : "NOT_CONFIGURED",
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
    CORS_ALLOWED_DOMAIN_SUFFIXES,
    TREVIO_URL,
    TREVISTA_URL,
    SHELL_URL,
    AUTH_APP_URL,
    PARTNER_URL,
    ADMIN_URL,
    ADMIN_REMOTE_URL,
    COMPANY_NAME,
    COMPANY_TAGLINE,
    SUPPORT_EMAIL,
    ENQUIRY_EMAIL,
    SUPPORT_PHONE,
    DEFAULT_TOUR_IMAGE,
    AGENT_EMAIL_DOMAIN,
    INVITATION_TTL_HOURS,
    WHATSAPP_CHANNEL_URL,
    WHATSAPP_CHANNEL_NAME,
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
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_MS,
    DEV_OTP_BYPASS,
    AUTH_COOKIE_DOMAIN,
    GOOGLE_AUTH_ENABLED,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    GOOGLE_PLACES_API_KEY,
    GOOGLE_PLACES_API_BASE_URL,
    OAUTH_TRANSACTION_TTL_SECONDS,
    MOBILE_AUTH_ENABLED,
    MOBILE_AUTH_PROVIDER,
    MOBILE_AUTH_DEV_MODE,
    MOBILE_AUTH_TEST_OTP,
    MOBILE_OTP_EXPIRY_SECONDS,
    MOBILE_OTP_MAX_ATTEMPTS,
    MOBILE_OTP_RESEND_COOLDOWN_SECONDS,
    CLOUDINARY_NAME,
    CLOUDINARY_KEY,
    CLOUDINARY_SECRET,
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_ENDPOINT,
    REDIS_URL,
    ENABLE_REDIS_SOCKET_ADAPTER,
    MASTER_ADMIN_EMAIL,
    MASTER_ADMIN_PHONE,
    MASTER_ADMIN_PIN,
    PORTAL_CONFIG: portalJsonConfig,
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
    CORS_ALLOWED_DOMAIN_SUFFIXES,
    TREVIO_URL,
    TREVISTA_URL,
    SHELL_URL,
    AUTH_APP_URL,
    PARTNER_URL,
    ADMIN_URL,
    ADMIN_REMOTE_URL,
    COMPANY_NAME,
    COMPANY_TAGLINE,
    SUPPORT_EMAIL,
    ENQUIRY_EMAIL,
    SUPPORT_PHONE,
    DEFAULT_TOUR_IMAGE,
    AGENT_EMAIL_DOMAIN,
    INVITATION_TTL_HOURS,
    WHATSAPP_CHANNEL_URL,
    WHATSAPP_CHANNEL_NAME,
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
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_MS,
    DEV_OTP_BYPASS,
    AUTH_COOKIE_DOMAIN,
    GOOGLE_AUTH_ENABLED,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    GOOGLE_PLACES_API_KEY,
    GOOGLE_PLACES_API_BASE_URL,
    OAUTH_TRANSACTION_TTL_SECONDS,
    MOBILE_AUTH_ENABLED,
    MOBILE_AUTH_PROVIDER,
    MOBILE_AUTH_DEV_MODE,
    MOBILE_AUTH_TEST_OTP,
    MOBILE_OTP_EXPIRY_SECONDS,
    MOBILE_OTP_MAX_ATTEMPTS,
    MOBILE_OTP_RESEND_COOLDOWN_SECONDS,
    CLOUDINARY_NAME,
    CLOUDINARY_KEY,
    CLOUDINARY_SECRET,
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_ENDPOINT,
    REDIS_URL,
    ENABLE_REDIS_SOCKET_ADAPTER,
    MASTER_ADMIN_EMAIL,
    MASTER_ADMIN_PHONE,
    MASTER_ADMIN_PIN,
    portalJsonConfig as PORTAL_CONFIG,
    logConfigSummary,
};

export default config;
