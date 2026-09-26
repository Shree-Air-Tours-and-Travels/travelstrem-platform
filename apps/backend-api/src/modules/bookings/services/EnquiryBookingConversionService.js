import { BOOKING_STATUS, PAYMENT_STATUS } from "../../../constants/enums.js";
import Booking from "../models/Booking.js";
import BookingDocument from "../models/BookingDocument.js";
import BookingQuote from "../models/BookingQuote.js";
import { createReadableReference } from "../../../utils/readableReference.js";

const enquirySnapshot = (enquiry) => ({
    enquiryRef: enquiry.enquiryRef || "",
    form: enquiry.form || "contact-agent",
    fields: enquiry.fields || {},
    agentSnapshot: enquiry.agentSnapshot || {},
    agencySnapshot: enquiry.agencySnapshot || {},
    createdAt: enquiry.createdAt || null,
});

const bookingOnInsert = (enquiry, quote, bookingRef = createReadableReference("BKQ")) => ({
    bookingRef,
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
    let booking = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            booking = await Booking.findOneAndUpdate(
                { sourceEnquiryId: enquiry._id },
                { $setOnInsert: bookingOnInsert(enquiry, quote) },
                { new: true, upsert: true, runValidators: true },
            );
            break;
        } catch (error) {
            if (error?.code !== 11000) throw error;
            booking = await Booking.findOne({ sourceEnquiryId: enquiry._id });
            if (booking) break;
            if (attempt === 4) throw error;
        }
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
