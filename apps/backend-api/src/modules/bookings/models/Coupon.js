import mongoose from "mongoose";

const schema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  active: { type: Boolean, default: true }, validFrom: Date, validUntil: Date,
  discountType: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
  value: { type: Number, min: 0, required: true }, // basis points or paise
  maxDiscountMinor: { type: Number, min: 0, default: null },
  minimumBookingValueMinor: { type: Number, min: 0, default: 0 },
  appliesTo: { type: String, enum: ["TOUR_BASE", "TOUR_AND_ADDONS", "PLATFORM_FEE", "BOOKING_SUBTOTAL"], default: "TOUR_BASE" },
  usageLimit: { type: Number, min: 0, default: null }, perUserLimit: { type: Number, min: 0, default: null }, usageCount: { type: Number, min: 0, default: 0 },
  eligibleTours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }],
  eligibleAgencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency" }],
  eligibleDestinations: [{ type: String }],
}, { timestamps: true });
export default mongoose.models?.Coupon || mongoose.model("Coupon", schema);
