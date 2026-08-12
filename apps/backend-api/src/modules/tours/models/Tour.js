// models/Tour.js
import mongoose from "mongoose";
import { PRICE_SOURCE, PRICE_SOURCE_LIST, TOUR_STATUS, TOUR_STATUS_LIST } from "../../../constants/enums.js";

const { Schema } = mongoose;
const INVENTORY_SOURCE = Object.freeze({
    AGENT: "agent",
    PROVIDER: "provider",
    PLATFORM: "platform",
});
const INVENTORY_SOURCE_LIST = Object.values(INVENTORY_SOURCE);

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
const itineraryItemSchema = new Schema({
    day: { type: Number, required: true, min: 1 }, // day index
    title: { type: String, default: "" }, // short title e.g. "Arrival & City Tour"
    summary: { type: String, default: "" }, // short summary
    activities: [{ type: String }], // bullet activities
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
}, { _id: true });

/* Hotel upgrade options shown in the "Hotel options" modal */
const hotelOptionSchema = new Schema({
    title: { type: String, default: "" }, // e.g. "Premium upgrade"
    description: { type: String, default: "" }, // e.g. "5-star Ubud resort + premium Seminyak property"
    costLabel: { type: String, default: "Upgrade cost" },
    cost: { type: String, default: "" }, // e.g. "Included" or "₹18,000 per room"
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
  - isPublished / status: lightweight publishing control
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

    desc: { type: String, required: true },

    // Base price range
    price: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        isFinal: { type: Boolean, default: false }, // if false => display "approx"
        source: { type: String, enum: PRICE_SOURCE_LIST, default: PRICE_SOURCE.MANUAL },
    },

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
    flights: {
        included: { type: Boolean, default: false },
        inventoryManaged: { type: Boolean, default: false },
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
    isPublished: { type: Boolean, default: true },
    status: { type: String, enum: TOUR_STATUS_LIST, default: TOUR_STATUS.PUBLISHED },
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
                currency: season.currency || this.price.currency,
                isFinal: !!season.isFinal,
                source: season.source || PRICE_SOURCE.MANUAL,
                matchedSeason: season.seasonName,
                note: season.notes || "",
            };
        }
    }

    // fallback to base price
    return {
        min: this.price.min,
        max: this.price.max,
        currency: this.price.currency,
        isFinal: !!this.price.isFinal,
        source: this.price.source || PRICE_SOURCE.MANUAL,
        matchedSeason: null,
        note: "",
    };
};

/* ---------- Serialization options ---------- */
tourSchema.set("toJSON", { virtuals: true });
tourSchema.set("toObject", { virtuals: true });

/* ---------- Indexes (optional) ---------- */
tourSchema.index({ status: 1, isPublished: 1, visibility: 1, featured: -1, trending: -1, createdAt: -1 });
tourSchema.index({ "city.from": 1, "city.to": 1, "address.country": 1, "period.days": 1 });
tourSchema.index({ tags: 1, "searchTags.slug": 1 });
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

    if ((!this.searchTags || this.searchTags.length === 0) && Array.isArray(this.tags)) {
        this.searchTags = this.tags.map((name) => {
            const normalized = String(name || "").trim();
            const slug = slugifySearchValue(normalized);
            return { id: slug, slug, name: normalized, type: "CUSTOM" };
        }).filter((tag) => tag.slug);
        this.tagIds = this.searchTags.map((tag) => tag.slug);
    }
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
