import mongoose from "mongoose";
const schema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", required: true, index: true },
  provider: { type: String, required: true, lowercase: true, trim: true },
  paymentMethods: { type: [String], default: [] },
  merchantAccountId: { type: String, trim: true, default: "" },
  routeAccountId: { type: String, trim: true, default: "" },
  financialOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ agencyId: 1, provider: 1 }, { unique: true });
export default mongoose.models?.AgencyMerchantConfig || mongoose.model("AgencyMerchantConfig", schema);
