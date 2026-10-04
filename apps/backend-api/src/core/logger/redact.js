const sensitiveKey = /(password|passphrase|token|otp|secret|authorization|cookie|credential|api[_-]?key|access[_-]?key|private[_-]?key|smtp[_-]?pass|documentContent)/i;
export function redact(value, seen = new WeakSet()) {
    if (typeof value === "string") {
        let result = value.replace(/(mongodb(?:\+srv)?|https?):\/\/[^\s/@]+:[^\s/@]+@/gi, "$1://[REDACTED]@");
        for (const [key, secret] of Object.entries(process.env)) {
            if ((sensitiveKey.test(key) || key.startsWith("INTEGRATION_")) && secret?.length >= 8)
                result = result.split(secret).join("[REDACTED]");
        }
        return result;
    }
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    if (value instanceof Error) return { name: value.name, message: redact(value.message), stack: redact(value.stack) };
    if (Array.isArray(value)) return value.map((entry) => redact(entry, seen));
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : redact(entry, seen)]));
}
