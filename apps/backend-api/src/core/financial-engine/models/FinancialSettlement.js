import mongoose from "mongoose";
const schema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            index: true,
        },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "BookingPayment", default: null },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnerAgency",
            default: null,
            index: true,
        },
        idempotencyKey: { type: String, required: true, unique: true },
        settlement: { type: mongoose.Schema.Types.Mixed, required: true },
        financialSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "PAID", "ADJUSTED", "FAILED"],
            default: "PENDING",
            index: true,
        },
        providerTransferId: { type: String, default: "" },
        refundAdjustments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    { timestamps: true },
);
export default mongoose.models?.FinancialSettlement ||
    mongoose.model("FinancialSettlement", schema);
