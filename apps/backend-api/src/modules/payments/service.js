import { paymentPresentation, paymentProgress } from "./presentation.js";
import { bookingStatusDisplay } from "../../constants/common.js";
import { bookingClock, watchBookingClock } from "../../services/bookingClock.js";
import { beginSupplierConfirmation } from "./lifecycle.js";
import { prepareEnquiryPayment } from "./prepareEnquiry.js";
import mongoose from "mongoose";
import { createHash } from "node:crypto";
import config from "../../config/index.js";
import Booking from "../bookings/models/Booking.js";
import ContactLead from "../forms/models/ContactLead.js";
import BookingQuote from "../bookings/models/BookingQuote.js";
import { quoteSelectionFingerprint } from "../bookings/services/quoteSelection.js";
import BookingPayment from "../bookings/models/BookingPayment.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import FinancialEngine from "../../core/financial-engine/index.js";
import { getPaymentProvider } from "../../core/financial-engine/providers/registry.js";
import { findAuthorizedBookingJourney } from "../bookings/quoteBuilderAdapter.js";
import { publishFanOut, publishToBooking } from "../../realtime/index.js";
import logger from "../../shared/logger/index.js";
import { PaymentSession, PaymentTransaction, PaymentWebhookEvent, Refund } from "./models.js";

const fail = (status, message) => {
    throw Object.assign(new Error(message), { status });
};
const modelFor = (type) => (type === "flight" ? FlightBooking : Booking);
const terminal = ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"];
const uid = (actor) => String(actor?.sub || actor?._id || "");
const same = (a, b) => Boolean(a && b) && String(a) === String(b);
const duration = 30 * 60 * 1000;
const emit = async (session, event) => {
    const booking = await modelFor(session.bookingType).findById(session.bookingId).lean();
    const data = {
        paymentSessionId: session.sessionId,
        bookingId: String(session.bookingId),
        status: session.status,
    };
    await publishFanOut({ userId: booking?.userId, agencyId: booking?.agencyId }, event, data);
    if (!same(booking?.userId, session.userId))
        await publishFanOut({ userId: session.userId, includeAdmins: false }, event, data);
    await publishToBooking(String(session.bookingId), event, data);
    logger.info("[Payments]", {
        event,
        bookingId: String(session.bookingId),
        status: session.status,
    });
};

async function loadBooking(identifier, type, actor) {
    const query = mongoose.isValidObjectId(identifier)
        ? { _id: identifier }
        : { bookingRef: identifier };
    const booking = await modelFor(type).findOne(query);
    if (!booking) fail(404, "Booking not found");
    if (type === "booking") await findAuthorizedBookingJourney(booking.bookingRef, actor);
    else if (!(
        same(booking.userId, uid(actor)) ||
        actor.role === "super_admin" ||
        (actor.role === "admin" && actor.adminLevel === "master") ||
        (same(booking.agencyId, actor.agencyId) &&
            (actor.agencyRole === "partner_admin" ||
                (actor.agencyRole === "partner_agent" && same(booking.ownerAgent, uid(actor)))))
    ))
        fail(404, "Booking not found");
    return booking;
}

function validateReturnUrl(raw) {
    if (!raw) return "";
    let url;
    try {
        url = new URL(raw);
    } catch {
        fail(400, "Invalid return URL");
    }
    const allowed = config.FRONTENDS || [];
    if (
        url.username ||
        url.password ||
        !["https:", ...(config.IS_DEVELOPMENT ? ["http:"] : [])].includes(url.protocol) ||
        !(
            allowed.includes(url.origin) ||
            (config.IS_DEVELOPMENT && ["localhost", "127.0.0.1"].includes(url.hostname))
        )
    )
        fail(400, "Return URL must belong to a configured frontend");
    return url.href;
}

