import mongoose from "mongoose";

const productAccessRequestSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  currentProducts: [{ type: String, trim: true, lowercase: true }],
  requestedProducts: [{ type: String, trim: true, lowercase: true }],
  reason: { type: String, trim: true, required: true, maxlength: 1200 },
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending", index: true },
  decisionNote: { type: String, trim: true, default: "", maxlength: 1200 },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  decidedAt: { type: Date, default: null },
}, { timestamps: true });

productAccessRequestSchema.index({ agencyId: 1, status: 1, createdAt: -1 });

export default mongoose.models.ProductAccessRequest || mongoose.model("ProductAccessRequest", productAccessRequestSchema);
