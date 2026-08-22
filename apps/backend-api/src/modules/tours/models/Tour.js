// models/Tour.js
import mongoose from "mongoose";
import { DEPARTURE_STATUS, DEPARTURE_STATUS_LIST, PACKAGE_TYPE, PACKAGE_TYPE_LIST, PRICE_SOURCE, PRICE_SOURCE_LIST, TOUR_STATUS, TOUR_STATUS_LIST } from "../../../constants/enums.js";
import { buildTourSearchMetadata } from "../services/tourSearchMetadata.service.js";

const { Schema } = mongoose;
const INVENTORY_SOURCE = Object.freeze({
    AGENT: "agent",
    PROVIDER: "provider",
    PLATFORM: "platform",
});
const INVENTORY_SOURCE_LIST = Object.values(INVENTORY_SOURCE);
const COMMERCIAL_UNITS = ["FIXED", "PER_BOOKING", "PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_INFANT", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_PERSON_PER_NIGHT", "PER_VEHICLE", "PER_TRIP", "PER_DAY", "PER_GROUP"];
const COMPONENT_TYPES = ["ACCOMMODATION", "FLIGHT", "ACTIVITY", "TRANSFER", "MEAL", "SIGHTSEEING", "VISA", "INSURANCE", "GUIDE", "TAX", "AGENT_CHARGE", "MISCELLANEOUS"];

const slugifySearchValue = (value = "") => String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ---------- Sub-schemas ---------- */

const addressSchema = new Schema({
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
}, { _id: false });

const reviewSchema = new Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, default: "" },
}, { _id: true });

const periodSchema = new Schema({
    days: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 0 },
}, { _id: false });

/* Seasonal pricing: allows date ranges and notes */
const seasonalPricingSchema = new Schema({
    seasonName: { type: String, required: true }, // e.g. "Winter 2026"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    isFinal: { type: Boolean, default: false }, // agent-confirmed or approximate
    source: { type: String, enum: PRICE_SOURCE_LIST, default: PRICE_SOURCE.MANUAL },
    notes: { type: String, default: "" }, // e.g. "festival surcharge applies"
}, { _id: true });

/* Itinerary: structured per-day entries */
const itineraryActivitySchema = new Schema({
    name: { type: String, default: "" }, // e.g. "Snorkeling at Nusa Penida"
    description: { type: String, default: "" },
    duration: { type: String, default: "" }, // e.g. "3 hours"
    price: { type: Number, min: 0, default: 0 }, // per-person price (0 = included in tour)
    currency: { type: String, default: "INR" },
    included: { type: Boolean, default: true }, // true = included in base price, false = optional add-on
    bookable: { type: Boolean, default: false }, // can customer book this activity
}, { _id: true });

const itineraryItemSchema = new Schema({
    day: { type: Number, required: true, min: 1 }, // day index
    title: { type: String, default: "" }, // short title e.g. "Arrival & City Tour"
    summary: { type: String, default: "" }, // short summary
    activities: [{ type: String }], // bullet activities (legacy string array)
    structuredActivities: [itineraryActivitySchema], // structured activities with pricing
    meals: [{ type: String }], // e.g. ["Breakfast", "Lunch"]
    accommodation: { type: String, default: "" }, // hotel name / "Camping"
    location: { type: String, default: "" }, // city / site
    notes: { type: String, default: "" },
}, { _id: true });

/* Highlights: short list or richer object */
const highlightSchema = new Schema({
    title: { type: String, required: true }, // e.g. "Sunset boat ride"
    short: { type: String, default: "" }, // brief phrase
    icon: { type: String, default: "" }, // optional icon name / url
    order: { type: Number, default: 0 },
}, { _id: true });

// City from and to
const citySchema = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true},
}, { _id: false });

