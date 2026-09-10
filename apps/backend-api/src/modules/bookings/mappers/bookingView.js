import { BOOKING_STATUS } from "../../../constants/enums.js";
import { enquiryView, formatDate } from "../../forms/mappers/enquiryView.js";

const STATUS_LABELS = Object.freeze({
    [BOOKING_STATUS.CUSTOMER_ACCEPTED]: "Quotation accepted",
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

const hasSavedTravellerDetails = (booking, sourceEnquiry) =>
    Boolean(booking?.travellerDetails?.completedAt || sourceEnquiry?.travellerDetails?.completedAt);

const displayStatus = (status, booking, sourceEnquiry) => {
    if (status === BOOKING_STATUS.CUSTOMER_ACCEPTED && !hasSavedTravellerDetails(booking, sourceEnquiry)) {
        return {
            label: "Traveller details required",
            tone: "warning",
            guidance:
                "Your quotation is accepted. Add the traveller details required to prepare payment and reservations.",
        };
    }

    return {
        label: STATUS_LABELS[status] || String(status).replaceAll("_", " "),
        tone: statusTone(status),
        guidance: null,
    };
};

const statusTone = (status) => {
    if (
        [
            BOOKING_STATUS.CUSTOMER_ACCEPTED,
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
    const bookingRef = booking?.bookingRef || "";
    const publicBookingId = bookingRef || "";
    const status = booking?.status || BOOKING_STATUS.CUSTOMER_ACCEPTED;
    const statusDisplay = displayStatus(status, booking, sourceEnquiry);

    return {
        ...source,
        id: publicBookingId,
        bookingId: publicBookingId,
        bookingRef,
        reference: bookingRef,
        recordType: "booking",
        recordTypeLabel: "Booking",
        directionLabel: perspective === "sent" ? "Your booking" : "Customer booking",
        sourceEnquiryId: sourceEnquiry?.enquiryRef || "",
        sourceEnquiryRef: sourceEnquiry?.enquiryRef || "",
        acceptedQuoteId: booking?.acceptedQuoteRef || "",
        status,
        statusLabel: statusDisplay.label,
        statusTone: statusDisplay.tone,
        createdAt: booking?.createdAt,
        createdLabel: formatDate(booking?.createdAt),
        guidance: statusDisplay.guidance || source.guidance,
        travellerDetails: booking?.travellerDetails || null,
    };
};

export default bookingView;
