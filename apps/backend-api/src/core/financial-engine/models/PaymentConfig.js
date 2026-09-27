import mongoose from "mongoose";
import { PRICING_SCOPE_TYPES } from "../constants/index.js";

const schema = new mongoose.Schema(
    {
        scopeType: {
            type: String,
            enum: PRICING_SCOPE_TYPES,
            required: true,
            index: true,
        },
        scopeId: { type: String, required: true, index: true },
        config: { type: mongoose.Schema.Types.Mixed, required: true },
        active: { type: Boolean, default: true, index: true },
        effectiveFrom: { type: Date, default: null },
        effectiveUntil: { type: Date, default: null },
        version: { type: Number, min: 1, default: 1 },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true },
);
schema.index({ scopeType: 1, scopeId: 1, version: -1 }, { unique: true });
export default mongoose.models?.PaymentConfig || mongoose.model("PaymentConfig", schema);
