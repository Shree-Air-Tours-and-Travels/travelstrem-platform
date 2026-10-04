export function paymentPresentation(paymentStatus, bookingStatus) {
    if (paymentStatus === "CREATED" || paymentStatus === "PENDING") return { heading: "Awaiting payment", message: "Your booking details are saved. Continue to secure checkout when you are ready.", tone: "info" };
    if (paymentStatus === "REFUNDED") return { heading: "Payment refunded", message: "Your refund has been processed. Your bank will reflect it according to its processing times.", tone: "info", amountLabel: "Original payment" };
    if (paymentStatus === "PARTIALLY_REFUNDED") return { heading: "Partial refund processed", message: "A partial refund has been processed for this booking.", tone: "info", amountLabel: "Original payment" };
    if (["PAID", "FULLY_PAID"].includes(paymentStatus)) {
        if (["CONFIRMED", "TICKETED", "TRAVEL_READY", "COMPLETED"].includes(bookingStatus)) return { heading: "Your booking is confirmed", message: "Your payment is verified and your booking is confirmed. Return to your booking for the latest details.", tone: "success", amountLabel: "Amount paid" };
        if (["SUPPLIER_FAILED", "REFUND_INITIATED", "REFUND_PENDING"].includes(bookingStatus)) return { heading: "Refund in progress", message: "Your payment was received, but the supplier could not confirm your booking. We are arranging your refund.", tone: "warning", amountLabel: "Amount paid" };
        return { heading: "Payment received", message: "Your payment is verified. We are confirming availability with your travel provider. Your booking is not yet confirmed.", tone: "success", amountLabel: "Amount paid" };
    }
    if (paymentStatus === "EXPIRED") return { heading: "Payment session expired", message: "Return to your booking to review availability and continue securely.", tone: "warning" };
    if (paymentStatus === "FAILED") return { heading: "Payment unsuccessful", message: "This payment attempt failed. You can retry securely below.", tone: "danger" };
    if (paymentStatus === "PROCESSING") return { heading: "Confirming your payment", message: "We’re waiting for your payment provider to confirm. Please don’t pay again. You can safely leave this page and return to your booking later.", tone: "info" };
    return { heading: "Complete your booking payment", message: "Review your booking and the final amount before continuing to secure checkout.", tone: "info" };
}

export function paymentProgress(paymentStatus, bookingStatus) {
    const received = ["PAID", "FULLY_PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(paymentStatus);
    const confirmed = ["CONFIRMED", "TICKETED", "TRAVEL_READY", "COMPLETED"].includes(bookingStatus);
    const refund = ["REFUNDED", "PARTIALLY_REFUNDED"].includes(paymentStatus) || ["SUPPLIER_FAILED", "REFUND_INITIATED", "REFUND_PENDING"].includes(bookingStatus);
    return [
        { id: "review", label: "Booking reviewed", status: "completed" },
        { id: "payment", label: received ? "Payment received" : "Payment", status: received ? "completed" : paymentStatus === "FAILED" ? "error" : paymentStatus === "EXPIRED" ? "warning" : "current" },
        { id: "confirmation", label: refund ? "Refund updates" : "Booking confirmation", status: refund ? "warning" : confirmed && received ? "completed" : received ? "current" : "pending" },
    ];
}
