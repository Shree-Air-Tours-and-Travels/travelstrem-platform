import mongoose from "mongoose";

const authIdentitySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        provider: { type: String, enum: ["GOOGLE", "MOBILE"], required: true },
        providerUserId: { type: String, required: true, trim: true },
        providerEmail: { type: String, default: null, lowercase: true, trim: true },
        providerPhone: { type: String, default: null, trim: true },
        verified: { type: Boolean, default: false },
        lastAuthenticatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

authIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });
authIdentitySchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.models?.AuthIdentity || mongoose.model("AuthIdentity", authIdentitySchema);
