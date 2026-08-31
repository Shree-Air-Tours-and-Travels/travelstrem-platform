function getEnv(key, fallback = "") {
    const value = process.env[key];
    return (typeof value === "string" ? value : "").trim() || fallback;
}

export function isR2Configured() {
    return Boolean(
        getEnv("R2_ACCOUNT_ID") &&
        getEnv("R2_ACCESS_KEY_ID") &&
        getEnv("R2_SECRET_ACCESS_KEY") &&
        getEnv("R2_BUCKET_NAME") &&
        getEnv("R2_ENDPOINT"),
    );
}

export function getR2Config() {
    if (!isR2Configured()) return null;
    return {
        accountId: getEnv("R2_ACCOUNT_ID"),
        accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
        bucketName: getEnv("R2_BUCKET_NAME"),
        endpoint: getEnv("R2_ENDPOINT"),
    };
}

export function getSignedUrlDefaultExpiry() {
    const raw = Number(process.env.R2_SIGNED_URL_EXPIRY_SECONDS || 600);
    return Math.min(3600, Math.max(60, raw || 600));
}

export default { isR2Configured, getR2Config, getSignedUrlDefaultExpiry };
