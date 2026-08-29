import { BOOKING_STATUS, PAYMENT_STATUS } from "../../../constants/enums.js";
import Booking from "../models/Booking.js";
import BookingDocument from "../models/BookingDocument.js";
import BookingQuote from "../models/BookingQuote.js";

const enquirySnapshot = (enquiry) => ({
    enquiryRef: enquiry.enquiryRef || "",
    form: enquiry.form || "contact-agent",
    fields: enquiry.fields || {},
    agentSnapshot: enquiry.agentSnapshot || {},
    createdAt: enquiry.createdAt || null,
});

const bookingOnInsert = (enquiry, quote) => ({
    sourceEnquiryId: enquiry._id,
    acceptedQuoteId: quote._id,
    userId: enquiry.claimedBy || quote.userId || null,
    customerId: enquiry.customerId || null,
    ownerAgent: enquiry.ownerAgent || null,
    agencyId: enquiry.agencyId || quote.agencyId || null,
    product: enquiry.product || "trevista",
    journeyType: enquiry.journeyType || "tour",
    tourId: enquiry.tourId || null,
    tourTitle: enquiry.tourTitle || "",
    status: BOOKING_STATUS.CUSTOMER_ACCEPTED,
    paymentStatus: PAYMENT_STATUS.TOKEN_PENDING,
    enquirySnapshot: enquirySnapshot(enquiry),
    selectionSnapshot: enquiry.selection || null,
    customizationSnapshot: enquiry.customizationSnapshot || null,
    pricingSnapshot: quote.pricingSnapshot || {
        currency: quote.currency || "INR",
        finalAmount: quote.finalAmount || 0,
    },
    financialSnapshot: quote.financialSnapshot || null,
    travellerDetails: enquiry.travellerDetails || null,
    convertedAt: new Date(),
});

export async function ensureBookingFromAcceptedQuote(enquiry, quote) {
    let booking;
    try {
        booking = await Booking.findOneAndUpdate(
            { sourceEnquiryId: enquiry._id },
            { $setOnInsert: bookingOnInsert(enquiry, quote) },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
        );
    } catch (error) {
        if (error?.code !== 11000) throw error;
        booking = await Booking.findOne({ sourceEnquiryId: enquiry._id });
    }
    if (!booking)
        throw Object.assign(new Error("The booking could not be created from this enquiry."), {
            status: 500,
        });
    return booking;
}

export async function linkEnquiryArtifactsToBooking(enquiry, booking) {
    await Promise.all([
        BookingQuote.updateMany(
            {
                $or: [
                    { inquiryId: enquiry._id },
                    { bookingId: enquiry._id },
                    { contextType: "ENQUIRY", contextId: String(enquiry._id) },
                ],
            },
            { $set: { bookingId: booking._id, inquiryId: enquiry._id } },
        ),
        BookingDocument.updateMany(
            {
                $or: [{ enquiryId: enquiry._id }, { bookingId: enquiry._id }],
            },
            { $set: { bookingId: booking._id, enquiryId: enquiry._id } },
        ),
    ]);
}

export default {
    ensureBookingFromAcceptedQuote,
    linkEnquiryArtifactsToBooking,
};
