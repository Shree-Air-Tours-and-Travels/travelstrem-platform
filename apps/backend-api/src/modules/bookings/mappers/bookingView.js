import { BOOKING_STATUS } from "../../../constants/enums.js";
import { enquiryView, formatDate } from "../../forms/mappers/enquiryView.js";

const STATUS_LABELS = Object.freeze({
    [BOOKING_STATUS.CUSTOMER_ACCEPTED]: "Traveller details required",
    [BOOKING_STATUS.PAYMENT_PENDING]: "Payment pending",
    [BOOKING_STATUS.PARTIALLY_PAID]: "Partially paid",
    [BOOKING_STATUS.PAID]: "Payment complete",
    [BOOKING_STATUS.CONFIRMED]: "Confirmed",
    [BOOKING_STATUS.TICKETING]: "Ticketing in progress",
    [BOOKING_STATUS.TICKETED]: "Ticketed",
    [BOOKING_STATUS.TRAVEL_READY]: "Ready to travel",
    [BOOKING_STATUS.COMPLETED]: "Completed",
    [BOOKING_STATUS.CANCELLED]: "Cancelled",
    [BOOKING_STATUS.REFUND_PENDING]: "Refund pending",
    [BOOKING_STATUS.REFUNDED]: "Refunded",
});

const statusTone = (status) => {
    if (
        [
            BOOKING_STATUS.PAID,
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.TICKETED,
            BOOKING_STATUS.TRAVEL_READY,
            BOOKING_STATUS.COMPLETED,
            BOOKING_STATUS.REFUNDED,
        ].includes(status)
    )
        return "success";
    if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REFUND_PENDING].includes(status))
        return "danger";
    return "warning";
};

export const bookingView = (
    booking,
    sourceEnquiry,
    perspective,
    { quote = null, includeBookingJourney = false, summaryOnly = false } = {},
) => {
    const source = enquiryView(sourceEnquiry, perspective, {
        quote,
        includeBookingJourney,
        summaryOnly,
    });
    const bookingId = String(booking?._id || booking?.id || "");
    const bookingRef = booking?.bookingRef || "";
    const status = booking?.status || BOOKING_STATUS.CUSTOMER_ACCEPTED;
    const statusLabel = STATUS_LABELS[status] || String(status).replaceAll("_", " ");

    return {
        ...source,
        id: bookingId,
        bookingId,
        bookingRef,
        reference: bookingRef,
        recordType: "booking",
        recordTypeLabel: "Booking",
        directionLabel: perspective === "sent" ? "Your booking" : "Customer booking",
        sourceEnquiryId: String(sourceEnquiry?._id || ""),
        sourceEnquiryRef: sourceEnquiry?.enquiryRef || "",
        acceptedQuoteId: String(booking?.acceptedQuoteId || ""),
        status,
        statusLabel,
        statusTone: statusTone(status),
        createdAt: booking?.createdAt,
        createdLabel: formatDate(booking?.createdAt),
        guidance:
            status === BOOKING_STATUS.CUSTOMER_ACCEPTED
                ? "Your quotation is accepted. Add the traveller details required to prepare payment and reservations."
                : source.guidance,
        travellerDetails: booking?.travellerDetails || null,
    };
};

export default bookingView;
