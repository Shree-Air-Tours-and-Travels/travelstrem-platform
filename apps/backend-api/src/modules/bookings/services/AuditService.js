import BookingAuditLog from "../models/BookingAuditLog.js";
import Booking from "../models/Booking.js";
import AuditLog from "../../tenancy/models/AuditLog.js";
import { sanitizeAuditPayload } from "../../tenancy/audit.service.js";

export const AuditService = {
  async record({ bookingId, action, before = null, after = null, actor = {}, reqMeta = {} }, options = {}) {
    const booking = await Booking.findById(bookingId).select("agencyId").lean().session(options.session || null);
    const [entry] = await BookingAuditLog.create([{
      bookingId,
      action,
      before,
      after,
      changedBy: actor.id || null,
      ip: reqMeta.ip || "",
      userAgent: reqMeta.userAgent || "",
    }], options);
    await AuditLog.create([{
      actorId: actor.id || null,
      actorRole: actor.role || actor.type || "unknown",
      agencyId: booking?.agencyId || null,
      action,
      entityType: "Booking",
      entityId: String(bookingId),
      before: sanitizeAuditPayload(before),
      after: sanitizeAuditPayload(after),
      ip: reqMeta.ip || "",
      userAgent: reqMeta.userAgent || "",
      correlationId: reqMeta.correlationId || "",
    }], options);
    return entry;
  },

  list(bookingId, limit = 50) {
    return BookingAuditLog.find({ bookingId }).sort({ createdAt: -1 }).limit(limit);
  },
};

export default AuditService;
