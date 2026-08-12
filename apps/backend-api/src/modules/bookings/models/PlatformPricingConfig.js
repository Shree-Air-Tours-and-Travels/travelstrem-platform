import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  type: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" },
  value: { type: Number, min: 0, default: 0 }, // FIXED values are paise
  calculationBase: { type: String, enum: ["TOUR_ONLY", "TOUR_AND_ADDONS"], default: "TOUR_AND_ADDONS" },
  taxable: { type: Boolean, default: false },
}, { _id: false });

const schema = new mongoose.Schema({
  key: { type: String, unique: true, default: "default" },
  travelsTremFee: { type: feeSchema, default: () => ({}) },
  paymentFees: { type: Map, of: feeSchema, default: () => ({}) },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export default mongoose.models?.PlatformPricingConfig || mongoose.model("PlatformPricingConfig", schema);
