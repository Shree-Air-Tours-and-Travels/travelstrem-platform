import BookingPayment from "../modules/bookings/models/BookingPayment.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";
import PaymentConfig from "../core/financial-engine/models/PaymentConfig.js";
import AgencyMerchantConfig from "../core/financial-engine/models/AgencyMerchantConfig.js";
import PaymentProviderConfig from "../core/financial-engine/models/PaymentProviderConfig.js";
import FinancialLedgerEntry from "../core/financial-engine/models/FinancialLedgerEntry.js";
import FinancialSettlement from "../core/financial-engine/models/FinancialSettlement.js";
import RazorpayProvider from "../core/financial-engine/providers/razorpay.provider.js";
import { configureFinancialEngine } from "../core/financial-engine/index.js";
import { minorToDecimal } from "../core/financial-engine/utils/money.js";
import {
    REALTIME_EVENTS,
    bookingPaymentDto,
    bookingQuoteDto,
    publishFanOut,
    publishToBooking,
    publishToPayment,
} from "../realtime/index.js";
import { recordTourSignal } from "../modules/tours/services/tourIntelligence.service.js";

// Realtime fan-out for payment/quote state changes lives at this repository
// layer because it is the single idempotent funnel every payment transition
// passes through (checkout, gateway webhooks, manual verification).
const publishPaymentEvent = (event, payment) => {
    const dto = bookingPaymentDto(payment);
    try {
        publishToPayment(dto.paymentId, event, dto);
        if (dto.bookingId) publishToBooking(dto.bookingId, event, dto);
        publishFanOut({ userId: dto.createdBy || null, agencyId: dto.agencyId }, event, dto);
    } catch (err) {
        console.error(`[FinancialEngine] realtime publish failed (${event}):`, err?.message);
    }
};

const publishQuoteEvent = (quote) => {
    const dto = bookingQuoteDto(quote);
    try {
        publishFanOut(
            { userId: dto.userId, agencyId: dto.agencyId },
            REALTIME_EVENTS.BOOKING_QUOTE_CREATED,
            dto,
            { skipAdmins: true },
        );
        publishFanOut({}, REALTIME_EVENTS.ADMIN_BOOKING_QUOTE_CREATED, dto);
    } catch (err) {
        console.error("[FinancialEngine] realtime publish failed (quote):", err?.message);
    }
};

