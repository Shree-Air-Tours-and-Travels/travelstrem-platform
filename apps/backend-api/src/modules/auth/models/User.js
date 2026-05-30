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
    phone: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["member", "agent", "admin"],
        default: "member",
    },
    agentRef: { type: String, trim: true, default: "" },
    agencyRef: { type: String, trim: true, default: "" },
    partnerAgencyRef: { type: String, trim: true, default: "" },
    adminLevel: {
        type: String,
        enum: ["none", "standard", "master"],
        default: "none",
        index: true,
    },
    adminApprovalStatus: {
        type: String,
        enum: ["not_required", "pending", "approved", "rejected", "removed"],
        default: "not_required",
        index: true,
    },
    agentApprovalStatus: {
        type: String,
        enum: ["not_required", "pending", "approved", "rejected"],
        default: "not_required",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    avatar: { type: String, default: "user" },
    tokenVersion: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
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
    },
});

const User = mongoose.models?.User || mongoose.model("User", userSchema);
export default User;
