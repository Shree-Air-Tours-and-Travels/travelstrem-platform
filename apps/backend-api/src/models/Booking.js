// server/models/Booking.js
import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const { Schema } = mongoose;

// nanoid alphabet (omit confusing chars) and length
const nano = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8);

/**
 * Traveler info collected during booking flow.
 */
const travelerSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  age: { type: Number, min: 0 },
  gender: { type: String, enum: ["male", "female", "other", "prefer_not_say"], default: "prefer_not_say" },
  passportNumber: { type: String, default: "" },
  specialRequests: { type: String, default: "" },
}, { _id: true });

/**
 * Booking schema
 */
const bookingSchema = new Schema({
  // who made booking
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // reference to tour
  tour: { type: Schema.Types.ObjectId, ref: "Tour", required: true },

  // human-friendly booking reference
  bookingRef: { type: String, index: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  travelers: { type: [travelerSchema], default: [] },

  guestsCount: { type: Number, required: true },

  priceSnapshot: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    isFinal: { type: Boolean, default: false },
    source: { type: String, default: "manual" },
    matchedSeason: { type: String, default: null },
    note: { type: String, default: "" },
    perPerson: { type: Number, required: true },
    total: { type: Number, required: true },
  },

  seatsReserved: { type: Number, default: 1 },

  status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },

  payment: {
    method: { type: String, default: "" },
    providerId: { type: String, default: "" },
    amountPaid: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    paidAt: { type: Date },
    raw: { type: Schema.Types.Mixed, default: {} },
  },

  specialRequests: { type: String, default: "" },
  notes: { type: String, default: "" },

  cancelledAt: { type: Date },

}, { timestamps: true });

/* Virtual id */
bookingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

/* Ensure JSON output is clean */
bookingSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    delete ret._id;
  },
});

/* Generate bookingRef before validation if missing */
bookingSchema.pre("validate", function (next) {
  if (!this.bookingRef) {
    const datePart = (new Date()).toISOString().slice(0,10).replace(/-/g, ''); // e.g. 20251114
    this.bookingRef = `TREM-${datePart}-${nano()}`; // e.g. TREM-20251114-4G7K2H9J
  }
  // ensure guestsCount is set (defensive)
  if (!this.guestsCount || this.guestsCount < 1) {
    this.guestsCount = Array.isArray(this.travelers) && this.travelers.length > 0 ? this.travelers.length : (this.guestsCount || 1);
  }
  next();
});

/* Unique partial index on bookingRef — ignores docs without a string bookingRef */
bookingSchema.index(
  { bookingRef: 1 },
  {
    unique: true,
    partialFilterExpression: { bookingRef: { $exists: true, $type: "string" } },
  }
);

/* Instance helper to compute price from a Tour doc and a traveler count */
bookingSchema.statics.buildPriceSnapshot = function (tourDoc, targetDate, travelerCount = 1) {
  const season = typeof tourDoc.getCurrentPrice === "function"
    ? tourDoc.getCurrentPrice(targetDate)
    : (tourDoc.price || { min: 0, max: 0, currency: "INR", isFinal: false, source: "manual" });

  const perPerson = Math.round(((season.min || 0) + (season.max || 0)) / 2);
  const total = perPerson * travelerCount;

  return {
    min: season.min || 0,
    max: season.max || 0,
    currency: season.currency || "INR",
    isFinal: !!season.isFinal,
    source: season.source || "manual",
    matchedSeason: season.matchedSeason || null,
    note: season.note || "",
    perPerson,
    total,
  };
};

const Booking = mongoose.models?.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
