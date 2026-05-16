import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingTimelineSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  actorType: { type: String, enum: ["customer", "admin", "agent", "support", "system"], default: "system" },
  action: { type: String, required: true, trim: true, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

bookingTimelineSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingTimelineSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingTimelineSchema.index({ bookingId: 1, createdAt: -1 });

const BookingTimeline = mongoose.models?.BookingTimeline || mongoose.model("BookingTimeline", bookingTimelineSchema);
export default BookingTimeline;
