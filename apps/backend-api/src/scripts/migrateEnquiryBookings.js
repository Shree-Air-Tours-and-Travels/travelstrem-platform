import mongoose from "mongoose";
import config from "../config/index.js";
import ContactLead from "../modules/forms/models/ContactLead.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";
import Booking from "../modules/bookings/models/Booking.js";
import BookingDocument from "../modules/bookings/models/BookingDocument.js";
import {
    ensureBookingFromAcceptedQuote,
    linkEnquiryArtifactsToBooking,
} from "../modules/bookings/services/EnquiryBookingConversionService.js";

const apply = process.argv.includes("--apply");

await mongoose.connect(config.MONGO_URI);

const enquiries = await ContactLead.find({ status: "accepted" });
let eligible = 0;
let converted = 0;

for (const enquiry of enquiries) {
    const quote = await BookingQuote.findOne({
        status: "ACCEPTED",
        $or: [
            { inquiryId: enquiry._id },
            { bookingId: enquiry._id },
            { contextType: "ENQUIRY", contextId: String(enquiry._id) },
        ],
    }).sort({ version: -1, acceptedAt: -1, createdAt: -1 });
    if (!quote) continue;
    eligible += 1;
    if (!apply) continue;

    const booking = await ensureBookingFromAcceptedQuote(enquiry, quote);
    enquiry.bookingId = booking._id;
    quote.bookingId = booking._id;
    quote.inquiryId = enquiry._id;
    await Promise.all([enquiry.save(), quote.save()]);
    await linkEnquiryArtifactsToBooking(enquiry, booking);
    converted += 1;
}

if (apply) {
    await Booking.createIndexes();
    await BookingDocument.createIndexes();
    await BookingQuote.createIndexes();
}

console.log(
    JSON.stringify(
        {
            mode: apply ? "apply" : "dry-run",
            acceptedEnquiries: enquiries.length,
            eligible,
            converted,
        },
        null,
        2,
    ),
);

await mongoose.disconnect();
