import mongoose from "mongoose";
const schema = new mongoose.Schema(
    {
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
        actorRole: { type: String, default: "public" },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnerAgency",
            default: null,
            index: true,
        },
        action: { type: String, required: true, index: true },
        entityType: { type: String, required: true, index: true },
        entityId: { type: String, required: true, index: true },
        before: { type: mongoose.Schema.Types.Mixed, default: null },
        after: { type: mongoose.Schema.Types.Mixed, default: null },
        ip: String,
        userAgent: String,
        correlationId: String,
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ agencyId: 1, createdAt: -1 });
export default mongoose.models.AuditLog || mongoose.model("AuditLog", schema);
