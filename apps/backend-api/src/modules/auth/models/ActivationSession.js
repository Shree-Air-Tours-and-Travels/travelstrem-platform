import mongoose from "mongoose";

const activationSessionSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation", required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        expiresAt: { type: Date, required: true, index: true },
        usedAt: Date,
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

activationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

activationSessionSchema.statics.cleanupExpired = function () {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export default mongoose.models.ActivationSession ||
    mongoose.model("ActivationSession", activationSessionSchema);
