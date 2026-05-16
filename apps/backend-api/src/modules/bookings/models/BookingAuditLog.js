import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingAuditLogSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  action: { type: String, trim: true, required: true, index: true },
  before: { type: Schema.Types.Mixed, default: null },
  after: { type: Schema.Types.Mixed, default: null },
  changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  ip: { type: String, trim: true, default: "" },
  userAgent: { type: String, trim: true, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });

bookingAuditLogSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingAuditLogSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingAuditLogSchema.index({ bookingId: 1, createdAt: -1 });

const BookingAuditLog = mongoose.models?.BookingAuditLog || mongoose.model("BookingAuditLog", bookingAuditLogSchema);
export default BookingAuditLog;
