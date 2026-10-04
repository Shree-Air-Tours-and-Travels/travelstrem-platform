import { paymentPresentation } from "../../payments/presentation.js";
import { bookingStatusDisplay } from "../../../constants/common.js";
import { BOOKING_STATUS } from "../../../constants/enums.js";
import { enquiryView, formatDate } from "../../forms/mappers/enquiryView.js";

export const bookingView = (
    booking,
    sourceEnquiry,
    perspective,
    { quote = null, includeBookingJourney = false, summaryOnly = false, brand = {} } = {},
) => {
    const source = enquiryView(sourceEnquiry, perspective, {
        brand,
        quote,
        includeBookingJourney,
        summaryOnly,
    });
    const bookingRef = booking?.bookingRef || "";
    const publicBookingId = bookingRef || "";
    const status = booking?.status || BOOKING_STATUS.CUSTOMER_ACCEPTED;
    const statusDisplay = bookingStatusDisplay(status, booking.paymentStatus);
    const payment = paymentPresentation(booking.paymentStatus, status);

    return {
        ...source,
        id: publicBookingId,
        bookingId: publicBookingId,
        bookingRef,
        reference: bookingRef,
        recordType: "booking",
        recordTypeLabel: "Booking",
        journeyType: booking?.journeyType || source.journeyType,
        directionLabel: perspective === "sent" ? "Your booking" : "Customer booking",
        sourceEnquiryId: sourceEnquiry?.enquiryRef || "",
        sourceEnquiryRef: sourceEnquiry?.enquiryRef || "",
        acceptedQuoteId: booking?.acceptedQuoteRef || "",
        status,
        statusLabel: statusDisplay.label,
        statusTone: statusDisplay.tone,
        createdAt: booking?.createdAt,
        createdLabel: formatDate(booking?.createdAt),
        guidance: payment.message,
        travellerDetails: booking?.travellerDetails || null,
    };
};

export default bookingView;
