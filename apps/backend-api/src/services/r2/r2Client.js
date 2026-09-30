import { S3Client } from "@aws-sdk/client-s3";
import { getR2Config, isR2Configured } from "./config.js";

let _client = null;

export function getR2Client() {
    if (_client) return _client;
    if (!isR2Configured()) return null;

    const cfg = getR2Config();
    _client = new S3Client({
        region: "auto",
        endpoint: cfg.endpoint,
        credentials: {
            accessKeyId: cfg.accessKeyId,
            secretAccessKey: cfg.secretAccessKey,
        },
    });
    return _client;
}

export function resetR2Client() {
    _client = null;
}

export default { getR2Client, resetR2Client };