async function payableQuote(booking, type, provider) {
    let quote;
    if (type === "flight") {
        const price = booking.priceSnapshot;
        const key = `flight:${booking._id}:checkout`;
        quote = await BookingQuote.findOne({ idempotencyKey: key });
        if (!quote) {
            try {
                quote = await FinancialEngine.createQuote({
                    quoteType: "FINANCIAL",
                    contextType: "FLIGHT",
                    contextId: String(booking._id),
                    bookingId: booking._id,
                    userId: booking.userId,
                    status: "ACTIVE",
                    expiresAt: new Date(new Date(booking.createdAt).getTime() + duration),
                    idempotencyKey: key,
                    financialSnapshot: price.financials,
                    configSnapshot: price.pricingConfigSnapshot,
                    pricingSnapshot: {
                        finalPayableMinor: price.finalAmount,
                        currency: price.currency,
                        gateway: { provider },
                    },
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
                quote = await BookingQuote.findOne({ idempotencyKey: key });
            }
        }
    } else {
        quote = await BookingQuote.findById(booking.acceptedQuoteId);
        if (!quote || quote.status !== "ACCEPTED") fail(409, "An accepted quote is required");
        if (booking.sourceEnquiryId && quote.selectionFingerprint) {
            const enquiry = await ContactLead.findById(booking.sourceEnquiryId).lean();
            if (!enquiry || quote.selectionFingerprint !== quoteSelectionFingerprint(enquiry)) fail(409, "Booking details no longer match the accepted quotation");
            const latest = await BookingQuote.findOne({ inquiryId: enquiry._id, version: { $ne: null } }).sort({ version: -1, createdAt: -1 }).select("_id");
            if (latest && !same(latest._id, quote._id)) fail(409, "The accepted quotation has been replaced");
        }
        if (!booking.travellerDetails?.completedAt)
            fail(409, "Complete traveller details before paying");
    }
    const expiry = quote?.expiresAt || quote?.expirationDate || quote?.validity;
    if (expiry && new Date(expiry) <= new Date()) fail(409, "The booking quote has expired");
    const validated = FinancialEngine.validatePaymentQuote(quote, { provider });
    return { quote, ...validated };
}

export async function createSession(input, actor, portal) {
    if (!config.IS_DEVELOPMENT) throw Object.assign(new Error("Payments are enabled only in development."), { status: 403 });
    if (!input || typeof input.bookingId !== "string" || !input.bookingId.trim()) fail(400, "A booking ID is required");
    validateReturnUrl(input.returnUrl);
    if (input.bookingType === "enquiry") input = { ...input, ...await prepareEnquiryPayment(input.bookingId, actor) };
    const type = input.bookingType || "booking";
    if (!["booking", "flight"].includes(type) || typeof input.bookingId !== "string")
        fail(400, "A supported booking is required");
    const booking = await loadBooking(input.bookingId, type, actor);
    if (
        ["CANCELLED", "COMPLETED", "REFUNDED", "FAILED"].includes(booking.status) ||
        ["PAID", "FULLY_PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(booking.paymentStatus)
    )
        fail(409, "Booking is not payable");
    if (
        await BookingPayment.exists({
            bookingId: booking._id,
            status: { $in: ["PAID", "VERIFICATION"] },
            type: { $ne: "REFUND" },
        })
    )
        fail(409, "Booking already has a payment or payment under verification");
    const provider = process.env.PAYMENT_PROVIDER || "razorpay";
    getPaymentProvider(provider);
    const { quote, amountMinor, quotedCurrency } = await payableQuote(booking, type, provider);
    const returnUrl = validateReturnUrl(input.returnUrl);
    const deadlines = [Date.now() + duration, quote.expiresAt, quote.expirationDate, quote.validity,
        booking.enquirySnapshot?.customizationSnapshot?.bookingExpiresAt, booking.supplierOffer?.expiresAt]
        .filter(Boolean).map(value => new Date(value).getTime()).filter(Number.isFinite);
    const expiresAt = new Date(Math.min(...deadlines));
    if (expiresAt <= new Date()) fail(409, "Your booking session has ended. Start a new search to check current prices and availability.");
    let session;
    try {
        session = await PaymentSession.findOneAndUpdate(
            { bookingId: booking._id, bookingType: type },
            {
                $setOnInsert: {
                    bookingId: booking._id,
                    bookingType: type,
                    userId: uid(actor),
                    portal,
                    quoteId: quote._id,
                    quoteVersion: quote.version,
                    expectedAmount: amountMinor,
                    currency: quotedCurrency,
                    provider,
                    sourceApp: String(input.sourceApp || booking.product || type).slice(0, 80),
                    returnUrl,
                    expiresAt,
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
        session = await PaymentSession.findOne({ bookingId: booking._id, bookingType: type });
    }
    if (terminal.includes(session.status)) fail(409, "Booking has already been paid");
    if (
        !same(session.quoteId, quote._id) ||
        session.expectedAmount !== amountMinor ||
        (session.quoteVersion != null && session.quoteVersion !== quote.version) ||
        session.currency !== quotedCurrency
    )
        fail(409, "Your booking price has changed. Return to your booking to review the updated total.; payment reconciliation is required");
    if (session.expiresAt <= new Date() && session.status !== "PROCESSING")
        fail(409, "Your booking session has ended. Start a new search to check current prices and availability.");
    // Reopening checkout must not extend the original booking deadline.
    const renewed = await PaymentSession.findOneAndUpdate({ _id: session._id, status: { $nin: terminal } },
        { $set: { returnUrl, userId: uid(actor), portal } }, { new: true });
    if (!renewed) fail(409, "Booking has already been paid");

    const base = process.env.PAYMENT_APP_URL?.trim() ||
        (config.IS_DEVELOPMENT ? "http://localhost:3018" : "https://pay.travelstrem.com");
    return {
        paymentSessionId: session.sessionId,
        paymentUrl: `${base.replace(/\/$/, "")}/pay/${session.sessionId}?portal=${portal}`,
    };
}

async function authorizedSession(id, actor) {
    if (!/^ps_[a-f0-9]{48}$/.test(id)) fail(404, "Payment session not found");
    const session = await PaymentSession.findOne({ sessionId: id });
    if (!session) fail(404, "Payment session not found");
    await loadBooking(String(session.bookingId), session.bookingType, actor);
    return session;
}

export async function sessionDetails(id, actor) {
    let session = await authorizedSession(id, actor);
    if (![...terminal, "PROCESSING"].includes(session.status) && session.expiresAt <= new Date()) {
        await PaymentSession.updateOne(
            { _id: session._id, status: { $in: ["CREATED", "PENDING", "FAILED"] }, expiresAt: { $lte: new Date() } },
            { $set: { status: "EXPIRED" } },
        );
        session = await PaymentSession.findById(session._id);
    }
    const booking = await modelFor(session.bookingType).findById(session.bookingId).lean();
    watchBookingClock({ userId: uid(actor), paymentSessionId: session.sessionId, expiresAt: session.expiresAt, status: session.status });
    const quote = await BookingQuote.findById(session.quoteId).lean();
    const format = (amount) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: session.currency }).format(
            amount / 100,
        );
    const refunds = await Refund.find({ sessionId: session.sessionId }).sort({ createdAt: -1 }).lean();
    const attempts = await PaymentTransaction.find({ sessionId: session.sessionId }).sort({ createdAt: -1 }).lean();
    const refundedMinor = refunds.filter(item => item.status === "REFUNDED").reduce((total, item) => total + item.amountMinor, 0);
    const returnUrl = session.returnUrl ? new URL(session.returnUrl) : null;
    if (returnUrl && session.bookingType === "flight" && booking.sourceEnquiryId) {
        const enquiry = await ContactLead.findById(booking.sourceEnquiryId).select("enquiryRef").lean();
        if (enquiry?.enquiryRef) {
            returnUrl.pathname = "/";
            returnUrl.search = "";
            returnUrl.hash = "";
            returnUrl.searchParams.set("tab", "bookings");
            returnUrl.searchParams.set("enquiry", enquiry.enquiryRef);
        }
    }
    returnUrl?.searchParams.set("step", terminal.includes(session.status) ? "payment" : session.bookingType === "flight" || booking.journeyType === "hotel" ? "review" : "quote");
    returnUrl?.searchParams.set("paymentSession", session.sessionId);
    return {
        paymentSessionId: session.sessionId,
        clock: bookingClock(session.expiresAt, session.status),
        status: session.status,
        bookingStatus: booking.status,
        statusLabel: bookingStatusDisplay(booking.status, session.status).label,
        statusTone: bookingStatusDisplay(booking.status, session.status).tone,
        bookingId: String(booking._id),
        ...paymentPresentation(session.status, booking.status),
        progress: paymentProgress(session.status, booking.status),
        bookingReference: booking.bookingRef,
        title: booking.tourTitle || "Flight booking",
        customer:
            booking.enquirySnapshot?.fields?.name ||
            booking.passengers?.map((p) => `${p.firstName} ${p.lastName}`).join(", ") ||
            "Traveller",
        amount: format(session.expectedAmount),
        currency: session.currency,
        returnUrl: returnUrl?.toString() || "",
        details: [
            { label: "Booking reference", value: booking.bookingRef },
            { label: "Booking status", value: bookingStatusDisplay(booking.status, session.status).label },
            { label: "Payment provider", value: session.provider },
            ...(session.providerOrderId ? [{ label: "Order reference", value: session.providerOrderId }] : []),
            ...(session.capturedPaymentId ? [{ label: "Payment reference", value: session.capturedPaymentId }] : []),
        ],
        refundedAmount: format(refundedMinor),
        refunds: refunds.map(item => ({
            reference: item.providerRefundId, amount: format(item.amountMinor),
            status: item.status === "REFUNDED" ? "Refund completed" : item.status === "FAILED" ? "Refund needs attention" : "Refund in progress",
            message: item.status === "REFUNDED" ? "Sent to your original payment method. Your bank may take additional time to show the credit."
                : item.status === "FAILED" ? "We could not complete this refund. Please contact support with your booking reference."
                : "Your refund is being processed. You do not need to make another payment.",
            date: item.createdAt,
        })),
        attempts: attempts.map(item => ({ reference: item.providerPaymentId, amount: format(item.amountMinor),
            status: item.status === "PAID" ? "Payment received" : item.status === "FAILED" ? "Payment unsuccessful" : "Awaiting payment confirmation", date: item.createdAt })),
        breakdown: [
            ...(!quote?.items?.length ? [{ label: "Travel services", value: format(quote?.financialSnapshot?.agent?.amountMinor || 0) }] : []),
            ...(quote?.items || []).map((item) => ({
                label: item.label,
                value: new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: session.currency,
                }).format(item.amount),
            })),
            {
                label: "Taxes and platform fees (included)",
                value: format(
                    (quote?.financialSnapshot?.platform?.gstMinor || 0) +
                        (quote?.financialSnapshot?.platform?.commissionMinor || 0),
                ),
            },
            {
                label: "Gateway fees (included)",
                value: format(quote?.financialSnapshot?.gateway?.totalMinor || 0),
            },
        ],
        canPay: config.IS_DEVELOPMENT && ["CREATED", "PENDING", "FAILED"].includes(session.status) && !["CANCELLED", "COMPLETED", "REFUNDED", "FAILED"].includes(booking.status),
        expiresAt: session.expiresAt,
        serverTime: new Date().toISOString(),
        restartUrl: returnUrl && (session.bookingType === "flight" || booking.journeyType === "hotel") ? new URL(session.bookingType === "flight" ? "/trehub/flights" : "/trehub/hotels", returnUrl.origin).toString() : "",
    };
}

export async function createOrder(id, actor) {
    if (!config.IS_DEVELOPMENT) throw Object.assign(new Error("Payments are enabled only in development."), { status: 403 });
    let session = await authorizedSession(id, actor);
    if ([...terminal, "PROCESSING"].includes(session.status) || session.expiresAt <= new Date())
        fail(409, "This payment link is no longer available. Return to your booking to see the latest payment status.");
    const booking = await loadBooking(String(session.bookingId), session.bookingType, actor);
    if (["CANCELLED", "COMPLETED", "REFUNDED", "FAILED"].includes(booking.status))
        fail(409, "Booking is not payable");
    const valid = await payableQuote(booking, session.bookingType, session.provider);
    if (valid.amountMinor !== session.expectedAmount || valid.quotedCurrency !== session.currency || (session.quoteVersion != null && valid.quote.version !== session.quoteVersion) || !same(valid.quote._id, session.quoteId))
        fail(409, "Your booking price has changed. Return to your booking to review the updated total.");
    const provider = getPaymentProvider(session.provider);
    if (!session.providerOrderId) {
        provider.assertConfigured();
        let payment = await BookingPayment.findOne({ idempotencyKey: `central:${session._id}` });
        if (!payment) {
            let claimed = await PaymentSession.findOneAndUpdate({ _id: session._id, orderStartedAt: null, status: { $in: ["CREATED", "PENDING", "FAILED"] }, expiresAt: { $gt: new Date() } },
                { $set: { orderStartedAt: new Date() } }, { new: true });
            const recoveredProviderOrder = !claimed ? await provider.findOrder(String(session._id)) : null;
            // Reconcile with the provider before reclaiming an abandoned order attempt.
            // Match the observed timestamp so concurrent retries cannot both acquire it.
            const staleAfterMs = Math.max(120000, (provider.timeoutMs || 15000) * 2);
            if (!claimed && !recoveredProviderOrder && session.orderStartedAt &&
                new Date(session.orderStartedAt).getTime() < Date.now() - staleAfterMs) {
                claimed = await PaymentSession.findOneAndUpdate(
                    { _id: session._id, orderStartedAt: session.orderStartedAt,
                        providerOrderId: null, status: { $nin: terminal }, expiresAt: { $gt: new Date() } },
                    { $set: { orderStartedAt: new Date() } }, { new: true },
                );
            }
            if (!claimed && !recoveredProviderOrder) fail(409, "We are checking your previous payment attempt. Please wait a moment, then check again. Contact support if this continues.");
            try {
                payment = await FinancialEngine.createPayment({ bookingId: session.bookingId, quoteId: session.quoteId,
                    provider: session.provider, createdBy: uid(actor), idempotencyKey: `central:${session._id}`,
                    reference: String(session._id), metadata: { paymentSessionId: session.sessionId }, type: "BALANCE", recoveredProviderOrder });
            } catch (error) {
                // A rejected authentication request cannot create a gateway order.
                if (claimed && error.code === "PAYMENT_PROVIDER_AUTH_FAILED") {
                    await PaymentSession.updateOne(
                        { _id: session._id, orderStartedAt: claimed.orderStartedAt, providerOrderId: null },
                        { $set: { orderStartedAt: null } },
                    );
                }
                if (error.code !== 11000) throw error;
                payment = await BookingPayment.findOne({ idempotencyKey: `central:${session._id}` });
                if (!payment) throw error;
            }
        }
        session = await PaymentSession.findOneAndUpdate(
            { _id: session._id, status: { $in: ["CREATED", "PENDING", "FAILED"] }, expiresAt: { $gt: new Date() } },
            {
                $set: {
                    providerOrderId: payment.providerPaymentId,
                    paymentRecordId: payment._id,
                    status: "PENDING",
                    activePaymentId: null,
                },
            },
            { new: true },
        );
    }
    if (!session || terminal.includes(session.status)) fail(409, "Payment has already completed. Check payment status.");
    if (session.expiresAt <= new Date()) fail(410, "Your booking session has ended. Check payment status before making any further payment.");
    await emit(session, "payment.processing");
    return provider.checkout({
        id: session.providerOrderId,
        amount: session.expectedAmount,
        currency: session.currency,
    });
}

export async function verifyCallback(id, actor, input) {
    const session = await authorizedSession(id, actor);
    if (!session.providerOrderId || !await getPaymentProvider(session.provider).verifyCallback(session.providerOrderId, input))
        fail(400, "Invalid payment callback");
    const updated = await PaymentSession.findOneAndUpdate(
        { _id: session._id, status: { $in: ["PENDING", "FAILED", "EXPIRED"] } },
        { $set: { status: "PROCESSING", activePaymentId: input.razorpay_payment_id } },
        { new: true },
    );
    if (updated) await emit(updated, "payment.processing");
    return { status: updated?.status || session.status }; // Never mark paid from a browser callback.
}

export async function handleWebhook(providerName, rawBody, signature, eventId) {
    const provider = getPaymentProvider(providerName);
    if (!rawBody || !await provider.verifyWebhook({ rawBody, signature }))
        fail(400, "Invalid webhook signature");
    const digest = createHash("sha256").update(rawBody).digest("hex");
    const key = eventId || digest;
    let event;
    try {
        event = await PaymentWebhookEvent.findOneAndUpdate(
            { provider: providerName, eventId: key },
            { $setOnInsert: { digest } },
            { upsert: true, new: true },
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
        event = await PaymentWebhookEvent.findOne({ provider: providerName, eventId: key });
    }
    if (event.digest !== digest) fail(400, "Webhook event payload mismatch");
    const { type, payment, refund } = await provider.parseWebhook(JSON.parse(rawBody.toString("utf8")));
    if (event.completedAt) {
        if (["payment.captured", "order.paid"].includes(type)) {
            const paidSession = await PaymentSession.findOne({ provider: providerName, providerOrderId: payment?.order_id });
            if (paidSession) await beginSupplierConfirmation(paidSession);
        }
        return;
    }
    if (["payment.captured", "order.paid", "payment.failed", "payment.authorized"].includes(type)) {
        if (!payment?.id || !payment.order_id) fail(400, "Missing payment identity");
        const session = await PaymentSession.findOne({
            provider: providerName,
            providerOrderId: payment.order_id,
        });
        if (!session) fail(503, "Payment order is not yet reconciled");
        if (payment.amount !== session.expectedAmount || payment.currency !== session.currency)
            fail(400, "Payment amount or currency mismatch");
        if (type === "payment.failed" && payment.status !== "failed") fail(400, "Payment failure status mismatch");
        if (type === "payment.authorized" && payment.status !== "authorized") fail(400, "Payment authorization status mismatch");
        const captured = ["payment.captured", "order.paid"].includes(type);
        if (captured && (payment.status !== "captured" || payment.captured !== true))
            fail(400, "Payment is not captured");
        const status = captured ? "PAID" : type === "payment.failed" ? "FAILED" : "PROCESSING";
        await PaymentTransaction.updateOne(
            { provider: providerName, providerPaymentId: payment.id },
            {
                $setOnInsert: {
                    sessionId: session.sessionId,
                    providerOrderId: payment.order_id,
                    amountMinor: payment.amount,
                    currency: payment.currency,
                    status,
                },
            },
            { upsert: true },
        );
        if (captured) {
            const claimed = await PaymentSession.findOneAndUpdate(
                {
                    _id: session._id,
                    $or: [{ capturedPaymentId: null }, { capturedPaymentId: payment.id }],
                },
                { $set: { capturedPaymentId: payment.id } },
                { new: true },
            );
            if (!claimed) fail(409, "A different payment already captured this booking");
            await FinancialEngine.processPayment({
                paymentId: session.paymentRecordId,
                bookingId: session.bookingId,
                provider: providerName,
                providerPaymentId: payment.id,
                amountMinor: payment.amount,
                idempotencyKey: `capture:${providerName}:${payment.id}`,
                rawBody,
                signature,
                payload: { event: type },
            });
        }
        await mongoose.connection.transaction(async (transaction) => {
            await PaymentTransaction.updateOne(
                { provider: providerName, providerPaymentId: payment.id, status: { $nin: status === "PROCESSING" ? ["PAID", "FAILED"] : ["PAID"] } },
                { $set: { status } },
                { session: transaction },
            );
            const attempt = await PaymentTransaction.findOne({ provider: providerName, providerPaymentId: payment.id }).session(transaction);
            if (attempt.status === status) await PaymentSession.updateOne(
                { _id: session._id, status: { $nin: terminal },
                    ...(!captured ? { $or: [{ activePaymentId: null }, { activePaymentId: payment.id }] } : {}) },
                { $set: { status, ...(status === "PROCESSING" ? { activePaymentId: payment.id } : {}) } },
                { session: transaction },
            );
            if (captured) {
                // Supplier confirmation is explicitly separate from the captured payment.
                await modelFor(session.bookingType).updateOne(
                    {
                        _id: session.bookingId,
                        paymentStatus: { $nin: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] },
                    },
                    { $set: { paymentStatus: "PAID" } },
                    { session: transaction },
                );
                await modelFor(session.bookingType).updateOne(
                    {
                        _id: session.bookingId,
                        status: {
                            $in: [
                                "CUSTOMER_ACCEPTED",
                                "PAYMENT_PENDING",
                                "PENDING",
                                "AWAITING_TOKEN_PAYMENT",
                            ],
                        },
                    },
                    { $set: { status: "PAID" } },
                    { session: transaction },
                );
            }
            await PaymentWebhookEvent.updateOne(
                { _id: event._id },
                { $set: { completedAt: new Date() } },
                { session: transaction },
            );
        });
        if (captured) await beginSupplierConfirmation(session);
        const updated = await PaymentSession.findById(session._id);
        await emit(
            updated,
            captured
                ? "payment.completed"
                : status === "FAILED"
                  ? "payment.failed"
                  : "payment.processing",
        );
        return;
    }
    if (["refund.created", "refund.processed", "refund.failed"].includes(type)) {
        if (
            !refund?.id ||
            !refund.payment_id ||
            !Number.isSafeInteger(refund.amount) ||
            refund.amount <= 0
        )
            fail(400, "Invalid refund");
        const session = await PaymentSession.findOne({
            provider: providerName,
            capturedPaymentId: refund.payment_id,
        });
        if (
            !session ||
            refund.currency !== session.currency ||
            refund.amount > session.expectedAmount
        )
            fail(400, "Refund does not match captured payment");
        const expectedRefundStatus = { "refund.created": "pending", "refund.processed": "processed", "refund.failed": "failed" }[type];
        if (type === "refund.created" ? !["pending", "processed"].includes(refund.status) : refund.status !== expectedRefundStatus) fail(400, "Refund status mismatch");
        const existingRefund = await Refund.findOne({ provider: providerName, providerRefundId: refund.id }).lean();
        if (existingRefund && (existingRefund.sessionId !== session.sessionId || existingRefund.amountMinor !== refund.amount || existingRefund.currency !== refund.currency))
            fail(400, "Refund details do not match the original refund");
        const status =
            type === "refund.processed"
                ? "REFUNDED"
                : type === "refund.failed"
                  ? "FAILED"
                  : "PENDING";
        await mongoose.connection.transaction(async (transaction) => {
            await Refund.updateOne(
                { provider: providerName, providerRefundId: refund.id },
                {
                    $setOnInsert: {
                        sessionId: session.sessionId,
                        providerPaymentId: refund.payment_id,
                        amountMinor: refund.amount,
                        currency: refund.currency,
                        status,
                    },
                },
                { upsert: true, session: transaction },
            );
            await Refund.updateOne(
                {
                    provider: providerName,
                    providerRefundId: refund.id,
                    status: { $nin: status === "PENDING" ? ["REFUNDED", "FAILED"] : ["REFUNDED"] },
                },
                { $set: { status } },
                { session: transaction },
            );
            const refunds = await Refund.find({
                sessionId: session.sessionId,
                status: "REFUNDED",
            }).session(transaction);
            const total = refunds.reduce((sum, item) => sum + item.amountMinor, 0);
            if (total > session.expectedAmount) fail(400, "Refund exceeds captured payment");
            if (total) {
                const next = total === session.expectedAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";
                await PaymentSession.updateOne(
                    { _id: session._id },
                    { $set: { status: next } },
                    { session: transaction },
                );
                await modelFor(session.bookingType).updateOne(
                    { _id: session.bookingId },
                    {
                        $set: {
                            paymentStatus: next,
                            ...(next === "REFUNDED" ? { status: "REFUNDED" } : {}),
                        },
                    },
                    { session: transaction },
                );
            }
        });
        if (status === "REFUNDED") {
            const quote = await BookingQuote.findById(session.quoteId).lean();
            await FinancialEngine.processRefund({
                bookingId: session.bookingId,
                paymentId: session.paymentRecordId,
                financials: quote.financialSnapshot,
                financialSnapshot: quote.financialSnapshot,
                config: quote.configSnapshot,
                amountMinor: refund.amount,
                idempotencyKey: refund.id === session.supplierRefundId || String(refund.notes?.reference || "") === String((await BookingPayment.findOne({ idempotencyKey: `supplier-refund:${session._id}` }))?._id || "missing")
                    ? `supplier-refund:${session._id}` : `refund:${providerName}:${refund.id}`,
                provider: providerName,
                providerPaymentId: refund.payment_id,
                verifiedProviderRefund: refund,
            });
        }
        await emit(await PaymentSession.findById(session._id), status === "REFUNDED" ? "payment.refunded" : "payment.refund.updated");
    }
    await PaymentWebhookEvent.updateOne({ _id: event._id }, { $set: { completedAt: new Date() } });
}
