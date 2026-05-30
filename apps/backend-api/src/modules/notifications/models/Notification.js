import mongoose from "mongoose";
import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_CHANNEL_LIST,
  NOTIFICATION_RECIPIENT_TYPE,
  NOTIFICATION_RECIPIENT_TYPE_LIST,
} from "../../../constants/enums.js";

const { Schema } = mongoose;

export const NOTIFICATION_CHANNELS = NOTIFICATION_CHANNEL_LIST;

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null, index: true },
  recipientType: { type: String, enum: NOTIFICATION_RECIPIENT_TYPE_LIST, default: NOTIFICATION_RECIPIENT_TYPE.CUSTOMER, index: true },
  event: { type: String, trim: true, required: true, index: true },
  channels: { type: [String], enum: NOTIFICATION_CHANNELS, default: [NOTIFICATION_CHANNEL.IN_APP] },
  title: { type: String, trim: true, required: true },
  body: { type: String, trim: true, default: "" },
  metadata: { type: Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false, index: true },
  queuedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: true } });

notificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

notificationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ bookingId: 1, createdAt: -1 });

const Notification = mongoose.models?.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
