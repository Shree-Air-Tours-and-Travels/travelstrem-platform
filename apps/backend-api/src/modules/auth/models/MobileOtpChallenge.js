import mongoose from "mongoose";

const mobileOtpChallengeSchema = new mongoose.Schema(
    {
        phoneNumber: { type: String, required: true, index: true },
        otpHash: { type: String, required: true },
        portal: { type: String, enum: ["customer", "admin", "partner"], default: "customer" },
        expiresAt: { type: Date, required: true },
        attemptCount: { type: Number, default: 0 },
        maxAttempts: { type: Number, required: true },
        verifiedAt: { type: Date, default: null },
        invalidatedAt: { type: Date, default: null },
        lastSentAt: { type: Date, default: Date.now },
        ipAddress: { type: String, default: "" },
    },
    { timestamps: true },
);

mobileOtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models?.MobileOtpChallenge ||
    mongoose.model("MobileOtpChallenge", mobileOtpChallengeSchema);
