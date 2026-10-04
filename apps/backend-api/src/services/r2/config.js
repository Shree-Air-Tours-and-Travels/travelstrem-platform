import { resolveTenantIntegration } from "../../modules/integrations/runtime.js";

function getEnv(key, fallback = "") {
    const value = process.env[key];
    return (typeof value === "string" ? value : "").trim() || fallback;
}

// Keep the existing document-storage API; choose the client's storage adapter
// through server configuration, never through a browser-supplied bucket or key.
export function getR2Config() {
    const runtime = resolveTenantIntegration("storage.documents");
    const provider = runtime.provider.toLowerCase();
    const secret = runtime.credentials;
    if (provider === "local") return null;
    if (provider === "s3") {
        const bucketName = secret.bucketName;
        const region = secret.region;
        if (!bucketName || !region) return null;
        const accessKeyId = secret.accessKeyId;
        const secretAccessKey = secret.secretAccessKey;
        if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) return null;
        return {
            provider, bucketName, region,
            // No explicit keys uses the AWS SDK credential chain (for example IAM roles).
            ...(accessKeyId ? { accessKeyId, secretAccessKey, sessionToken: secret.sessionToken || undefined } : {}),
        };
    }
    if (provider !== "r2") throw new Error("Unsupported DOCUMENT_STORAGE_PROVIDER.");
    const accountId = secret.accountId;
    const endpoint = secret.endpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
    const accessKeyId = secret.accessKeyId;
    const secretAccessKey = secret.secretAccessKey;
    const bucketName = secret.bucketName;
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) return null;
    return { provider, accountId, endpoint, accessKeyId, secretAccessKey, bucketName, region: "auto" };
}

export function isR2Configured() {
    const configured = Boolean(getR2Config());
    if (!configured && process.env.TENANT_CLIENT_ID && process.env.NODE_ENV === "production")
        throw Object.assign(new Error("Client document storage must be configured; local fallback is disabled in production."), { status: 503 });
    return configured;
}

export function getSignedUrlDefaultExpiry() {
    const raw = Number(process.env.R2_SIGNED_URL_EXPIRY_SECONDS || 600);
    return Math.min(3600, Math.max(60, raw || 600));
}

export default { isR2Configured, getR2Config, getSignedUrlDefaultExpiry };
