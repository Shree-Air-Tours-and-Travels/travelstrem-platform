// server/models/User.js
import mongoose from "mongoose";
import { DEFAULT_PROFILE_AVATAR } from "../profileAvatar.constants.js";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            default: undefined,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        phone: { type: String, trim: true, default: "" },
        mobile: { type: String, trim: true, default: undefined, unique: true, sparse: true },
        emailVerified: { type: Boolean, default: false },
        mobileVerified: { type: Boolean, default: false },
        passwordHash: { type: String, default: null, select: false },
        role: {
            type: String,
            enum: ["member", "agent", "admin"],
            default: "member",
        },
        agencyRole: {
            type: String,
            enum: ["none", "partner_admin", "partner_agent"],
            default: "none",
            index: true,
        },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnerAgency",
            default: null,
            index: true,
        },
        designation: { type: String, trim: true, default: "" },
        accountStatus: {
            type: String,
            enum: ["invited", "active", "suspended", "deactivated", "anonymized"],
            default: "active",
            index: true,
        },
        activatedAt: { type: Date, default: null },
        deactivatedAt: { type: Date, default: null },
        productAccess: [{ type: String, trim: true, lowercase: true }],
        permissionGrants: [{ type: String, trim: true }],
        permissionDenials: [{ type: String, trim: true }],
        internalTeamRoles: [
            {
                type: String,
                enum: ["support"],
                trim: true,
                lowercase: true,
            },
        ],
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
        avatar: { type: String, trim: true, default: DEFAULT_PROFILE_AVATAR },
        tokenVersion: { type: Number, default: 0 },
    },
    { timestamps: true },
);

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
