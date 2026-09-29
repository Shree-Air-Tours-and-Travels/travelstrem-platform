import FlightBooking from "../flights/models/FlightBooking.js";
import { assertBookingOpen } from "../../services/bookingClock.js";
import mongoose from "mongoose";
import ContactLead from "../forms/models/ContactLead.js";
import Booking from "../bookings/models/Booking.js";
import BookingQuote from "../bookings/models/BookingQuote.js";
import FinancialEngine from "../../core/financial-engine/index.js";
import FlightService from "../flights/services/flight.service.js";
import HotelService from "../hotels/services/hotel.service.js";
import { ensureBookingFromAcceptedQuote } from "../bookings/services/EnquiryBookingConversionService.js";
import { findAuthorizedBookingJourney } from "../bookings/quoteBuilderAdapter.js";
const fail = (message) => { throw Object.assign(new Error(message), { status: 409 }); };
export async function prepareEnquiryPayment(identifier, actor) {
    await findAuthorizedBookingJourney(identifier, actor);
    const enquiry = await ContactLead.findOne(mongoose.isValidObjectId(identifier) ? { _id: identifier } : { enquiryRef: identifier });
    if (!enquiry || !["flight", "hotel"].includes(enquiry.journeyType) || enquiry.product !== "trehub") fail("This enquiry requires an accepted quote before payment");
    if (["cancelled", "closed"].includes(enquiry.status) || !enquiry.travellerDetails?.completedAt) fail("Complete traveller details before payment");
    const saved = enquiry.customizationSnapshot;
    assertBookingOpen(saved.bookingExpiresAt || new Date(0));
    if (enquiry.journeyType === "flight") {
        const existing = await FlightBooking.findOne({ sourceEnquiryId: enquiry._id });
        if (existing) return { bookingId: String(existing._id), bookingType: "flight" };
        const values = enquiry.travellerDetails.values;
        const passengers = Array.from({ length: enquiry.travellerDetails.count }, (_, index) => {
            const get = (field) => values[`traveller_${index}_${field}`];
            return { type: String(get("type")).toUpperCase(), firstName: get("firstName"), lastName: get("lastName"),
                dateOfBirth: get("dob"), gender: get("gender"), nationality: get("nationality"),
                ...(saved.requiresPassport ? { passport: { number: get("passportNumber"), expiryDate: get("passportExpiry"), issuingCountry: get("passportCountry") } } : {}) };
        });
        const service = new FlightService();
        const revalidated = await service.revalidate({ searchId: saved.searchId, offerId: saved.offerId, fareId: saved.fareId, seats: [] });
        if (revalidated.currentPrice?.total !== saved.price.total) fail("Flight price changed. Return to flight search to review the new fare");
        const booking = await service.createBooking({ sourceEnquiryId: enquiry._id, searchId: saved.searchId, offerId: saved.offerId, fareId: saved.fareId, passengers, seats: [], extras: [], acceptPriceChange: false }, { ...actor, sub: String(enquiry.claimedBy) });
        return { bookingId: booking.bookingId, bookingType: "flight" };
    }
    let booking = await Booking.findOne({ sourceEnquiryId: enquiry._id });
    if (booking) return { bookingId: String(booking._id), bookingType: "booking" };
    const refreshed = await new HotelService().quoteRooms({ searchId: saved.searchId, hotelId: saved.hotelId, roomIds: saved.roomIds }, actor);
    if (refreshed.price.total !== saved.price.total || refreshed.price.currency !== saved.price.currency) fail("Hotel price changed. Return to hotel search to review the new rate");
    const calculation = await FinancialEngine.calculatePricing({ productType: "hotel", baseAmountMinor: refreshed.price.subtotal,
        currency: refreshed.price.currency, paymentProvider: process.env.PAYMENT_PROVIDER || "razorpay", config: refreshed.price.pricingConfigSnapshot });
    const key = `hotel:${enquiry._id}:checkout`;
    let quote = await BookingQuote.findOne({ idempotencyKey: key });
    if (!quote) {
        try {
            quote = await FinancialEngine.createQuote({ quoteType: "FINANCIAL", contextType: "ENQUIRY", contextId: String(enquiry._id),
                inquiryId: enquiry._id, userId: enquiry.claimedBy, status: "ACCEPTED", acceptedAt: new Date(), idempotencyKey: key,
                financialSnapshot: calculation.financials, configSnapshot: calculation.pricingConfigSnapshot, pricingSnapshot: calculation,
                currency: calculation.currency, finalAmount: calculation.finalPayableMinor / 100,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                items: refreshed.lineItems.map(item => ({ label: item.name, amount: item.stayAmountMinor / 100 })) });
        } catch (error) { if (error.code !== 11000) throw error; quote = await BookingQuote.findOne({ idempotencyKey: key }); }
    }
    booking = await ensureBookingFromAcceptedQuote(enquiry, quote);
    await BookingQuote.updateOne({ _id: quote._id }, { $set: { bookingId: booking._id } });
    await ContactLead.updateOne({ _id: enquiry._id }, { $set: { bookingId: booking._id, status: "accepted" } });
    return { bookingId: String(booking._id), bookingType: "booking" };
}
