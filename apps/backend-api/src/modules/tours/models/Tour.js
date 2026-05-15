// models/Tour.js
import mongoose from "mongoose";

const { Schema } = mongoose;

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
    source: { type: String, enum: ["manual", "ai", "agent"], default: "manual" },
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

// City from and top: 
const citySchema = new Schema({
    from: { type: String, required: true }, // e.g. "Sunset boat ride"
    to: { type: String, required: true}, // brief phrase
}, { _id: true });

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
    title: { type: String, required: true, unique: true },
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
        source: { type: String, enum: ["manual", "ai", "agent"], default: "manual" },
    },

    // Seasonal pricing—overrides base price when date in range
    seasonalPricing: [seasonalPricingSchema],

    // Itinerary and highlights
    itinerary: [itineraryItemSchema],
    highlights: [highlightSchema],

    // Availability & capacity
    availability: {
        totalSeats: { type: Number, default: null }, // null = unlimited / not tracked
        seatsAvailable: { type: Number, default: null },
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

    // tags and publishing
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "published", "cancelled"], default: "published" },

}, { timestamps: true });

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
                source: season.source || "manual",
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
        source: this.price.source || "manual",
        matchedSeason: null,
        note: "",
    };
};

/* ---------- Serialization options ---------- */
tourSchema.set("toJSON", { virtuals: true });
tourSchema.set("toObject", { virtuals: true });

/* ---------- Indexes (optional) ---------- */
tourSchema.index({ city: 1, featured: -1, "price.min": 1 });
tourSchema.index({ startDate: 1, endDate: 1 });

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
