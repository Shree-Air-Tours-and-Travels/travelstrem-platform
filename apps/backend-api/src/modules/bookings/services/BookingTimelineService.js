import BookingTimeline from "../models/BookingTimeline.js";
import EventBus from "../../../core/eventBus/index.js";

export const BookingTimelineService = {
  async record({ bookingId, actor = {}, action, metadata = {} }, options = {}) {
    const [entry] = await BookingTimeline.create([{
      bookingId,
      actorId: actor.id || null,
      actorType: actor.type || "system",
      action,
      metadata,
    }], options);
    await EventBus.emit(action, { bookingId, actor, metadata, timelineId: entry._id });
    return entry;
  },

  list(bookingId, limit = 50) {
    return BookingTimeline.find({ bookingId }).sort({ createdAt: -1 }).limit(limit);
  },
};

export default BookingTimelineService;
