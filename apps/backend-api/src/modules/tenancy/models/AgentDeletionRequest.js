import mongoose from "mongoose";
const schema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", required: true, index: true }, agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed", "cancelled"], default: "pending", index: true },
  decisionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, decisionNotes: String, decisionDate: Date,
}, { timestamps: true });
schema.index({ agentId: 1, status: 1 });
schema.index(
  { agentId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" }, name: "one_pending_deletion_per_agent" }
);
export default mongoose.models.AgentDeletionRequest || mongoose.model("AgentDeletionRequest", schema);
