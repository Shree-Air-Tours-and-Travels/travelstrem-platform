import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";
import TourDeparture from "../modules/tours/models/TourDeparture.js";
import Favorite from "../modules/tours/models/Favorite.js";
import PartnerAgency from "../modules/auth/models/PartnerAgency.js";
import User from "../modules/auth/models/User.js";
import Booking from "../modules/bookings/models/Booking.js";
import BookingAssignment from "../modules/bookings/models/BookingAssignment.js";
import BookingAuditLog from "../modules/bookings/models/BookingAuditLog.js";
import BookingDocument from "../modules/bookings/models/BookingDocument.js";
import BookingMessage from "../modules/bookings/models/BookingMessage.js";
import BookingPayment from "../modules/bookings/models/BookingPayment.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";
import BookingStatusHistory from "../modules/bookings/models/BookingStatusHistory.js";
import BookingTimeline from "../modules/bookings/models/BookingTimeline.js";
import BookingTraveller from "../modules/bookings/models/BookingTraveller.js";
import TrevioBooking from "../modules/trevio/models/TrevioBooking.js";

const slugify = (value) => String(value || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const optionPricing = (unit, rupees) => ({ unit, amountMinor: rupees * 100, currency: "INR" });
const destination = (city, state) => ({ line1: "Tour meeting point", city, state, country: "India", zip: "" });
const common = {
  productKey: "trevista", visibility: "public", archivedAt: null,
  price: { currency: "INR", isFinal: true, source: "manual" },
  cancellationPolicy: "Free cancellation until 14 days before departure; later cancellations follow the displayed refund policy.",
  languages: ["English", "Hindi"], isPublished: true, status: "published",
  inventorySource: "agent", agentTour: true, tremVerified: true,
};

const rawTours = [
  {
    slug: "udaipur-complete-royal-escape", title: "Udaipur Complete Royal Escape",
    shortDescription: "Flights, premium stay, meals, transfers and guided sightseeing included.",
    city: { from: "Delhi", to: "Udaipur" }, address: destination("Udaipur", "Rajasthan"), distance: 660,
    period: { days: 4, nights: 3 }, startDate: new Date("2026-10-17T00:00:00.000Z"), endDate: new Date("2026-10-20T00:00:00.000Z"),
    photo: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    desc: "A fully bundled Udaipur holiday covering return flights, lake-facing accommodation, daily meals, airport transfers and guided palace visits.",
    price: { ...common.price, min: 32999, max: 32999 },
    includedStays: [{ nights: 3, location: "Udaipur", propertyName: "Lake-view heritage hotel", propertyClass: "5-star", roomType: "Deluxe room", meals: ["Breakfast", "Dinner"], description: "Premium stay included." }],
    hotelOptions: [{ title: "Lake-view suite", description: "Upgrade to a larger suite.", costLabel: "Per person", cost: "₹4,500", pricing: optionPricing("PER_PERSON", 4500), active: true, recommended: true }],
    extras: [{ title: "Private sunset cruise", description: "Private Lake Pichola boat experience.", price: 6000, pricing: optionPricing("PER_BOOKING", 6000), currency: "INR", active: true }],
    flights: { included: true, inventoryManaged: true }, availability: { totalSeats: 12, seatsAvailable: 12 }, maxGroupSize: 12,
    inclusions: ["Return economy flights", "Premium hotel", "Breakfast and dinner", "Private airport transfers", "Guided sightseeing"], exclusions: ["Travel insurance", "Personal expenses"],
    meetingPoint: "Delhi Airport", tags: ["all-inclusive", "heritage", "luxury", "domestic"], featured: true, trending: true,
  },
  {
    slug: "kerala-backwaters-flexible-itinerary", title: "Kerala Backwaters Flexible Itinerary",
    shortDescription: "An itinerary-only package with every stay, meal and transfer left to the traveller.",
    city: { from: "Kochi", to: "Alleppey" }, address: destination("Alleppey", "Kerala"), distance: 55,
    period: { days: 3, nights: 2 }, startDate: new Date("2026-11-07T00:00:00.000Z"), endDate: new Date("2026-11-09T00:00:00.000Z"),
    photo: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    desc: "A flexible route plan and local recommendations for travellers who prefer booking every component independently.",
    price: { ...common.price, min: 3999, max: 3999 }, includedStays: [], hotelOptions: [], extras: [],
    flights: { included: false, inventoryManaged: false }, availability: { totalSeats: null, seatsAvailable: null }, maxGroupSize: 20,
    inclusions: ["Curated itinerary", "Local destination support"], exclusions: ["Flights", "Accommodation", "Meals", "Transfers", "Activities"],
    meetingPoint: "Kochi", tags: ["flexible", "budget", "backwaters", "domestic"], featured: false,
  },
  {
    slug: "goa-stay-and-breakfast-break", title: "Goa Stay and Breakfast Break",
    shortDescription: "Hotel and breakfast included; flights and local travel remain optional.",
    city: { from: "Mumbai", to: "Goa" }, address: destination("Panaji", "Goa"), distance: 590,
    period: { days: 4, nights: 3 }, startDate: new Date("2026-11-21T00:00:00.000Z"), endDate: new Date("2026-11-24T00:00:00.000Z"),
    photo: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    desc: "A relaxed Goa package with a comfortable resort and breakfast while keeping flights, transfers and experiences optional.",
    price: { ...common.price, min: 12999, max: 12999 },
    includedStays: [{ nights: 3, location: "North Goa", propertyName: "Beachside resort", propertyClass: "4-star", roomType: "Standard room", meals: ["Breakfast"], description: "Stay and breakfast included." }],
    hotelOptions: [{ title: "Pool-view room", description: "Pool-facing category upgrade.", costLabel: "Per room per night", cost: "₹1,800", pricing: optionPricing("PER_ROOM_PER_NIGHT", 1800), active: true }],
    extras: [{ title: "North Goa sightseeing", description: "Shared full-day sightseeing.", price: 1800, pricing: optionPricing("PER_PERSON", 1800), currency: "INR", active: true }, { title: "Private airport transfer", description: "Private sedan transfer.", price: 2500, pricing: optionPricing("PER_BOOKING", 2500), currency: "INR", active: true }],
    flights: { included: false, inventoryManaged: false }, availability: { totalSeats: null, seatsAvailable: null }, maxGroupSize: 16,
    inclusions: ["Three-night resort stay", "Daily breakfast"], exclusions: ["Flights", "Airport transfers", "Lunch and dinner", "Optional activities"],
    meetingPoint: "Hotel reception", tags: ["beach", "family", "stay-included", "domestic"], featured: true,
  },
  {
    slug: "ladakh-flight-and-road-adventure", title: "Ladakh Flight and Road Adventure",
    shortDescription: "Flights and road transport included; meals and premium upgrades are optional.",
    city: { from: "Delhi", to: "Leh" }, address: destination("Leh", "Ladakh"), distance: 1020,
    period: { days: 6, nights: 5 }, startDate: new Date("2026-12-05T00:00:00.000Z"), endDate: new Date("2026-12-10T00:00:00.000Z"),
    photo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    desc: "A small-group Ladakh circuit with return flights and shared road transport, designed for travellers who want to choose their own meal plan.",
    price: { ...common.price, min: 28999, max: 28999 },
    includedStays: [{ nights: 5, location: "Leh and Nubra", propertyName: "Standard hotels and camp", propertyClass: "3-star", roomType: "Double sharing", meals: [], description: "Accommodation included; meals optional." }],
    hotelOptions: [{ title: "Premium mountain hotels", description: "Premium properties throughout the circuit.", costLabel: "Per person", cost: "₹7,500", pricing: optionPricing("PER_PERSON", 7500), active: true }],
    extras: [{ title: "Breakfast and dinner plan", description: "Daily breakfast and dinner.", price: 5500, pricing: optionPricing("PER_PERSON", 5500), currency: "INR", active: true }],
    flights: { included: true, inventoryManaged: true }, availability: { totalSeats: 8, seatsAvailable: 8 }, maxGroupSize: 8,
    inclusions: ["Return economy flights", "Shared road transport", "Accommodation", "Permits", "Tour coordinator"], exclusions: ["Meals", "Travel insurance", "Personal expenses"],
    meetingPoint: "Delhi Airport", tags: ["adventure", "flights-included", "mountains", "domestic"], featured: true,
  },
];

await mongoose.connect(config.MONGO_URI);
const agency = await PartnerAgency.findOne({ status: { $in: ["active", "approved"] } }).sort({ createdAt: 1 });
const agent = agency ? await User.findOne({ role: "agent", partnerAgencyRef: agency._id }).sort({ createdAt: 1 }) : null;
const bookingIds = await Booking.distinct("_id");
const linked = { bookingId: { $in: bookingIds } };
const replacementSlugs = rawTours.map((tour) => tour.slug);
const removableTours = await Tour.find({
  $or: [
    { agentRef: /^pagination-demo-/ },
    { providerName: "TravelsTREM Demo Agency" },
    { slug: { $in: replacementSlugs } },
  ],
}).select("_id slug").lean();
const removableTourIds = removableTours.map((tour) => tour._id);
for (const model of [BookingAssignment, BookingAuditLog, BookingDocument, BookingMessage, BookingPayment, BookingStatusHistory, BookingTimeline, BookingTraveller]) await model.deleteMany(linked);
await Promise.all([
  BookingQuote.deleteMany({}), Booking.deleteMany({}), TrevioBooking.deleteMany({}),
  Favorite.deleteMany({ product: "trevista", tourId: { $in: removableTourIds } }),
  TourDeparture.deleteMany({ tourId: { $in: removableTourIds } }),
  Tour.deleteMany({ _id: { $in: removableTourIds } }),
]);

const ownership = agency ? {
  agencyId: agency._id, agencyRef: agency.partnerAgencyRef, partnerAgencyRef: agency.partnerAgencyRef,
  providerName: agency.agencyName, ownerAgent: agent?._id || null,
} : { providerName: "TravelsTREM", inventorySource: "platform", agentTour: false };
const tourDocuments = rawTours.map((tour) => {
  const searchTags = (tour.tags || []).map((name) => ({ id: slugify(name), slug: slugify(name), name, type: "CUSTOM" }));
  const payload = { ...common, ...tour, ...ownership, searchTags, tagIds: searchTags.map((tag) => tag.slug) };
  delete payload.tags;
  return new Tour(payload);
});
await Promise.all(tourDocuments.map((tour) => tour.validate()));
const now = new Date();
const insertPayloads = tourDocuments.map((tour) => {
  const payload = tour.toObject({ depopulate: true, versionKey: false });
  delete payload.tags;
  return { ...payload, createdAt: now, updatedAt: now };
});
await Tour.collection.insertMany(insertPayloads);
const tours = await Tour.find({ slug: { $in: replacementSlugs } });
await TourDeparture.insertMany(tours.map((tour) => ({
  tourId: tour._id,
  origin: { cityId: tour.city.from.toLowerCase(), cityName: tour.city.from, countryId: "india", countryName: "India" },
  departureDate: tour.startDate, returnDate: tour.endDate, status: "active",
  capacity: tour.flights.inventoryManaged ? tour.availability.totalSeats : null,
  availableSeats: tour.flights.inventoryManaged ? tour.availability.seatsAvailable : null,
  pricing: { ...tour.price }, legacyDerived: false,
})));

console.log(JSON.stringify({ database: mongoose.connection.name, deletedBookings: bookingIds.length, deletedDemoTours: removableTours.map((tour) => tour.slug), toursCreated: tours.map((tour) => ({ slug: tour.slug, flights: tour.flights, inclusions: tour.inclusions.length, extras: tour.extras.length })) }, null, 2));
await mongoose.disconnect();
