import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { QUOTE_STATUS_LIST } from "../../../constants/enums.js";

const { Schema } = mongoose;
const V2_STATUSES = ["ACTIVE", "EXPIRED", "CONSUMED", "INVALIDATED"];

const quoteItemSchema = new Schema({
  label: { type: String, trim: true, required: true },
  code: { type: String, trim: true, default: "" },
  pricingType: { type: String, enum: ["PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_ROOM", "PER_NIGHT", "PER_BOOKING", "FIXED", "PERCENTAGE"], default: "FIXED" },
  unitAmount: { type: Number, min: 0, default: 0 },
  quantity: { type: Number, min: 0, default: 1 },
  amount: { type: Number, default: 0 }, // Server-calculated extended amount.
  currency: { type: String, trim: true, default: "INR" },
  category: { type: String, trim: true, default: "inclusion" },
  optional: { type: Boolean, default: false },
  selected: { type: Boolean, default: true },
}, { _id: true });

// One collection supports historic agent quotes and checkout V2 quotes. The
// discriminator is quoteType; no historic financial record is rewritten.
const bookingQuoteSchema = new Schema({
  quoteType: { type: String, enum: ["LEGACY", "BOOKING_V2", "FINANCIAL"], default: "LEGACY", index: true },
  contextType: { type: String, trim: true, default: "" },
  contextId: { type: String, trim: true, default: "" },

  // Legacy agent-created quote fields.
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
  version: { type: Number, default: null },
  supersedesQuoteId: { type: Schema.Types.ObjectId, ref: "BookingQuote", default: null },
  quoteRef: { type: String, trim: true, default: "" },
  basePrice: { type: Number, default: 0 }, hotelPrice: { type: Number, default: 0 },
  flightPrice: { type: Number, default: 0 }, visaFee: { type: Number, default: 0 },
  insuranceFee: { type: Number, default: 0 }, taxes: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 }, discount: { type: Number, default: 0 },
  agentMarkup: { type: Number, default: 0 }, couponDiscount: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 }, transferPrice: { type: Number, default: 0 },
  activitiesPrice: { type: Number, default: 0 }, mealsPrice: { type: Number, default: 0 },
  amountPayableNow: { type: Number, default: 0 }, balanceDueDate: { type: Date, default: null },
  terms: { type: String, trim: true, default: "" },
  currency: { type: String, trim: true, default: "INR" },
  expirationDate: { type: Date, default: null }, finalAmount: { type: Number, default: 0 },
  items: { type: [quoteItemSchema], default: [] }, notes: { type: String, trim: true, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  sentAt: Date, acceptedAt: Date, rejectedAt: Date,
  changeRequest: {
    type: {
      guestCountChange: { type: Number, default: 0 },
      withFlights: { type: Boolean, default: null },
      notes: { type: String, trim: true, default: "" },
      requestedAt: { type: Date, default: null },
    },
    default: null,
  },

  // Customer checkout V2 quote fields.
  quoteNumber: { type: String, default: () => `BQ-${nanoid(10).toUpperCase()}` },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  guestSessionId: { type: String, trim: true, default: "", index: true },
  tourId: { type: Schema.Types.ObjectId, ref: "Tour", default: null },
  agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null },
  departureId: { type: String, default: "" },
  selections: { type: Schema.Types.Mixed, default: null },
  pricing: { type: Schema.Types.Mixed, default: null },
  moneyUnit: { type: String, enum: ["PAISE"], default: "PAISE" },
  idempotencyKey: { type: String, trim: true, default: "", index: true },
  configSnapshot: { type: Schema.Types.Mixed, default: null },
  financialSnapshot: { type: Schema.Types.Mixed, default: null },
  pricingVersion: { type: String, default: "V2" },
  expiresAt: { type: Date, default: null }, consumedAt: { type: Date, default: null },
  status: { type: String, enum: [...new Set([...QUOTE_STATUS_LIST, ...V2_STATUSES])], default: "READY", index: true },
}, { timestamps: true });

bookingQuoteSchema.pre("validate", function validateQuoteType(next) {
  if (this.quoteType === "BOOKING_V2") {
    if ((!this.userId && !this.guestSessionId) || !this.tourId || !this.pricing || !this.expiresAt) return next(new Error("V2 booking quote is incomplete"));
    if (!V2_STATUSES.includes(this.status)) this.status = "ACTIVE";
  } else if (this.quoteType === "LEGACY" && (!this.bookingId || this.version == null)) return next(new Error("Legacy booking quote is incomplete"));
  else if (this.quoteType === "FINANCIAL" && (!this.contextType || !this.contextId || !this.financialSnapshot || !this.configSnapshot)) return next(new Error("Financial quote is incomplete"));
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
bookingQuoteSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string", $gt: "" } } });

export default mongoose.models?.BookingQuote || mongoose.model("BookingQuote", bookingQuoteSchema);
