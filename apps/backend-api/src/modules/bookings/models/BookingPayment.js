import mongoose from "mongoose";

const { Schema } = mongoose;

export const BOOKING_PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID", "REFUND_PENDING", "REFUNDED", "FAILED"];
export const BOOKING_PAYMENT_TYPES = ["deposit", "partial", "remaining", "refund"];

const bookingPaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, trim: true, default: "INR" },
  provider: { type: String, trim: true, default: "" },
  transactionId: { type: String, trim: true, default: "" },
  status: { type: String, enum: BOOKING_PAYMENT_STATUSES, default: "PAID", index: true },
  paymentDate: { type: Date, default: Date.now },
  receiptUrl: { type: String, trim: true, default: "" },
  type: { type: String, enum: BOOKING_PAYMENT_TYPES, default: "partial" },
  raw: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

bookingPaymentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingPaymentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingPaymentSchema.index({ bookingId: 1, status: 1 });
bookingPaymentSchema.index({ transactionId: 1 }, { sparse: true });

const BookingPayment = mongoose.models?.BookingPayment || mongoose.model("BookingPayment", bookingPaymentSchema);
export default BookingPayment;
