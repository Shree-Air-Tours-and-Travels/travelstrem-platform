import mongoose from "mongoose";
const schema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnerAgency",
            required: true,
            index: true,
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["partner_admin", "partner_agent"], required: true },
        productKeys: [{ type: String, lowercase: true }],
        permissions: [{ type: String }],
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: true },
        usedAt: Date,
        revokedAt: Date,
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.models.Invitation || mongoose.model("Invitation", schema);
