import BookingAuditLog from "../../../models/BookingAuditLog.js";

export const AuditService = {
  async record({ bookingId, action, before = null, after = null, actor = {}, reqMeta = {} }, options = {}) {
    const [entry] = await BookingAuditLog.create([{
      bookingId,
      action,
      before,
      after,
      changedBy: actor.id || null,
      ip: reqMeta.ip || "",
      userAgent: reqMeta.userAgent || "",
    }], options);
    return entry;
  },

  list(bookingId, limit = 50) {
    return BookingAuditLog.find({ bookingId }).sort({ createdAt: -1 }).limit(limit);
  },
};

export default AuditService;
