import mongoose from "mongoose";

const { Schema } = mongoose;

const quoteItemSchema = new Schema({
  label: { type: String, trim: true, required: true },
  amount: { type: Number, default: 0 },
  currency: { type: String, trim: true, default: "INR" },
  category: { type: String, trim: true, default: "service" },
}, { _id: true });

const bookingQuoteSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  version: { type: Number, required: true },
  quoteRef: { type: String, trim: true, default: "" },
  basePrice: { type: Number, default: 0 },
  hotelPrice: { type: Number, default: 0 },
  flightPrice: { type: Number, default: 0 },
  visaFee: { type: Number, default: 0 },
  insuranceFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  agentMarkup: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  currency: { type: String, trim: true, default: "INR" },
  expirationDate: { type: Date, default: null },
  finalAmount: { type: Number, default: 0 },
  items: { type: [quoteItemSchema], default: [] },
  notes: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["DRAFT", "READY", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"], default: "READY", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  sentAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
}, { timestamps: true });

bookingQuoteSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingQuoteSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingQuoteSchema.index({ bookingId: 1, version: 1 }, { unique: true });

const BookingQuote = mongoose.models?.BookingQuote || mongoose.model("BookingQuote", bookingQuoteSchema);
export default BookingQuote;
