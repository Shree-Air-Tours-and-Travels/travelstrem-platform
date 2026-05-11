// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["member", "agent", "admin"], // updated to match frontend roles
        default: "member",
    },
    createdAt: { type: Date, default: Date.now },

    // 🔹 Forgot/Reset password fields

    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date },
});

userSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
userSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        delete ret._id;
        delete ret.passwordHash; // never leak password hashes
        delete ret.resetPasswordOtp;
        delete ret.resetPasswordExpires;
    },
});

const User = mongoose.models?.User || mongoose.model("User", userSchema);
export default User;