const nowQuery = () => ({
    active: true,
    $and: [
        { $or: [{ effectiveFrom: null }, { effectiveFrom: { $lte: new Date() } }] },
        {
            $or: [{ effectiveUntil: null }, { effectiveUntil: { $gte: new Date() } }],
        },
    ],
});
const repositories = {
    config: {
        async findActive(scopes) {
            const rows = await PaymentConfig.find({ ...nowQuery(), $or: scopes })
                .sort({ version: -1 })
                .lean();
            const seen = new Set();
            return rows.filter((row) => {
                const key = `${row.scopeType}:${row.scopeId}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
    },
    merchant: {
        findActive: ({ agencyId, provider }) =>
            AgencyMerchantConfig.findOne({
                agencyId,
                active: true,
                ...(provider ? { provider } : {}),
            })
                .sort({ createdAt: -1 })
                .lean(),
    },
    providerConfig: {
        findActive: ({ provider }) =>
            provider ? PaymentProviderConfig.findOne({ provider, active: true }).lean() : null,
    },
    quotes: {
        findByIdempotencyKey: (idempotencyKey) => BookingQuote.findOne({ idempotencyKey }),
        create: async (data) => {
            const quote = await BookingQuote.create(data);
            publishQuoteEvent(quote);
            return quote;
        },
    },
    payments: {
        findByIdempotencyKey: (idempotencyKey) => BookingPayment.findOne({ idempotencyKey }),
        findProcessedByEvent: (providerEventId) =>
            BookingPayment.findOne({ providerEventId, status: "PAID" }),
        findProcessedPayment: (data) =>
            BookingPayment.findOne({
                ...(data.paymentId
                    ? { _id: data.paymentId }
                    : { providerPaymentId: data.providerPaymentId }),
                status: "PAID",
            }),
        createPending: async (data) => {
            const payment = await BookingPayment.create({
                ...data,
                amount: Number(minorToDecimal(data.amountMinor)),
                status: data.initialStatus === "VERIFICATION" ? "VERIFICATION" : "PENDING",
                transactionId: data.providerPaymentId || data.transactionId || "",
                raw: data.providerPayload || data.raw || {},
            });
            publishPaymentEvent(REALTIME_EVENTS.PAYMENT_CREATED, payment);
            return payment;
        },
        markProcessed: async (data) => {
            const payment = await BookingPayment.findOneAndUpdate(
                {
                    ...(data.paymentId
                        ? { _id: data.paymentId }
                        : { providerPaymentId: data.providerPaymentId }),
                    status: { $ne: "PAID" },
                },
                {
                    $set: {
                        status: "PAID",
                        providerEventId: data.idempotencyKey,
                        transactionId: data.providerPaymentId || "",
                        paymentDate: new Date(),
                        raw: data.payload || {},
                    },
                },
                { new: true, runValidators: true },
            );
            // Emitted only after the database state actually changed — verified
            // gateway webhooks are the only path that reaches this transition.
            if (payment) publishPaymentEvent(REALTIME_EVENTS.PAYMENT_SUCCESS, payment);
            if (payment?.quoteId) {
                BookingQuote.findById(payment.quoteId)
                    .select("tourId")
                    .lean()
                    .then((quote) =>
                        quote?.tourId ? recordTourSignal(quote.tourId, "booking") : null,
                    )
                    .catch((error) =>
                        console.error("[TourIntelligence] booking signal failed:", error.message),
                    );
            }
            return payment;
        },
    },
    refunds: {
        findByIdempotencyKey: (idempotencyKey) =>
            BookingPayment.findOne({ idempotencyKey, type: "REFUND" }),
        createPending: (data) =>
            BookingPayment.create({
                bookingId: data.bookingId,
                amount: Number(minorToDecimal(data.refund.amountMinor)),
                amountMinor: data.refund.amountMinor,
                currency: data.refund.currency,
                type: "REFUND",
                status: "PENDING",
                provider: data.provider || "manual",
                idempotencyKey: data.idempotencyKey,
                financialSnapshot: data.financialSnapshot,
            }),
        markProcessed: async (payment, result) => {
            const refunded = await BookingPayment.findByIdAndUpdate(
                payment._id,
                {
                    $set: {
                        status: "REFUNDED",
                        transactionId: result.id || "manual",
                        raw: result,
                    },
                },
                { new: true },
            );
            if (refunded) publishPaymentEvent(REALTIME_EVENTS.PAYMENT_REFUNDED, refunded);
            return refunded;
        },
    },
    ledger: {
        append: (entry) =>
            FinancialLedgerEntry.findOneAndUpdate(
                { idempotencyKey: entry.idempotencyKey },
                { $setOnInsert: entry },
                { upsert: true, new: true },
            ),
        async appendMany(entries) {
            await FinancialLedgerEntry.bulkWrite(
                entries.map((entry) => ({
                    updateOne: {
                        filter: { idempotencyKey: entry.idempotencyKey },
                        update: { $setOnInsert: entry },
                        upsert: true,
                    },
                })),
                { ordered: false },
            );
            return FinancialLedgerEntry.find({
                idempotencyKey: { $in: entries.map((entry) => entry.idempotencyKey) },
            });
        },
    },
    settlements: {
        createIdempotent: (data) =>
            FinancialSettlement.findOneAndUpdate(
                { idempotencyKey: data.idempotencyKey },
                { $setOnInsert: data },
                { upsert: true, new: true, runValidators: true },
            ),
        adjustForRefund: ({ bookingId, refundId, refund }) =>
            FinancialSettlement.updateMany(
                { bookingId, status: { $in: ["PENDING", "PROCESSING"] } },
                {
                    $set: { status: "ADJUSTED" },
                    $push: { refundAdjustments: { refundId, refund } },
                },
            ),
    },
};
const providers = {};
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    providers.razorpay = new RazorpayProvider({
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
        apiBaseUrl: process.env.RAZORPAY_API_BASE_URL,
        timeoutMs: Number(process.env.RAZORPAY_TIMEOUT_MS || 15000),
    });
configureFinancialEngine({ repositories, providers });
