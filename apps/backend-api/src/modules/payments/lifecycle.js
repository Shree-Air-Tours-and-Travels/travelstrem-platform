import Booking from "../bookings/models/Booking.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import BookingQuote from "../bookings/models/BookingQuote.js";
import FinancialEngine from "../../core/financial-engine/index.js";
import { createFlightProvider } from "../flights/providers/flight-provider.factory.js";
import { getPaymentProvider } from "../../core/financial-engine/providers/registry.js";
import { publishFanOut, publishToBooking } from "../../realtime/index.js";
import { PaymentSession, Refund } from "./models.js";
import logger from "../../shared/logger/index.js";
const model = (type) => type === "flight" ? FlightBooking : Booking;

// Server-only supplier integration boundary. No HTTP/browser endpoint can confirm a booking.
export async function recordSupplierResult({ bookingId, bookingType = "booking", confirmed, reference }) {
    if (confirmed && !reference) throw new Error("Supplier confirmation reference is required");
    const booking = await model(bookingType).findOneAndUpdate({ _id: bookingId, paymentStatus: "PAID", status: "CONFIRMING_WITH_SUPPLIER" },
        { $set: { status: confirmed ? "CONFIRMED" : "SUPPLIER_FAILED", supplierConfirmationReference: reference || "" } }, { new: true });
    if (!booking) {
        if (!confirmed) await initiateSupplierRefund(bookingId, bookingType);
        return;
    }
    if (confirmed) {
        const data = { bookingId: String(bookingId), status: "CONFIRMED" };
        await publishFanOut({ userId: booking.userId, agencyId: booking.agencyId }, "booking.confirmed", data);
        await publishToBooking(String(bookingId), "booking.confirmed", data);
    } else await initiateSupplierRefund(bookingId, bookingType);
}

export async function initiateSupplierRefund(bookingId, bookingType) {
    const booking = await model(bookingType).findById(bookingId);
    if (!booking || !["SUPPLIER_FAILED", "REFUND_INITIATED"].includes(booking.status)) return;
    const session = await PaymentSession.findOneAndUpdate({ bookingId, bookingType, status: "PAID", refundStartedAt: null },
        { $set: { refundStartedAt: new Date() } }, { new: true });
    if (!session) return; // Unknown gateway outcomes must be reconciled, never blindly repeated.
    const quote = await BookingQuote.findById(session.quoteId).lean();
    const refund = await FinancialEngine.calculateRefund({ financials: quote.financialSnapshot, config: quote.configSnapshot, amountMinor: session.expectedAmount });
    const record = await FinancialEngine.processRefund({ bookingId, paymentId: session.paymentRecordId, provider: session.provider,
        financials: quote.financialSnapshot, financialSnapshot: quote.financialSnapshot, config: quote.configSnapshot,
        refund, deferProcessing: true, idempotencyKey: `supplier-refund:${session._id}` });
    await model(bookingType).updateOne({ _id: bookingId, status: "SUPPLIER_FAILED" }, { $set: { status: "REFUND_INITIATED" } });
    const result = await getPaymentProvider(session.provider).refund({ paymentId: session.capturedPaymentId, amountMinor: refund.amountMinor, reference: String(record._id) });
    await PaymentSession.updateOne({ _id: session._id }, { $set: { supplierRefundId: result.id } });
    await Refund.updateOne({ provider: session.provider, providerRefundId: result.id }, { $setOnInsert: {
        sessionId: session.sessionId, providerPaymentId: session.capturedPaymentId,
        amountMinor: refund.amountMinor, currency: session.currency, status: "PENDING",
    } }, { upsert: true });
    // refund.processed remains authoritative, even if the synchronous API says processed.
}

export async function beginSupplierConfirmation(session) {
    const failed = await model(session.bookingType).exists({ _id: session.bookingId, status: { $in: ["SUPPLIER_FAILED", "REFUND_INITIATED"] } });
    if (failed) return initiateSupplierRefund(session.bookingId, session.bookingType);
    const cancelled = await model(session.bookingType).findOneAndUpdate({ _id: session.bookingId, paymentStatus: "PAID", status: "CANCELLED" },
        { $set: { status: "SUPPLIER_FAILED" } }, { new: true });
    if (cancelled) return initiateSupplierRefund(session.bookingId, session.bookingType);
    const booking = await model(session.bookingType).findOneAndUpdate({ _id: session.bookingId, paymentStatus: "PAID", status: "PAID" },
        { $set: { status: "CONFIRMING_WITH_SUPPLIER" } }, { new: true });
    if (!booking) return;
    // Hotel/custom/tour operators integrate their supplier confirmation through recordSupplierResult.
    if (session.bookingType !== "flight") return;
    try {
        const provider = createFlightProvider(String(booking.provider).toLowerCase());
        const withPassport = await FlightBooking.findById(booking._id).select("+passengers.passport.number");
        const result = await provider.createBooking({ offer: booking.supplierOffer, fareId: booking.fareSnapshot.fareId,
            passengers: withPassport.passengers, seats: booking.seatSnapshot, extras: booking.extrasSnapshot,
            requestId: `booking:${booking._id}` });
        await FlightBooking.updateOne({ _id: booking._id, status: "CONFIRMING_WITH_SUPPLIER" }, { $set: {
            providerReference: result.providerReference, pnr: result.pnr, ticketingStatus: result.ticketingStatus, tickets: result.tickets,
        } });
        if (result.status === "CONFIRMED") await recordSupplierResult({ bookingId: booking._id, bookingType: "flight", confirmed: true, reference: result.providerReference });
    } catch (error) {
        logger.error("[Payments] supplier confirmation needs attention", { bookingId: String(booking._id), code: error.code || "UNKNOWN" });
        // Only definite rejection permits refund. Timeouts can mean a supplier accepted the booking.
        if (["BOOKING_FAILED", "SEAT_UNAVAILABLE", "FARE_UNAVAILABLE"].includes(error.code))
            await recordSupplierResult({ bookingId: booking._id, bookingType: "flight", confirmed: false });
    }
}
