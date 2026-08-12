import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portal: { type: String, enum: ["customer", "admin", "partner"], default: "customer", required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    family: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null, index: true },
    replacedBySessionId: { type: String, default: null },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    lastUsedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

refreshTokenSchema.statics.cleanupExpired = function () {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const RefreshToken =
    mongoose.models?.RefreshToken ||
    mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
