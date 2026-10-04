import { S3Client } from "@aws-sdk/client-s3";
import { getR2Config, isR2Configured } from "./config.js";
import { tenantIntegrationCacheKey } from "../../modules/integrations/runtime.js";

const clients = new Map();

export function getR2Client() {
    if (!isR2Configured()) return null;

    const cfg = getR2Config();
    const cacheKey = tenantIntegrationCacheKey("storage.documents", cfg.provider);
    if (clients.has(cacheKey)) return clients.get(cacheKey);
    const client = new S3Client({
        region: cfg.region,
        endpoint: cfg.endpoint,
        ...(cfg.accessKeyId
            ? {
                  credentials: {
                      accessKeyId: cfg.accessKeyId,
                      secretAccessKey: cfg.secretAccessKey,
                      ...(cfg.sessionToken ? { sessionToken: cfg.sessionToken } : {}),
                  },
              }
            : {}),
    });
    clients.set(cacheKey, client);
    return client;
}

export function resetR2Client() {
    clients.clear();
}

export default { getR2Client, resetR2Client };
