import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
const { Schema } = mongoose;
export const PAYMENT_SESSION_STATUSES = [
    "CREATED",
    "PENDING",
    "PROCESSING",
    "PAID",
    "FAILED",
    "EXPIRED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
];
const sessionSchema = new Schema(
    {
        sessionId: {
            type: String,
            unique: true,
            default: () => `ps_${randomBytes(24).toString("hex")}`,
        },
        bookingId: { type: Schema.Types.ObjectId, required: true },
        bookingType: { type: String, enum: ["booking", "flight"], required: true },
        userId: { type: Schema.Types.ObjectId, required: true },
        sourceApp: String,
        portal: { type: String, enum: ["customer", "partner", "admin"], default: "customer" },
        quoteId: { type: Schema.Types.ObjectId, required: true },
        quoteVersion: Number,
        expectedAmount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
        currency: { type: String, required: true },
        provider: { type: String, required: true },
        status: { type: String, enum: PAYMENT_SESSION_STATUSES, default: "CREATED" },
        providerOrderId: String,
        capturedPaymentId: String,
        activePaymentId: String,
        paymentRecordId: Schema.Types.ObjectId,
        orderStartedAt: Date,
        refundStartedAt: Date,
        supplierRefundId: String,
        returnUrl: String,
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
);
// Keep the same order across expired sessions and failed attempts: a second order
// must never be opened while the first can still capture a late payment.
sessionSchema.index({ bookingType: 1, bookingId: 1 }, { unique: true });
const transactionSchema = new Schema(
    {
        sessionId: { type: String, required: true, index: true },
        provider: String,
        providerPaymentId: { type: String, required: true },
        providerOrderId: String,
        amountMinor: Number,
        currency: String,
        status: { type: String, enum: ["PROCESSING", "PAID", "FAILED"] },
    },
    { timestamps: true },
);
transactionSchema.index({ provider: 1, providerPaymentId: 1 }, { unique: true });
const eventSchema = new Schema(
    {
        provider: String,
        eventId: String,
        digest: String,
        completedAt: Date,
    },
    { timestamps: true },
);
eventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
const refundSchema = new Schema(
    {
        sessionId: { type: String, index: true },
        provider: String,
        providerRefundId: String,
        providerPaymentId: String,
        amountMinor: Number,
        currency: String,
        status: { type: String, enum: ["PENDING", "REFUNDED", "FAILED"] },
    },
    { timestamps: true },
);
refundSchema.index({ provider: 1, providerRefundId: 1 }, { unique: true });
export const PaymentSession =
    mongoose.models.PaymentSession || mongoose.model("PaymentSession", sessionSchema);
export const PaymentTransaction =
    mongoose.models.PaymentTransaction || mongoose.model("PaymentTransaction", transactionSchema);
export const PaymentWebhookEvent =
    mongoose.models.PaymentWebhookEvent || mongoose.model("PaymentWebhookEvent", eventSchema);
export const Refund = mongoose.models.Refund || mongoose.model("Refund", refundSchema);
