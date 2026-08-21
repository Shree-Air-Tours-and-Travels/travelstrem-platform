import mongoose from "mongoose";

const userVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    type: {
        type: String,
        enum: ["login", "registration", "password_reset", "activation"],
        default: "login",
    },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

userVerificationSchema.statics.cleanupExpired = function () {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const UserVerification =
    mongoose.models?.UserVerification ||
    mongoose.model("UserVerification", userVerificationSchema);

export default UserVerification;
