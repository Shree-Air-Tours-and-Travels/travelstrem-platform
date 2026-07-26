import BookingMessage from "../models/BookingMessage.js";

export const MessageService = {
  async send({ bookingId, senderId, senderType, senderName, content, messageType = "text", metadata = {} }, options = {}) {
    const [message] = await BookingMessage.create([{
      bookingId,
      senderId,
      senderType,
      senderName,
      content,
      messageType,
      metadata,
    }], options);
    return message;
  },

  async list(bookingId, { limit = 50, skip = 0, before = null } = {}) {
    const query = { bookingId };
    if (before) query.createdAt = { $lt: new Date(before) };
    return BookingMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  async count(bookingId) {
    return BookingMessage.countDocuments({ bookingId });
  },

  async countUnread(bookingId, forRole = "customer") {
    const query = { bookingId, readAt: null };
    if (forRole === "customer") query.senderType = { $ne: "customer" };
    else query.senderType = "customer";
    return BookingMessage.countDocuments(query);
  },

  async markRead(bookingId, forRole = "customer", options = {}) {
    const query = { bookingId, readAt: null };
    if (forRole === "customer") query.senderType = { $ne: "customer" };
    else query.senderType = "customer";
    return BookingMessage.updateMany(query, { $set: { readAt: new Date() } }, options);
  },

  async getLatest(bookingId) {
    return BookingMessage.findOne({ bookingId }).sort({ createdAt: -1 });
  },
};

export default MessageService;