/* Included stays: structured accommodation included in the tour */
const includedStaySchema = new Schema({
    nights: { type: Number, min: 0, default: 1 },
    location: { type: String, default: "" }, // e.g. "Ubud"
    propertyName: { type: String, default: "" }, // e.g. "garden resort"
    propertyClass: { type: String, default: "" }, // e.g. "4-star"
    roomType: { type: String, default: "" }, // e.g. "Deluxe room"
    meals: [{ type: String }], // e.g. ["Breakfast"]
    description: { type: String, default: "" },
    photos: [{ type: String, trim: true }],
    amenities: [{ type: String, trim: true }],
    tier: { type: String, enum: ["base", "standard", "premium", ""], default: "" }, // pricing tier
    pricing: {
        unit: { type: String, enum: ["PER_PERSON", "PER_BOOKING", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_VEHICLE", "PER_PERSON_PER_NIGHT"], default: null },
        amountMinor: { type: Number, min: 0, default: null }, // 0 = included in base price
        currency: { type: String, default: "INR" },
    },
}, { _id: true });

const hotelRoomOptionSchema = new Schema({
    roomKey: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    bedType: { type: String, trim: true, default: "" },
    maxAdults: { type: Number, min: 1, default: 2 },
    maxChildren: { type: Number, min: 0, default: 0 },
    meals: [{ type: String, trim: true }],
    amenities: [{ type: String, trim: true }],
    photos: [{ type: String, trim: true }],
    packageKeys: [{ type: String, trim: true }],
    available: { type: Boolean, default: true },
    pricing: {
        unit: { type: String, enum: ["PER_PERSON", "PER_BOOKING", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_PERSON_PER_NIGHT"], default: "PER_ROOM_PER_NIGHT" },
        amountMinor: { type: Number, min: 0, required: true },
        currency: { type: String, default: "INR" },
    },
}, { _id: true });

/* Hotel upgrade options shown in the "Hotel options" modal */
const hotelOptionSchema = new Schema({
    // Kept optional at schema level so older tours remain editable. The builder
    // save boundary always generates and persists a stable key.
    optionKey: { type: String, trim: true, default: "" },
    // Groups interchangeable properties for one itinerary stay. A Jaipur
    // hotel can only replace another Jaipur hotel carrying the same stayKey.
    stayKey: { type: String, trim: true, default: "" },
    title: { type: String, default: "" }, // e.g. "Premium upgrade"
    description: { type: String, default: "" }, // e.g. "5-star Ubud resort + premium Seminyak property"
    propertyName: { type: String, trim: true, default: "" },
    propertyClass: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    nights: { type: Number, min: 0, default: 1 },
    photos: [{ type: String, trim: true }],
    amenities: [{ type: String, trim: true }],
    packageKeys: [{ type: String, trim: true }],
    rooms: [hotelRoomOptionSchema],
    costLabel: { type: String, default: "Upgrade cost" },
    cost: { type: String, default: "" }, // e.g. "Included" or "₹18,000 per room"
    tier: { type: String, enum: ["base", "standard", "premium", ""], default: "" }, // pricing tier
    recommended: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    pricing: {
        unit: { type: String, enum: ["PER_PERSON", "PER_BOOKING", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_VEHICLE", "PER_PERSON_PER_NIGHT"], default: null },
        amountMinor: { type: Number, min: 0, default: null },
        currency: { type: String, default: "INR" },
    },
}, { _id: true });

/* Cancellation tiers: refund windows sorted by days before departure */
const cancellationTierSchema = new Schema({
    label: { type: String, default: "" }, // e.g. "Free cancellation"
    daysBefore: { type: Number, default: null }, // cutoff: refund applies when cancelling X+ days before
    refundPercent: { type: Number, default: null }, // 0-100
    description: { type: String, default: "" },
}, { _id: false });

/* Structured cancellation details */
const cancellationSchema = new Schema({
    policy: { type: String, default: "" }, // free text (mirrors cancellationPolicy)
    freeCancellationUntil: { type: String, default: "" }, // e.g. "14 days before departure"
    refundPercent: { type: Number, default: 100 }, // default refund % under free-cancel window
    depositRequired: { type: Boolean, default: false },
    depositPercent: { type: Number, default: null },
    depositNote: { type: String, default: "" },
    note: { type: String, default: "" },
    tiers: [cancellationTierSchema],
}, { _id: false });

/* Optional extras / add-ons guests can purchase */
const extraSchema = new Schema({
    title: { type: String, default: "" }, // e.g. "Extra night"
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    priceLabel: { type: String, default: "" }, // e.g. "₹2,500 / night"
    icon: { type: String, default: "" }, // icon name
    category: { type: String, enum: ["activity", "transfer", "meal", "visa", "insurance", "other", ""], default: "" }, // add-on type
    included: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    pricing: {
        unit: { type: String, enum: ["PER_PERSON", "PER_BOOKING", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_VEHICLE", "PER_PERSON_PER_NIGHT"], default: null },
        amountMinor: { type: Number, min: 0, default: null },
        currency: { type: String, default: "INR" },
    },
}, { _id: true });

const searchDestinationSchema = new Schema({
    destinationId: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    cityId: { type: String, trim: true, default: "" },
    cityName: { type: String, trim: true, default: "" },
    countryId: { type: String, trim: true, default: "" },
    countryName: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
}, { _id: false });

const searchTagSchema = new Schema({
    id: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, lowercase: true, default: "" },
    name: { type: String, trim: true, default: "" },
    type: {
        type: String,
        enum: ["DESTINATION", "ATTRACTION", "EXPERIENCE", "THEME", "ORIGIN", "SEASON", "AUDIENCE", "CUSTOM"],
        default: "CUSTOM",
    },
}, { _id: false });

/* ---------- Package type sub-schemas ---------- */

/* Fixed departure: embedded departure with its own pricing and capacity */
const tourDepartureSchema = new Schema({
    label: { type: String, default: "" }, // e.g. "Dec 2026 Batch"
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    status: { type: String, enum: DEPARTURE_STATUS_LIST, default: DEPARTURE_STATUS.ACTIVE, index: true },
    capacity: { type: Number, min: 0, default: null }, // null = unlimited
    seatsAvailable: { type: Number, min: 0, default: null }, // null = unlimited
    pricing: {
        min: { type: Number, min: 0, default: 0 },
        max: { type: Number, min: 0, default: 0 },
        currency: { type: String, default: "INR" },
        isFinal: { type: Boolean, default: false },
        source: { type: String, enum: PRICE_SOURCE_LIST, default: PRICE_SOURCE.MANUAL },
    },
    bookingOpensAt: { type: Date, default: null },
    bookingClosesAt: { type: Date, default: null },
    notes: { type: String, default: "" },
}, { _id: true });

/* Flexible tour: date-window config with seasonal/fixed/on-request pricing */
const flexibleConfigSchema = new Schema({
    earliestDeparture: { type: Date, default: null },
    latestReturn: { type: Date, default: null },
    blackoutDates: [{ type: Date }], // dates that cannot be booked
    pricingModel: {
        type: String,
        enum: ["seasonal", "fixed", "on_request"],
        default: "seasonal",
    },
    minAdvanceBookingDays: { type: Number, min: 0, default: 0 },
    maxAdvanceBookingDays: { type: Number, min: 0, default: null },
}, { _id: false });

/* Custom tour: quote-based workflow config */
const customConfigSchema = new Schema({
    responseTimeframeHours: { type: Number, min: 1, default: 48 },
    requireDates: { type: Boolean, default: true },
    requireGroupSize: { type: Boolean, default: true },
    allowAgentDraft: { type: Boolean, default: true },
    allowCustomerCustomization: { type: Boolean, default: false },
    questionnaireFields: [{ type: String }], // e.g. ["budget", "interests", "visaStatus"]
}, { _id: false });

/* Cost-based commercial definition. Legacy price remains a derived projection. */
const commercialComponentSchema = new Schema({
    componentKey: { type: String, trim: true, required: true },
    type: { type: String, enum: COMPONENT_TYPES, required: true },
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    supplierRef: { type: String, trim: true, default: "" },
    replacesComponentKey: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ["ESTIMATED", "CONFIRMED", "REPRICE_REQUIRED"], default: "CONFIRMED" },
    pricing: {
        unit: { type: String, enum: COMMERCIAL_UNITS, required: true },
        costAmountMinor: { type: Number, min: 0, required: true },
        sellingAmountMinor: { type: Number, min: 0, required: true },
        currency: { type: String, default: "INR" },
    },
    details: { type: Schema.Types.Mixed, default: null },
}, { _id: true });

const commercialPackageSchema = new Schema({
    packageKey: { type: String, trim: true, required: true },
    tier: { type: String, enum: ["BASIC", "STANDARD", "PREMIUM"], required: true },
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    enabled: { type: Boolean, default: true },
    recommended: { type: Boolean, default: false },
    includedComponentKeys: [{ type: String, trim: true }],
    optionalComponentKeys: [{ type: String, trim: true }],
}, { _id: true });

const commercialSchema = new Schema({
    version: { type: String, enum: ["LEGACY", "COMPONENTS_V1"], default: "LEGACY", index: true },
    currency: { type: String, default: "INR" },
    components: [commercialComponentSchema],
    packages: [commercialPackageSchema],
    defaultBasis: {
        adults: { type: Number, min: 0, default: 1 }, children: { type: Number, min: 0, default: 0 },
        infants: { type: Number, min: 0, default: 0 }, rooms: { type: Number, min: 1, default: 1 },
        vehicles: { type: Number, min: 1, default: 1 }, nights: { type: Number, min: 0, default: 1 },
        days: { type: Number, min: 1, default: 1 },
    },
    pricingPolicy: {
        feeType: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" },
        feePercent: { type: Number, min: 0, max: 100, default: 10 },
        feeAmountMinor: { type: Number, min: 0, default: 0 },
        gstPercent: { type: Number, min: 0, max: 100, default: 18 },
        gstOn: { type: String, enum: ["AGENT_FEE"], default: "AGENT_FEE" },
    },
    derived: {
        minAmountMinor: { type: Number, min: 0, default: null },
        maxAmountMinor: { type: Number, min: 0, default: null },
        calculatedAt: { type: Date, default: null },
        displayMode: { type: String, enum: ["FINAL", "STARTING_FROM", "ESTIMATED"], default: "ESTIMATED" },
        packages: { type: [Schema.Types.Mixed], default: [] },
    },
}, { _id: false });

/* ---------- Main tour schema ---------- */

/*
  Additions included:
  - startDate / endDate: the fixed run dates for packages designed with fixed duration
  - availability: simple seats tracking (totalSeats + seatsAvailable)
  - inclusions / exclusions: arrays of strings (what's included / not)
  - meetingPoint: where guests assemble
  - languages: array of languages the guide supports
  - cancellationPolicy: free-text policy
  - minAge / maxAge: optional age restrictions
  - tags: small array for quick filtering
  - status: publishing control (`isPublished` is a legacy derived mirror)
*/

const tourSchema = new Schema({
    agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    productKey: { type: String, default: "trevista", index: true },
    visibility: { type: String, enum: ["public", "agency", "private"], default: "public" },
    archivedAt: { type: Date, default: null },
    slug: { type: String, trim: true, lowercase: true, default: "", index: true },
    title: { type: String, required: true },
    shortDescription: { type: String, trim: true, default: "" },
    agentRef: { type: String, trim: true, default: "", index: true },
    city: { type: citySchema, required: true },
    address: { type: addressSchema, required: true },
    distance: { type: Number, required: true },
    period: { type: periodSchema, required: true },

    // Package run dates (useful when the package is scheduled for a specific window)
    startDate: { type: Date }, // optional: when this specific package starts
    endDate: { type: Date },   // optional: when this specific package ends

    // Photos (backwards compatible)
    photo: { type: String },
    photos: [{ type: String }],

    desc: { type: String, required() { return this.status !== "draft"; } },

    // Base price range
    price: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        isFinal: { type: Boolean, default: false }, // if false => display "approx"
        source: { type: String, enum: PRICE_SOURCE_LIST, default: PRICE_SOURCE.MANUAL },
    },

    commercial: { type: commercialSchema, default: () => ({ version: "LEGACY" }) },

    // Seasonal pricing,overrides base price when date in range
    seasonalPricing: [seasonalPricingSchema],

    // Itinerary and highlights
    itinerary: [itineraryItemSchema],
    highlights: [highlightSchema],

    // Included accommodation + hotel upgrade options
    includedStays: [includedStaySchema],
    hotelOptions: [hotelOptionSchema],

    // Structured cancellation details + optional extras
    cancellation: { type: cancellationSchema, default: () => ({}) },
    extras: [extraSchema],

    // Availability & capacity
    availability: {
        totalSeats: { type: Number, default: null }, // null = unlimited / not tracked
        seatsAvailable: { type: Number, default: null },
    },

    // Package type determines how dates, pricing, and bookings work
    packageType: { type: String, enum: PACKAGE_TYPE_LIST, default: PACKAGE_TYPE.FIXED_DEPARTURE, index: true },

    // Fixed departure tours: embedded departures with per-departure pricing & capacity
    departures: [tourDepartureSchema],

    // Flexible tours: date window and pricing model config
    flexibleConfig: { type: flexibleConfigSchema, default: () => ({}) },

    // Custom tours: quote-based workflow config
    customConfig: { type: customConfigSchema, default: () => ({}) },

    flights: {
        included: { type: Boolean, default: false },
        inventoryManaged: { type: Boolean, default: false },
        pricePerPerson: { type: Number, min: 0, default: 0 }, // per-person flight price (0 = included at no extra cost)
        currency: { type: String, default: "INR" },
        departureCity: { type: String, default: "" }, // e.g. "Delhi"
        arrivalCity: { type: String, default: "" }, // e.g. "Bali"
        airline: { type: String, default: "" }, // e.g. "IndiGo"
        notes: { type: String, default: "" }, // e.g. "Direct flight"
    },

    // Logistics & marketing fields
    meetingPoint: { type: String, default: "" },
    inclusions: [{ type: String }], // e.g. ["Breakfast", "Entry fees", "Local guide"]
    exclusions: [{ type: String }], // e.g. ["Flights", "Insurance"]
    languages: [{ type: String }], // e.g. ["English", "Hindi"]
    cancellationPolicy: { type: String, default: "" },

    // Optional age constraints
    minAge: { type: Number, min: 0 },
    maxAge: { type: Number, min: 0 },

    // Misc
    maxGroupSize: { type: Number, required: true },
    reviews: [reviewSchema],
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false, index: true },

    // Search metadata is additive and keeps legacy fields authoritative during migration.
    group: {
        min: { type: Number, min: 1, default: 1 },
        max: { type: Number, min: 1, default: null },
    },
    rating: {
        average: { type: Number, min: 0, max: 5, default: 0 },
        count: { type: Number, min: 0, default: 0 },
    },
    primaryDestination: { type: searchDestinationSchema, default: () => ({}) },
    destinations: [searchDestinationSchema],
    tagIds: [{ type: String, trim: true, lowercase: true }],
    searchTags: [searchTagSchema],
    metrics: {
        views: { type: Number, min: 0, default: 0 },
        bookings: { type: Number, min: 0, default: 0 },
        wishlists: { type: Number, min: 0, default: 0 },
        popularityScore: { type: Number, default: 0 },
        trendScore: { type: Number, default: 0 },
    },

    ownerAgent: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    agentTour: { type: Boolean, default: false },
    agencyRef: { type: String, trim: true, default: "", index: true },
    partnerAgencyRef: { type: String, trim: true, default: "", index: true },
    inventorySource: {
        type: String,
        enum: INVENTORY_SOURCE_LIST,
        default: INVENTORY_SOURCE.PLATFORM,
        index: true,
    },
    providerName: { type: String, trim: true, default: "" },

    // tags and publishing
    tags: [{ type: String }],
    // Deprecated compatibility field. Never use this for visibility decisions.
    isPublished: { type: Boolean, default: true },
    status: { type: String, enum: TOUR_STATUS_LIST, default: TOUR_STATUS.PUBLISHED },
    builderProcess: { type: Schema.Types.Mixed, default: null },
    tremVerified: { type: Boolean, default: false, index: true },
    tremVerifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    tremVerifiedAt: { type: Date, default: null },

}, { timestamps: true });
tourSchema.index({ agencyId: 1, ownerAgent: 1, status: 1 });

/* ---------- Virtuals ---------- */

tourSchema.virtual("avgRating").get(function () {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return +(sum / this.reviews.length).toFixed(1);
});

/* ---------- Instance helper: getCurrentPrice(date) ----------

Returns an object:
{
  min, max, currency, isFinal, source, matchedSeason (null|seasonName), note
}

Behavior:
- If a seasonalPricing entry matches the provided date (inclusive), returns that seasonal price.
- If multiple seasons match (overlap), picks the one with the latest startDate (you can change policy).
- Otherwise returns base price.
*/
tourSchema.methods.getCurrentPrice = function (date = new Date()) {
    const target = date instanceof Date ? date : new Date(date);

    // For fixed departure tours with embedded departures, look up by date
    if (this.packageType === PACKAGE_TYPE.FIXED_DEPARTURE && Array.isArray(this.departures) && this.departures.length > 0) {
        const match = this.departures.find((dep) => {
            if (!dep.departureDate || !dep.returnDate) return false;
            return target >= new Date(dep.departureDate) && target <= new Date(dep.returnDate);
        });
        if (match) {
            return {
                min: match.pricing.min,
                max: match.pricing.max,
                currency: match.pricing.currency || this.price?.currency || "INR",
                isFinal: !!match.pricing.isFinal,
                source: match.pricing.source || PRICE_SOURCE.MANUAL,
                matchedSeason: match.label || null,
                note: match.notes || "",
                departureId: match._id,
            };
        }
    }

    if (Array.isArray(this.seasonalPricing) && this.seasonalPricing.length > 0) {
        // find matching seasons where startDate <= date <= endDate
        const matches = this.seasonalPricing.filter(s => {
            if (!s.startDate || !s.endDate) return false;
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            return target >= start && target <= end;
        });

        if (matches.length > 0) {
            // If more than one match, pick the one with latest startDate (policy choice)
            matches.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            const season = matches[0];
            return {
                min: season.min,
                max: season.max,
                currency: season.currency || this.price?.currency || "INR",
                isFinal: !!season.isFinal,
                source: season.source || PRICE_SOURCE.MANUAL,
                matchedSeason: season.seasonName,
                note: season.notes || "",
            };
        }
    }

    // fallback to base price
    return {
        min: this.price?.min || 0,
        max: this.price?.max || 0,
        currency: this.price?.currency || "INR",
        isFinal: !!this.price?.isFinal,
        source: this.price?.source || PRICE_SOURCE.MANUAL,
        matchedSeason: null,
        note: "",
    };
};

/* ---------- Serialization options ---------- */
tourSchema.set("toJSON", { virtuals: true });
tourSchema.set("toObject", { virtuals: true });

/* ---------- Indexes (optional) ---------- */
tourSchema.index({ status: 1, visibility: 1, featured: -1, trending: -1, createdAt: -1 });
tourSchema.index({ packageType: 1, status: 1 });
tourSchema.index({ "departures.departureDate": 1, "departures.status": 1 });
tourSchema.index({ "city.from": 1, "city.to": 1, "address.country": 1, "period.days": 1 });
// These are both array fields and cannot share a compound multikey index.
tourSchema.index({ tags: 1 });
tourSchema.index({ "searchTags.slug": 1 });
tourSchema.index({ startDate: 1, endDate: 1 });
tourSchema.index({ ownerAgent: 1, inventorySource: 1 });
tourSchema.index({
    title: "text",
    "searchTags.name": "text",
    "city.from": "text",
    "city.to": "text",
    "primaryDestination.cityName": "text",
    "primaryDestination.countryName": "text",
    "address.city": "text",
    "address.state": "text",
    "address.country": "text",
    providerName: "text",
}, {
    name: "tour_discovery_text",
    weights: {
        title: 12,
        "city.to": 10,
        "primaryDestination.cityName": 10,
        "address.city": 8,
        "searchTags.name": 6,
        "city.from": 5,
        "primaryDestination.countryName": 4,
        "address.state": 4,
        "address.country": 4,
        providerName: 2,
    },
});

// Keep newly created and edited tours searchable without waiting for a migration.
tourSchema.pre("validate", function normalizeSearchMetadata() {
    this.isPublished = this.status === "published";
    if (!this.slug) this.slug = slugifySearchValue(this.title);
    if (!this.shortDescription) this.shortDescription = String(this.desc || "").slice(0, 240);
    if (this.group?.max == null && this.maxGroupSize != null) this.set("group.max", this.maxGroupSize);

    const destinationName = this.city?.to || this.address?.city || "";
    const countryName = this.address?.country || "";
    if (!this.primaryDestination?.cityName && destinationName) {
        this.primaryDestination = {
            destinationId: slugifySearchValue(destinationName),
            name: destinationName,
            cityId: slugifySearchValue(destinationName),
            cityName: destinationName,
            countryId: slugifySearchValue(countryName),
            countryName,
            sortOrder: 0,
        };
    }

    const reviews = Array.isArray(this.reviews) ? this.reviews : [];
    const reviewTotal = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    this.rating = {
        average: reviews.length ? Number((reviewTotal / reviews.length).toFixed(1)) : 0,
        count: reviews.length,
    };

    const searchMetadata = buildTourSearchMetadata(this);
    this.tags = searchMetadata.tags;
    this.tagIds = searchMetadata.tagIds;
    this.searchTags = searchMetadata.searchTags;

    if (this.commercial?.version === "COMPONENTS_V1") {
        const packageKeys = new Set((this.commercial.packages || []).map((item) => String(item.packageKey || "")).filter(Boolean));
        const assignedStayPackages = new Set();
        const stayGroups = new Map();
        (this.hotelOptions || []).forEach((option, index) => {
            const normalizedStayKey = String(option.stayKey || option.location || option.optionKey || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const normalizedLocation = String(option.location || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const stayGroup = stayGroups.get(normalizedStayKey);
            if (stayGroup && stayGroup.location !== normalizedLocation) this.invalidate(`hotelOptions.${index}.stayKey`, `Hotels grouped under '${normalizedStayKey}' must be in the same location`);
            if (stayGroup && stayGroup.nights !== Number(option.nights || 0)) this.invalidate(`hotelOptions.${index}.nights`, `Hotels grouped under '${normalizedStayKey}' must cover the same number of nights`);
            if (!stayGroup && normalizedStayKey) stayGroups.set(normalizedStayKey, { location: normalizedLocation, nights: Number(option.nights || 0) });
            const invalidKey = (option.packageKeys || []).map(String).find((key) => !packageKeys.has(key));
            if (invalidKey) this.invalidate(`hotelOptions.${index}.packageKeys`, `Hotel option references unknown package '${invalidKey}'`);
            const assignedPackages = new Set();
            (option.rooms || []).forEach((room, roomIndex) => {
                const invalidRoomKey = (room.packageKeys || []).map(String).find((key) => !packageKeys.has(key));
                if (invalidRoomKey) this.invalidate(`hotelOptions.${index}.rooms.${roomIndex}.packageKeys`, `Room option references unknown package '${invalidRoomKey}'`);
                (room.packageKeys || []).map(String).forEach((key) => {
                    if (assignedPackages.has(key)) this.invalidate(`hotelOptions.${index}.rooms.${roomIndex}.packageKeys`, `Only one room per hotel can be included in package '${key}'`);
                    assignedPackages.add(key);
                    const stayKey = normalizedStayKey;
                    const stayPackageKey = `${stayKey}:${key}`;
                    if (stayKey && assignedStayPackages.has(stayPackageKey)) this.invalidate(`hotelOptions.${index}.rooms.${roomIndex}.packageKeys`, `Only one hotel room per stay can be included in package '${key}'`);
                    if (stayKey) assignedStayPackages.add(stayPackageKey);
                });
            });
        });
    }
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
