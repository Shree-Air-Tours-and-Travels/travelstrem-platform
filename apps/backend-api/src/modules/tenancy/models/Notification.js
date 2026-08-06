import mongoose from "mongoose";

const schema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  type: { type: String, required: true, trim: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  entityType: { type: String, default: "" },
  entityId: { type: String, default: "" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  readAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ userId: 1, readAt: 1, createdAt: -1 });
export default mongoose.models.TenantNotification || mongoose.model("TenantNotification", schema);
