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
      provider
        ? PaymentProviderConfig.findOne({ provider, active: true }).lean()
        : null,
  },
  quotes: {
    findByIdempotencyKey: (idempotencyKey) =>
      BookingQuote.findOne({ idempotencyKey }),
    create: (data) => BookingQuote.create(data),
  },
  payments: {
    findByIdempotencyKey: (idempotencyKey) =>
      BookingPayment.findOne({ idempotencyKey }),
    findProcessedByEvent: (providerEventId) =>
      BookingPayment.findOne({ providerEventId, status: "PAID" }),
    findProcessedPayment: (data) =>
      BookingPayment.findOne({
        ...(data.paymentId
          ? { _id: data.paymentId }
          : { providerPaymentId: data.providerPaymentId }),
        status: "PAID",
      }),
    createPending: (data) =>
      BookingPayment.create({
        ...data,
        amount: Number(minorToDecimal(data.amountMinor)),
        status:
          data.initialStatus === "VERIFICATION" ? "VERIFICATION" : "PENDING",
        transactionId: data.providerPaymentId || data.transactionId || "",
        raw: data.providerPayload || data.raw || {},
      }),
    markProcessed: (data) =>
      BookingPayment.findOneAndUpdate(
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
      ),
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
    markProcessed: (payment, result) =>
      BookingPayment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status: "REFUNDED",
            transactionId: result.id || "manual",
            raw: result,
          },
        },
        { new: true },
      ),
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
