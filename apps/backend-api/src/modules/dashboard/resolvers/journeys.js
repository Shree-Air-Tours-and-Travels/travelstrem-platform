import config from "../../../config/env.js";
import BookingQuote from "../../bookings/models/BookingQuote.js";
import Booking from "../../bookings/models/Booking.js";
import FlightBooking from "../../flights/models/FlightBooking.js";
import ContactLead from "../../forms/models/ContactLead.js";
import Favorite from "../../tours/models/Favorite.js";
import Tour from "../../tours/models/Tour.js";
import Trip from "../../trips/models/Trip.js";
import { customerScopeQuery } from "../../tenancy/customerScope.js";

const LIMIT = 50;
const bookingItem = (record) => ({
    id: String(record._id), reference: record.bookingRef,
    title: record.tourTitle || record.bookingRef || "Travel booking",
    status: record.status, paymentStatus: record.paymentStatus,
    journeyType: record.journeyType || "flight", createdAt: record.createdAt,
    href: `/dashboard/bookings?booking=${encodeURIComponent(record.sourceEnquiryId || record.bookingRef)}`,
});

async function loadBookings(Model, query) {
    const [total, completed, cancelled, upcoming, records] = await Promise.all([
        Model.countDocuments(query),
        Model.countDocuments({ ...query, status: "COMPLETED" }),
        Model.countDocuments({ ...query, status: { $in: ["CANCELLED", "CANCELED"] } }),
        Model.countDocuments({ ...query, status: { $in: ["CONFIRMED", "TICKETED", "TRAVEL_READY"] }, $and: [{ $or: [
            { "enquirySnapshot.fields.preferredTravelDate": { $gte: new Date().toISOString().slice(0, 10) } },
            { "customizationSnapshot.searchInput.checkIn": { $gte: new Date().toISOString().slice(0, 10) } },
            { "segmentSnapshot.0.departureDateTime": { $gte: new Date().toISOString() } },
        ] }] }),
        Model.find(query).select("bookingRef sourceEnquiryId tourTitle status paymentStatus journeyType createdAt")
            .sort({ createdAt: -1 }).limit(LIMIT).lean(),
    ]);
    return { enabled: true, label: "Bookings", summary: { total, upcoming, completed, cancelled }, items: records.map(bookingItem), hasMore: total > records.length };
}

export const journeyResolver = ({ productId, wishlist = false, flights = false }) => async (context, options = {}) => {
    const modules = {};
    const scope = { ...customerScopeQuery(context), journeyType: { $in: context.services.map((key) => ({ tours: "tour", trips: "trip", flights: "flight", hotels: "hotel" })[key]).filter(Boolean) } };
    if (context.permissions.includes("booking:view") && options.modules?.bookings !== false) {
        const bookings = await loadBookings(Booking, { ...scope, userId: context.userId, product: productId });
        if (flights && context.services.includes("flights")) {
            const flightBookings = await loadBookings(FlightBooking, { ...customerScopeQuery(context), userId: context.userId });
            modules.flights = { ...flightBookings, label: "Flights" };

            for (const key of Object.keys(bookings.summary)) bookings.summary[key] += flightBookings.summary[key];
            bookings.items = [...bookings.items, ...flightBookings.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, LIMIT);
            bookings.hasMore = bookings.summary.total > bookings.items.length;
        }
        if (flights && context.services.includes("hotels")) modules.hotels = { ...await loadBookings(Booking, { ...scope, userId: context.userId, product: productId, journeyType: "hotel" }), label: "Hotels" };
        modules.bookings = bookings;
        const enquiryQuery = { ...scope, claimedBy: context.userId, product: productId };
        const [enquiries, enquiryCount] = await Promise.all([
            ContactLead.find(enquiryQuery).select("enquiryRef tourTitle status createdAt").sort({ createdAt: -1 }).limit(LIMIT).lean(),
            ContactLead.countDocuments(enquiryQuery),
        ]);
        const enquiryIds = await ContactLead.find(enquiryQuery).distinct("_id");
        const quoteQuery = { inquiryId: { $in: enquiryIds }, status: { $in: ["SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CHANGE_REQUESTED", "sent", "accepted", "rejected", "expired", "change_requested"] } };
        const [quoteCount, quotes] = await Promise.all([
            BookingQuote.countDocuments(quoteQuery),
            BookingQuote.find(quoteQuery).select("quoteRef quoteNumber inquiryId status createdAt").sort({ createdAt: -1 }).limit(LIMIT).lean(),
        ]);
        modules.quotes = { enabled: true, label: "Quotes", count: quoteCount, hasMore: quoteCount > quotes.length, items: quotes.map((quote) => ({
            id: String(quote._id), title: quote.quoteRef || quote.quoteNumber || "Travel quote", status: quote.status,
            href: `/dashboard/bookings?enquiry=${encodeURIComponent(quote.inquiryId)}`,
        })) };
        modules.inquiries = { enabled: true, label: "Enquiries", count: enquiryCount, items: enquiries.map((item) => ({
            id: String(item._id), reference: item.enquiryRef, title: item.tourTitle || item.enquiryRef || "Travel enquiry", status: item.status,
            href: `/dashboard/bookings?enquiry=${encodeURIComponent(item._id)}`,
        })), hasMore: enquiryCount > enquiries.length };
    }
    if (wishlist && context.permissions.includes("wishlist:view") && options.modules?.wishlist !== false) {
        const query = { ...customerScopeQuery(context), userId: context.userId, product: productId };
        const [count, favorites] = await Promise.all([Favorite.countDocuments(query), Favorite.find(query).sort({ createdAt: -1 }).limit(LIMIT).lean()]);
        const Model = productId === "trevio" ? Trip : Tour;
        const journeys = await Model.find({ _id: { $in: favorites.map((item) => item.tourId) } }).select("title name slug").lean();
        const byId = new Map(journeys.map((item) => [String(item._id), item]));
        modules.wishlist = { enabled: true, label: "Wishlist", count, hasMore: count > favorites.length,
            items: favorites.map((favorite) => {
                const journey = byId.get(String(favorite.tourId));
                return { id: String(favorite._id), title: journey?.title || journey?.name || "Saved journey",
                    href: journey ? new URL(`/${productId === "trevio" ? "trips" : "trevista/tours"}/${encodeURIComponent(journey.slug || journey._id)}`, productId === "trevio" ? config.TREVIO_URL : config.TREVISTA_URL).toString() : null };
            }) };
    }
    for (const key of Object.keys(modules)) if (options.modules?.[key] === false) delete modules[key];
    return { enabled: true, modules };
};
