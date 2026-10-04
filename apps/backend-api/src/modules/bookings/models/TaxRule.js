import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        active: { type: Boolean, default: true, index: true },
        rateBasisPoints: { type: Number, required: true, min: 0 },
        appliesTo: [
            { type: String, enum: ["TOUR", "ADDONS", "PLATFORM_FEE", "AGENCY_FEE", "PAYMENT_FEE"] },
        ],
        effectiveFrom: { type: Date, default: null },
        effectiveUntil: { type: Date, default: null },
    },
    { timestamps: true },
);
export default mongoose.models?.TaxRule || mongoose.model("TaxRule", schema);
