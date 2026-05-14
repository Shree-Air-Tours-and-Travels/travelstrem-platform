import BookingStatusHistory from "../../../models/BookingStatusHistory.js";

export const StatusHistoryService = {
  async record({ bookingId, from, to, actor = {}, reason = "" }, options = {}) {
    const [entry] = await BookingStatusHistory.create([{
      bookingId,
      from,
      to,
      changedBy: actor.id || null,
      reason,
    }], options);
    return entry;
  },

  list(bookingId, limit = 50) {
    return BookingStatusHistory.find({ bookingId }).sort({ createdAt: -1 }).limit(limit);
  },
};

export default StatusHistoryService;
