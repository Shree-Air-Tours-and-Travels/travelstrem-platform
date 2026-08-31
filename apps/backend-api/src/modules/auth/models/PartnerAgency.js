import mongoose from "mongoose";

const partnerAgencySchema = new mongoose.Schema(
    {
        agencyName: { type: String, required: true, trim: true },
        partnerAgencyRef: { type: String, required: true, unique: true, trim: true },
        legalName: { type: String, trim: true, default: "" },
        registrationNumber: { type: String, trim: true, default: "" },
        panNumber: { type: String, trim: true, uppercase: true, default: "" },
        address: {
            line1: String,
            line2: String,
            country: String,
            state: String,
            city: String,
            postalCode: String,
        },
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
        customTourPartner: { type: Boolean, default: false },
        settings: {
            timezone: { type: String, default: "Asia/Kolkata" },
            currency: { type: String, default: "INR" },
            locale: { type: String, default: "en-IN" },
            bookingPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
            tripPublishingPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
            bookingFees: {
                agentPercent: { type: Number, min: 0, default: 2 },
                servicePercent: { type: Number, min: 0, default: 2 },
                platformPercent: { type: Number, min: 0, default: 2 },
            },
            agentLimit: { type: Number, min: 0, default: 0 },
            sharedCustomers: { type: Boolean, default: false },
            subscriptionRef: { type: String, default: "" },
        },
        // V2 booking pricing policy. This is deliberately separate from legacy
        // settings.bookingFees, which is retained only to render historic records.
        feeConfig: {
            enabled: { type: Boolean, default: false },
            type: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" },
            value: { type: Number, min: 0, default: 0 }, // percentage or paise for FIXED
            chargingMode: {
                type: String,
                enum: ["CUSTOMER_FEE", "SETTLEMENT_DEDUCTION"],
                default: "SETTLEMENT_DEDUCTION",
            },
            taxable: { type: Boolean, default: false },
            updatedAt: { type: Date, default: null },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        },
        convertedFromRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnershipRequest",
            default: null,
        },
        suspendedAt: Date,
        deactivatedAt: Date,
    },
    { timestamps: true },
);

partnerAgencySchema.index(
    { customTourPartner: 1 },
    { unique: true, partialFilterExpression: { customTourPartner: true } },
);

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

const PartnerAgency =
    mongoose.models?.PartnerAgency || mongoose.model("PartnerAgency", partnerAgencySchema);
export default PartnerAgency;
