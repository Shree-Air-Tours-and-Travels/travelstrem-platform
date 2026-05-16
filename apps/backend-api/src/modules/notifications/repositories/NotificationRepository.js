import Notification from "../models/Notification.js";

const NotificationRepository = {
  find(query = {}) {
    return Notification.find(query);
  },
  countDocuments(query = {}) {
    return Notification.countDocuments(query);
  },
  findByIdAndUpdate(id, payload, options) {
    return Notification.findByIdAndUpdate(id, payload, options);
  },
  updateMany(query, payload) {
    return Notification.updateMany(query, payload);
  },
  updateOne(query, payload) {
    return Notification.updateOne(query, payload);
  },
  create(payload) {
    return Notification.create(payload);
  },
};

export default NotificationRepository;
