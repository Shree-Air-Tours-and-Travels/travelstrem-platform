import mongoose from "mongoose";
const documentSchema = new mongoose.Schema({ name: String, url: String, mimeType: String, size: Number }, { _id: true });
const statusHistorySchema = new mongoose.Schema({ status: String, note: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, changedAt: { type: Date, default: Date.now } }, { _id: false });
const schema = new mongoose.Schema({
  agencyName: { type: String, required: true, trim: true }, legalName: { type: String, trim: true, default: "" },
  registrationNumber: { type: String, trim: true, default: "", index: true }, gstNumber: { type: String, trim: true, uppercase: true, default: "", index: true },
  panNumber: { type: String, trim: true, uppercase: true, default: "", index: true }, website: { type: String, trim: true, default: "" },
  companyEmail: { type: String, required: true, trim: true, lowercase: true, index: true }, companyPhone: { type: String, trim: true, default: "" },
  address: { line1: String, line2: String, country: String, state: String, city: String, postalCode: String }, logo: { type: String, default: "" },
  yearsInBusiness: { type: Number, min: 0, default: 0 }, numberOfEmployees: { type: Number, min: 0, default: 0 }, approximateCustomerBase: { type: Number, min: 0, default: 0 },
  servicesOffered: [{ type: String, trim: true }], requestedProducts: [{ type: String, trim: true, lowercase: true }], notes: { type: String, default: "" },
  primaryContact: { fullName: { type: String, required: true }, designation: String, email: { type: String, required: true, lowercase: true }, mobile: String },
  documents: [documentSchema], internalNotes: [{ note: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, createdAt: { type: Date, default: Date.now } }],
  status: { type: String, enum: ["draft", "submitted", "under_review", "additional_information_required", "approved", "rejected", "converted"], default: "submitted", index: true },
  rejectionReason: { type: String, default: "" }, convertedAgency: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", default: null },
  history: [statusHistorySchema], submittedAt: { type: Date, default: Date.now }, convertedAt: Date,
}, { timestamps: true });
schema.index({ companyEmail: 1, status: 1 });
export default mongoose.models.PartnershipRequest || mongoose.model("PartnershipRequest", schema);
