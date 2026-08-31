const SENSITIVE_RESPONSE_KEYS = new Set([
    "password",
    "passwordHash",
    "currentPassword",
    "newPassword",
    "confirmPassword",
]);

export function sanitizeResponsePayload(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object") return value;

    // Preserve the JSON contracts of non-plain values before walking their
    // enumerable properties. Recursively spreading a Mongo ObjectId exposes
    // its internal buffer and destroys the identifier.
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value instanceof Date) return value;
    if (Buffer.isBuffer(value)) return value;

    if (seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
        const sanitizedArray = value.map((item) => sanitizeResponsePayload(item, seen));
        seen.delete(value);
        return sanitizedArray;
    }

    const prototype = Object.getPrototypeOf(value);
    if (
        prototype !== Object.prototype &&
        prototype !== null &&
        typeof value.toJSON === "function"
    ) {
        const jsonValue = value.toJSON();
        if (jsonValue !== value) {
            const sanitizedJson = sanitizeResponsePayload(jsonValue, seen);
            seen.delete(value);
            return sanitizedJson;
        }
    }

    const sanitized = {};
    for (const [key, item] of Object.entries(value)) {
        if (SENSITIVE_RESPONSE_KEYS.has(key)) continue;
        sanitized[key] = sanitizeResponsePayload(item, seen);
    }
    seen.delete(value);
    return sanitized;
}

export default sanitizeResponsePayload;
