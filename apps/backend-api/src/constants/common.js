import { STATUS_DISPLAY, BOOKING_STATUS, PAYMENT_STATUS } from "./enums.js";

export function statusDisplay(value) {
    const code = String(value || "NEW").toUpperCase();
    const [label, tone] = STATUS_DISPLAY[code] || [code.toLowerCase().replaceAll("_", " "), "neutral"];
    return { label, tone };
}

export function bookingStatusDisplay(bookingStatus, paymentStatus) {
    const booking = String(bookingStatus || "NEW").toUpperCase();
    const payment = String(paymentStatus || "").toUpperCase();
    if ([PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(payment)) return statusDisplay(payment);
    if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.TICKETED, BOOKING_STATUS.TRAVEL_READY, BOOKING_STATUS.TICKETING, BOOKING_STATUS.CONFIRMING_WITH_SUPPLIER, BOOKING_STATUS.SUPPLIER_FAILED, BOOKING_STATUS.REFUND_INITIATED, BOOKING_STATUS.REFUND_PENDING].includes(booking)) return statusDisplay(booking);
    if ([PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.EXPIRED, PAYMENT_STATUS.PAID, PAYMENT_STATUS.FULLY_PAID, PAYMENT_STATUS.PARTIAL, PAYMENT_STATUS.TOKEN_PAID, PAYMENT_STATUS.BALANCE_PENDING].includes(payment)) return statusDisplay(payment);
    return statusDisplay(booking);
}
