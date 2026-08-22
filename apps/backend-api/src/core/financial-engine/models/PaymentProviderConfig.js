import mongoose from "mongoose";
const schema = new mongoose.Schema({
  provider: { type: String, required: true, lowercase: true, trim: true, unique: true },
  paymentMethods: { type: [String], default: [] },
  financialOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true, index: true },
  priority: { type: Number, default: 100 },
  // Secrets are environment references, never credential values.
  credentialRefs: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export default mongoose.models?.PaymentProviderConfig || mongoose.model("PaymentProviderConfig", schema);
