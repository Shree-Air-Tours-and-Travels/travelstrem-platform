import mongoose from "mongoose";

const partnerAgencySchema = new mongoose.Schema({
    agencyName: { type: String, required: true, trim: true },
    partnerAgencyRef: { type: String, required: true, unique: true, trim: true },
    legalName: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
    panNumber: { type: String, trim: true, uppercase: true, default: "" },
    address: { line1: String, line2: String, country: String, state: String, city: String, postalCode: String },
    logo: { type: String, default: "" },
    contactName: { type: String, trim: true, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    gstNumber: { type: String, trim: true, default: "" },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "active", "suspended", "deactivated"],
        // Agencies only become active through the reviewed conversion workflow.
        default: "pending",
        index: true,
    },
    notes: { type: String, trim: true, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    productAccess: [{ type: String, trim: true, lowercase: true }],
    settings: {
        timezone: { type: String, default: "Asia/Kolkata" }, currency: { type: String, default: "INR" }, locale: { type: String, default: "en-IN" },
        bookingPermissions: { type: mongoose.Schema.Types.Mixed, default: {} }, tripPublishingPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
        agentLimit: { type: Number, min: 0, default: 0 }, sharedCustomers: { type: Boolean, default: false }, subscriptionRef: { type: String, default: "" },
    },
    convertedFromRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PartnershipRequest", default: null },
    suspendedAt: Date, deactivatedAt: Date,
}, { timestamps: true });

partnerAgencySchema.virtual("id").get(function () {
    return this._id.toHexString();
});

partnerAgencySchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        delete ret._id;
    },
});

const PartnerAgency = mongoose.models?.PartnerAgency || mongoose.model("PartnerAgency", partnerAgencySchema);
export default PartnerAgency;
