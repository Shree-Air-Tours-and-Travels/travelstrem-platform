const envKey = (name) =>
    `HOTEL_${String(name)
        .trim()
        .replace(/[^a-z0-9]+/gi, "_")
        .toUpperCase()}`;

const value = (key, fallback = "") => {
    const configured = process.env[key];
    return configured == null || String(configured).trim() === ""
        ? fallback
        : String(configured).trim();
};

const positiveInteger = (key, fallback, { allowZero = false } = {}) => {
    const parsed = Number(value(key, fallback));
    const minimum = allowZero ? 0 : 1;
    if (!Number.isSafeInteger(parsed) || parsed < minimum)
        throw new Error(`${key} must be an integer greater than or equal to ${minimum}.`);
    return parsed;
};

export const createHotelProviderConfig = (name) => {
    const prefix = envKey(name);
    return Object.freeze({
        name: String(name).trim().toLowerCase(),
        alias: value(`${prefix}_ALIAS`, String(name).trim().toLowerCase()),
        environment: value(`${prefix}_ENVIRONMENT`, "sandbox").toLowerCase(),
        baseUrl: value(`${prefix}_BASE_URL`),
        requestTimeoutMs: positiveInteger(`${prefix}_REQUEST_TIMEOUT_MS`, 30000),
        credentials: Object.freeze({
            apiKey: value(`${prefix}_API_KEY`),
            apiSecret: value(`${prefix}_API_SECRET`),
        }),
        mtls: Object.freeze({
            certificatePath: value(`${prefix}_MTLS_CERT_PATH`),
            privateKeyPath: value(`${prefix}_MTLS_KEY_PATH`),
            passphrase: value(`${prefix}_MTLS_PASSPHRASE`),
        }),
        rateLimit: Object.freeze({
            requests: positiveInteger(`${prefix}_RATE_LIMIT_REQUESTS`, 10),
            windowMs: positiveInteger(`${prefix}_RATE_LIMIT_WINDOW_SECONDS`, 1) * 1000,
        }),
        throttling: Object.freeze({
            intervalMs: positiveInteger(`${prefix}_THROTTLE_INTERVAL_MS`, 0, { allowZero: true }),
            retryLimit: positiveInteger(`${prefix}_THROTTLE_RETRY_LIMIT`, 2, { allowZero: true }),
        }),
        quota: Object.freeze({
            max: positiveInteger(`${prefix}_QUOTA_MAX`, 0, { allowZero: true }),
            resetMs: positiveInteger(`${prefix}_QUOTA_RESET_SECONDS`, 86400) * 1000,
        }),
    });
};

export const assertHotelProviderCredentials = (config) => {
    if (!config?.credentials?.apiKey || !config?.credentials?.apiSecret)
        throw new Error(`Missing credentials for hotel provider ${config?.name || "unknown"}.`);
    return config;
};

export default createHotelProviderConfig;
