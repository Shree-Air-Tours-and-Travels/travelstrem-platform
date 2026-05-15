import NotificationRepository from "../repositories/NotificationRepository.js";
import NotificationQueue from "./NotificationQueue.js";

const SUPPORTED_CHANNELS = new Set(["in_app", "email", "sms", "push", "whatsapp"]);

export const NotificationService = {
  async notify({ userId, bookingId = null, event, channels = ["in_app"], title, body = "", metadata = {}, recipientType = "customer" }, options = {}) {
    const safeChannels = channels.filter((channel) => SUPPORTED_CHANNELS.has(channel));
    const notification = await NotificationRepository.create([{
      userId,
      bookingId,
      recipientType,
      event,
      channels: safeChannels.length ? safeChannels : ["in_app"],
      title,
      body,
      metadata,
    }], options).then((docs) => docs[0]);

    await NotificationQueue.enqueue({
      notificationId: notification._id,
      userId,
      bookingId,
      event,
      channels: notification.channels,
      title,
      body,
      metadata,
    });

    return notification;
  },

  async listForUser(userId, { limit = 20, skip = 0, unreadOnly = false } = {}) {
    const query = { userId };
    if (unreadOnly) query.isRead = false;
    const [items, unreadCount] = await Promise.all([
      NotificationRepository.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationRepository.countDocuments({ userId, isRead: false }),
    ]);
    return { items, unreadCount };
  },

  async markRead(userId, notificationId) {
    if (notificationId === "all") {
      await NotificationRepository.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
      return true;
    }
    await NotificationRepository.updateOne({ _id: notificationId, userId }, { $set: { isRead: true } });
    return true;
  },
};

export default NotificationService;
