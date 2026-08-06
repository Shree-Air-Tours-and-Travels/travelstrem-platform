import mongoose from "mongoose";
const schema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", required: true, index: true }, ownerAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true }, email: { type: String, lowercase: true, trim: true, default: "" }, phone: { type: String, trim: true, default: "" }, notes: String,
  status: { type: String, enum: ["active", "inactive", "anonymized"], default: "active", index: true }, deletedAt: Date,
}, { timestamps: true });
schema.index({ agencyId: 1, email: 1 });
export default mongoose.models.AgencyCustomer || mongoose.model("AgencyCustomer", schema);
