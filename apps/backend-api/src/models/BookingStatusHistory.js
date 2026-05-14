import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingStatusHistorySchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  from: { type: String, trim: true, default: "" },
  to: { type: String, trim: true, required: true, index: true },
  changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reason: { type: String, trim: true, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });

bookingStatusHistorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingStatusHistorySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingStatusHistorySchema.index({ bookingId: 1, createdAt: -1 });

const BookingStatusHistory = mongoose.models?.BookingStatusHistory || mongoose.model("BookingStatusHistory", bookingStatusHistorySchema);
export default BookingStatusHistory;
