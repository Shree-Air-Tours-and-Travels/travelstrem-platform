import mongoose from "mongoose";

const partnerAgencySchema = new mongoose.Schema({
    agencyName: { type: String, required: true, trim: true },
    partnerAgencyRef: { type: String, required: true, unique: true, trim: true },
    contactName: { type: String, trim: true, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    gstNumber: { type: String, trim: true, default: "" },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true,
    },
    notes: { type: String, trim: true, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
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
