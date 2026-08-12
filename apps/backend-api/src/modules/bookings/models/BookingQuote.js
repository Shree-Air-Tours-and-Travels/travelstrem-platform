import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { QUOTE_STATUS_LIST } from "../../../constants/enums.js";

const { Schema } = mongoose;
const V2_STATUSES = ["ACTIVE", "EXPIRED", "CONSUMED", "INVALIDATED"];

const quoteItemSchema = new Schema({
  label: { type: String, trim: true, required: true },
  amount: { type: Number, default: 0 },
  currency: { type: String, trim: true, default: "INR" },
  category: { type: String, trim: true, default: "service" },
}, { _id: true });

// One collection supports historic agent quotes and checkout V2 quotes. The
// discriminator is quoteType; no historic financial record is rewritten.
const bookingQuoteSchema = new Schema({
  quoteType: { type: String, enum: ["LEGACY", "BOOKING_V2"], default: "LEGACY", index: true },

  // Legacy agent-created quote fields.
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null, index: true },
  version: { type: Number, default: null },
  quoteRef: { type: String, trim: true, default: "" },
  basePrice: { type: Number, default: 0 }, hotelPrice: { type: Number, default: 0 },
  flightPrice: { type: Number, default: 0 }, visaFee: { type: Number, default: 0 },
  insuranceFee: { type: Number, default: 0 }, taxes: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 }, discount: { type: Number, default: 0 },
  agentMarkup: { type: Number, default: 0 }, couponDiscount: { type: Number, default: 0 },
  currency: { type: String, trim: true, default: "INR" },
  expirationDate: { type: Date, default: null }, finalAmount: { type: Number, default: 0 },
  items: { type: [quoteItemSchema], default: [] }, notes: { type: String, trim: true, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  sentAt: Date, acceptedAt: Date, rejectedAt: Date,

  // Customer checkout V2 quote fields.
  quoteNumber: { type: String, default: () => `BQ-${nanoid(10).toUpperCase()}` },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  guestSessionId: { type: String, trim: true, default: "", index: true },
  tourId: { type: Schema.Types.ObjectId, ref: "Tour", default: null },
  agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null },
  departureId: { type: String, default: "" },
  selections: { type: Schema.Types.Mixed, default: null },
  pricing: { type: Schema.Types.Mixed, default: null },
  pricingVersion: { type: String, default: "V2" },
  expiresAt: { type: Date, default: null }, consumedAt: { type: Date, default: null },
  status: { type: String, enum: [...new Set([...QUOTE_STATUS_LIST, ...V2_STATUSES])], default: "READY", index: true },
}, { timestamps: true });

bookingQuoteSchema.pre("validate", function validateQuoteType(next) {
  if (this.quoteType === "BOOKING_V2") {
    if ((!this.userId && !this.guestSessionId) || !this.tourId || !this.pricing || !this.expiresAt) return next(new Error("V2 booking quote is incomplete"));
    if (!V2_STATUSES.includes(this.status)) this.status = "ACTIVE";
  } else if (!this.bookingId || this.version == null) return next(new Error("Legacy booking quote is incomplete"));
  return next();
});

bookingQuoteSchema.virtual("id").get(function id() { return this._id.toHexString(); });
bookingQuoteSchema.set("toJSON", { virtuals: true, versionKey: false, transform: (_, ret) => { delete ret._id; } });
bookingQuoteSchema.index({ bookingId: 1, version: 1 }, {
  name: "bookingId_1_version_1",
  unique: true,
  partialFilterExpression: { bookingId: { $type: "objectId" }, version: { $type: "number" } },
});
bookingQuoteSchema.index({ quoteNumber: 1 }, {
  name: "quoteNumber_1",
  unique: true,
  partialFilterExpression: { quoteType: "BOOKING_V2", quoteNumber: { $type: "string" } },
});
bookingQuoteSchema.index({ expiresAt: 1 }, { name: "booking_quote_expiry", expireAfterSeconds: 0, partialFilterExpression: { quoteType: "BOOKING_V2" } });

export default mongoose.models?.BookingQuote || mongoose.model("BookingQuote", bookingQuoteSchema);
