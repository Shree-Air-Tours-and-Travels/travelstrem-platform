import mongoose from "mongoose";
import {
    INTEGRATION_CAPABILITIES,
    INTEGRATION_ENTRY_STATUSES,
    INTEGRATION_OWNERS,
} from "../capabilities.js";

const secretLikeKey =
    /(secret|password|passphrase|private.?key|api.?key|access.?key|token|credential)/i;

function containsCredential(value) {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(containsCredential);
    return Object.entries(value).some(
        ([key, nested]) => secretLikeKey.test(key) || containsCredential(nested),
    );
}

const entrySchema = new mongoose.Schema(
    {
        capability: { type: String, enum: INTEGRATION_CAPABILITIES, required: true },
        provider: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: /^[a-z][a-z0-9-]{0,63}$/,
        },
        ownership: { type: String, enum: INTEGRATION_OWNERS, required: true },
        status: { type: String, enum: INTEGRATION_ENTRY_STATUSES, default: "draft" },
        secretRef: {
            type: String,
            default: "",
            trim: true,
            match: /^(|env:TENANT_INTEGRATION_[A-Z0-9_]{1,100}|aws-sm:[A-Za-z0-9/_+=.@-]{1,256}|gcp-sm:[A-Za-z0-9/_-]{1,256}|vault:[A-Za-z0-9/_-]{1,256})$/,
        },
        options: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
            validate: {
                validator: (value) => value && typeof value === "object" && !Array.isArray(value) &&
                    Object.entries(value).every(([key, item]) =>
                        ["timeoutMs", "requestTimeoutMs"].includes(key) && Number.isInteger(item) && item >= 1000 && item <= 60000),
                message: "Only bounded timeout options are accepted. Configure endpoints and credentials in deployment secrets.",
            },
        },
        validation: {
            status: {
                type: String,
                enum: ["not_run", "passed", "failed"],
                default: "not_run",
            },
            checkedAt: Date,
            scope: { type: String, default: "configuration_only" },
            code: String,
            message: String,
        },
        activatedAt: Date,
        activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { _id: false },
);

const profileSchema = new mongoose.Schema(
    {
        tenantId: { type: String, required: true, immutable: true },
        environment: {
            type: String,
            enum: ["development", "test", "staging", "production"],
            required: true,
        },
        status: { type: String, enum: ["draft", "active", "suspended"], default: "draft" },
        version: { type: Number, min: 1, default: 1 },
        entries: { type: [entrySchema], default: [] },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true },
);

profileSchema.index({ tenantId: 1, environment: 1 }, { unique: true });
profileSchema.pre("validate", function validateEntries(next) {
    const capabilities = this.entries.map((entry) => entry.capability);
    if (new Set(capabilities).size !== capabilities.length)
        return next(new Error("Each integration capability may be configured only once."));
    for (const entry of this.entries) {
        if (entry.ownership === "tenant" && !entry.secretRef)
            return next(new Error(`${entry.capability} requires a tenant secret reference.`));
        if (entry.status === "active" && entry.validation?.status !== "passed")
            return next(new Error(`${entry.capability} must pass validation before activation.`));
    }
    next();
});

export { containsCredential };
export default mongoose.models.TenantIntegrationProfile ||
    mongoose.model("TenantIntegrationProfile", profileSchema);
