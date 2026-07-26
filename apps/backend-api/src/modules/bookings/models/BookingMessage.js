import mongoose from "mongoose";
import {
  MESSAGE_TYPE,
  MESSAGE_TYPE_LIST,
  MESSAGE_ACTOR_TYPE,
  MESSAGE_ACTOR_TYPE_LIST,
} from "../../../constants/enums.js";

const { Schema } = mongoose;

const bookingMessageSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  senderType: { type: String, enum: MESSAGE_ACTOR_TYPE_LIST, default: MESSAGE_ACTOR_TYPE.CUSTOMER },
  senderName: { type: String, trim: true, default: "" },
  content: { type: String, trim: true, required: true },
  messageType: { type: String, enum: MESSAGE_TYPE_LIST, default: MESSAGE_TYPE.TEXT },
  metadata: { type: Schema.Types.Mixed, default: {} },
  readAt: { type: Date, default: null },
}, { timestamps: true });

bookingMessageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingMessageSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

bookingMessageSchema.index({ bookingId: 1, createdAt: -1 });
bookingMessageSchema.index({ bookingId: 1, readAt: 1 });

const BookingMessage = mongoose.models?.BookingMessage || mongoose.model("BookingMessage", bookingMessageSchema);
export default BookingMessage;
