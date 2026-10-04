import AuditLog from "./models/AuditLog.js";
const sensitiveKey =
    /(password|passphrase|token|otp|secret|authorization|cookie|credential|api[_-]?key|access[_-]?key|private[_-]?key|smtp[_-]?pass|documentContent)/i;
export function sanitizeAuditPayload(value) {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(sanitizeAuditPayload);
    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => !sensitiveKey.test(key))
            .map(([key, entry]) => [key, sanitizeAuditPayload(entry)]),
    );
}
export async function audit(req, { action, entityType, entityId, agencyId, before, after }) {
    return AuditLog.create({
        actorId: req.access?.user?._id || req.user?.sub || null,
        actorRole: req.access?.role || req.user?.role || "public",
        tenantId: String(req.tenant?.id || req.access?.clientId || "travelstrem"),
        agencyId: agencyId || req.access?.agencyId || null,
        action,
        entityType,
        entityId: String(entityId),
        before: sanitizeAuditPayload(before),
        after: sanitizeAuditPayload(after),
        ip: req.ip || "",
        userAgent: req.headers?.["user-agent"] || "",
        correlationId: req.headers?.["x-request-id"] || "",
    });
}
