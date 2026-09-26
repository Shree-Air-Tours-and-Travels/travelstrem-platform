import mongoose from "mongoose";
const schema = new mongoose.Schema(
    {
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnerAgency",
            required: true,
            index: true,
        },
        ownerAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, lowercase: true, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        normalizedEmail: { type: String, trim: true, default: "", index: true },
        normalizedPhone: { type: String, trim: true, default: "", index: true },
        notes: { type: String, trim: true, default: "", maxlength: 4000 },
        tags: { type: [String], default: [] },
        source: {
            type: String,
            enum: ["manual", "enquiry", "booking", "import"],
            default: "manual",
            index: true,
        },
        lifecycleStage: {
            type: String,
            enum: ["lead", "prospect", "active", "repeat", "dormant"],
            default: "lead",
            index: true,
        },
        preferredContact: {
            type: String,
            enum: ["any", "email", "phone", "whatsapp"],
            default: "any",
        },
        enquiryRefs: { type: [String], default: [] },
        linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
        followUpAt: { type: Date, default: null, index: true },
        lastContactedAt: { type: Date, default: null },
        lastActivityAt: { type: Date, default: null, index: true },
        status: {
            type: String,
            enum: ["active", "inactive", "anonymized"],
            default: "active",
            index: true,
        },
        deletedAt: Date,
    },
    { timestamps: true },
);
schema.pre("validate", function normalizeCustomerIdentity() {
    this.normalizedEmail = String(this.email || "").trim().toLowerCase();
    this.email = this.normalizedEmail;
    this.normalizedPhone = String(this.phone || "").replace(/[^0-9+]/g, "");
    this.phone = String(this.phone || "").trim();
    this.tags = [...new Set((this.tags || []).map((tag) => String(tag).trim()).filter(Boolean))].slice(
        0,
        20,
    );
});
schema.index(
    { agencyId: 1, normalizedEmail: 1 },
    { unique: true, partialFilterExpression: { normalizedEmail: { $gt: "" } } },
);
schema.index(
    { agencyId: 1, normalizedPhone: 1 },
    { unique: true, partialFilterExpression: { normalizedPhone: { $gt: "" } } },
);
schema.index(
    { agencyId: 1, linkedUser: 1 },
    { unique: true, partialFilterExpression: { linkedUser: { $type: "objectId" } } },
);
schema.index({ agencyId: 1, ownerAgent: 1, status: 1, lifecycleStage: 1 });
export default mongoose.models.AgencyCustomer || mongoose.model("AgencyCustomer", schema);
