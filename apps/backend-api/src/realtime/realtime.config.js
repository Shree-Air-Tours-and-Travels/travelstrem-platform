import config from "../config/index.js";

/**
 * Realtime configuration. Everything is derived from the existing platform
 * configuration so no extra environment variables are required in practice:
 * - enabled: REALTIME_ENABLED (default "true")
 * - path: REALTIME_PATH (default "/socket.io")
 * - origins: FRONTENDS + CORS_ALLOWED_DOMAIN_SUFFIXES (+ localhost in dev)
 */

const parseList = (raw) => {
    if (Array.isArray(raw)) return raw.map((value) => String(value).trim()).filter(Boolean);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
            return parsed.map((value) => String(value).trim()).filter(Boolean);
    } catch {
        // comma-separated fallback
    }
    return String(raw)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
};

export const realtimeConfig = {
    enabled: String(process.env.REALTIME_ENABLED ?? "true").toLowerCase() !== "false",
    path: String(process.env.REALTIME_PATH || "/socket.io"),
    pingIntervalMs: Number(process.env.REALTIME_PING_INTERVAL_MS || 25000),
    pingTimeoutMs: Number(process.env.REALTIME_PING_TIMEOUT_MS || 20000),
    maxHttpBufferSize: Number(process.env.REALTIME_MAX_HTTP_BUFFER_SIZE || 65536),
    maxSubscriptionsPerSocket: Number(process.env.REALTIME_MAX_SUBSCRIPTIONS_PER_SOCKET || 100),
    rateLimit: {
        subscribeMax: Number(process.env.REALTIME_SUBSCRIBE_RATE_MAX || 30),
        windowSec: Number(process.env.REALTIME_SUBSCRIBE_RATE_WINDOW_SEC || 60),
    },
};

const allowedOrigins = Array.isArray(config.FRONTENDS) ? config.FRONTENDS : [];
const allowedDomainSuffixes = parseList(config.CORS_ALLOWED_DOMAIN_SUFFIXES).map((suffix) =>
    suffix.toLowerCase(),
);

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

/** Mirrors the express CORS policy for websocket upgrades. Never "*" in production. */
export function isRealtimeOriginAllowed(origin) {
    if (!origin) return true; // non-browser clients (server-to-server, tests)
    if (allowedOrigins.includes(origin)) return true;
    if (config.IS_DEVELOPMENT && /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) {
        return true;
    }
    return matchesAllowedDomainSuffix(origin);
}

export default realtimeConfig;
