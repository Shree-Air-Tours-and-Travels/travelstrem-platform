import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_PREFIX = "enc:v1:";

function getKey() {
    const secret = process.env.PII_ENCRYPTION_KEY;
    if (!secret) {
        throw new Error(
            "Missing PII_ENCRYPTION_KEY environment variable — required for encrypting PII fields.",
        );
    }
    return crypto.createHash("sha256").update(secret).digest();
}

export function encryptField(value) {
    if (value == null || value === "") return value || "";
    const plainText = String(value);
    if (plainText.startsWith(ENCRYPTION_PREFIX)) return plainText;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENCRYPTION_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptField(value) {
    if (!value || typeof value !== "string" || !value.startsWith(ENCRYPTION_PREFIX))
        return value || "";
    try {
        const payload = value.slice(ENCRYPTION_PREFIX.length);
        const [ivRaw, tagRaw, encryptedRaw] = payload.split(":");
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivRaw, "base64"));
        decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
        return Buffer.concat([
            decipher.update(Buffer.from(encryptedRaw, "base64")),
            decipher.final(),
        ]).toString("utf8");
    } catch (err) {
        return "";
    }
}

export function maskSecret(value, visible = 3) {
    const raw = decryptField(value);
    if (!raw) return "";
    const text = String(raw);
    if (text.length <= visible) return "X".repeat(text.length);
    return `${"X".repeat(Math.max(4, text.length - visible))}${text.slice(-visible)}`;
}

export function encryptedStringField(defaultValue = "") {
    return {
        type: String,
        default: defaultValue,
        set: encryptField,
        get: decryptField,
    };
}
