import mongoose from "mongoose";
import {
    PAYMENT_METHOD_LIST,
    PAYMENT_RECORD_STATUS,
    PAYMENT_RECORD_STATUS_LIST,
    PAYMENT_TYPE,
    PAYMENT_TYPE_LIST,
} from "../../../constants/enums.js";

const { Schema } = mongoose;

export const BOOKING_PAYMENT_STATUSES = PAYMENT_RECORD_STATUS_LIST;
export const BOOKING_PAYMENT_TYPES = PAYMENT_TYPE_LIST;

const bookingPaymentSchema = new Schema(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
        agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
        amount: { type: Number, required: true },
        amountMinor: { type: Number, min: 0, default: null },
        moneyUnit: { type: String, enum: ["PAISE"], default: "PAISE" },
        currency: { type: String, trim: true, default: "INR" },
        paymentMethod: { type: String, enum: PAYMENT_METHOD_LIST, default: "UPI" },
        provider: { type: String, trim: true, default: "manual" },
        transactionId: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: BOOKING_PAYMENT_STATUSES,
            default: PAYMENT_RECORD_STATUS.PENDING,
            index: true,
        },
        paymentDate: { type: Date, default: Date.now },
        submittedAt: { type: Date, default: null },
        receiptUrl: { type: String, trim: true, default: "" },
        paymentScreenshot: { type: String, trim: true, default: "" },
        remarks: { type: String, trim: true, default: "" },
        rejectionReason: { type: String, trim: true, default: "" },
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        verifiedAt: { type: Date, default: null },
        type: { type: String, enum: BOOKING_PAYMENT_TYPES, default: PAYMENT_TYPE.TOKEN },
        raw: { type: Schema.Types.Mixed, default: {} },
        quoteId: { type: Schema.Types.ObjectId, ref: "BookingQuote", default: null },
        idempotencyKey: { type: String, trim: true, default: "", index: true },
        providerEventId: { type: String, trim: true, default: "", index: true },
        providerPaymentId: { type: String, trim: true, default: "" },
        pricingSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
        financialSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
        configSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true },
);

bookingPaymentSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

bookingPaymentSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        delete ret._id;
    },
});

bookingPaymentSchema.index({ bookingId: 1, status: 1 });
bookingPaymentSchema.index(
    { bookingId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: PAYMENT_TYPE.TOKEN,
            status: PAYMENT_RECORD_STATUS.VERIFICATION,
        },
    },
);
bookingPaymentSchema.index(
    { idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string", $gt: "" } } },
);
bookingPaymentSchema.index(
    { providerEventId: 1 },
    { unique: true, partialFilterExpression: { providerEventId: { $type: "string", $gt: "" } } },
);
bookingPaymentSchema.index(
    { transactionId: 1 },
    {
        unique: true,
        partialFilterExpression: { transactionId: { $exists: true, $type: "string", $gt: "" } },
    },
);

const BookingPayment =
    mongoose.models?.BookingPayment || mongoose.model("BookingPayment", bookingPaymentSchema);
export default BookingPayment;
