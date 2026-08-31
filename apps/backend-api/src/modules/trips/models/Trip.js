import mongoose from "mongoose";

const { Schema } = mongoose;

export const TRIP_STATUS = Object.freeze({
    DRAFT: "draft",
    PENDING_APPROVAL: "pending_approval",
    LISTED: "listed",
    UNPUBLISHED: "unpublished",
    ARCHIVED: "archived",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
});

const TRIP_STATUS_LIST = Object.values(TRIP_STATUS);

const itineraryItemSchema = new Schema(
    {
        day: { type: Number, required: true, min: 1 },
        title: { type: String, trim: true, default: "" },
        summary: { type: String, trim: true, default: "" },
        location: { type: String, trim: true, default: "" },
        activities: [{ type: String, trim: true }],
        meals: { type: String, trim: true, default: "" },
        accommodation: { type: String, trim: true, default: "" },
    },
    { _id: false },
);

const reviewSchema = new Schema(
    {
        name: { type: String, trim: true, default: "Guest" },
        rating: { type: Number, min: 0, max: 5, default: 0 },
        date: { type: String, trim: true, default: "" },
        comment: { type: String, trim: true, default: "" },
    },
    { _id: false },
);

const priceSchema = new Schema(
    {
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, trim: true, default: "INR" },
        tokenAmount: { type: Number, min: 0, default: 1999 },
        isFinal: { type: Boolean, default: true },
    },
    { _id: false },
);

const availabilitySchema = new Schema(
    {
        totalSeats: { type: Number, min: 0, default: null },
        seatsAvailable: { type: Number, min: 0, default: null },
    },
    { _id: false },
);

const preferenceOptionSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        includesFlights: { type: Boolean, default: false },
        // Negative adjustments represent discounts (for example shared rooms).
        extraPrice: { type: Number, default: 0 },
    },
    { _id: false },
);

const includedStaySchema = new Schema(
    {
        nights: { type: Number, min: 0, default: 1 },
        location: { type: String, trim: true, default: "" },
        propertyName: { type: String, trim: true, default: "" },
        propertyClass: { type: String, trim: true, default: "" },
        roomType: { type: String, trim: true, default: "" },
        meals: [{ type: String, trim: true }],
        description: { type: String, trim: true, default: "" },
    },
    { _id: true },
);

const hotelOptionSchema = new Schema(
    {
        title: { type: String, trim: true, default: "" },
        description: { type: String, trim: true, default: "" },
        costLabel: { type: String, trim: true, default: "Upgrade cost" },
        cost: { type: String, trim: true, default: "" },
        recommended: { type: Boolean, default: false },
    },
    { _id: true },
);

const cancellationTierSchema = new Schema(
    {
        label: { type: String, trim: true, default: "" },
        daysBefore: { type: Number, default: null },
        refundPercent: { type: Number, default: null },
        description: { type: String, trim: true, default: "" },
    },
    { _id: false },
);

const cancellationSchema = new Schema(
    {
        policy: { type: String, trim: true, default: "" },
        freeCancellationUntil: { type: String, trim: true, default: "" },
        refundPercent: { type: Number, default: 100 },
        depositRequired: { type: Boolean, default: false },
        depositPercent: { type: Number, default: null },
        depositNote: { type: String, trim: true, default: "" },
        note: { type: String, trim: true, default: "" },
        tiers: [cancellationTierSchema],
    },
    { _id: false },
);

const extraSchema = new Schema(
    {
        title: { type: String, trim: true, default: "" },
        description: { type: String, trim: true, default: "" },
        price: { type: Number, default: 0 },
        currency: { type: String, trim: true, default: "INR" },
        priceLabel: { type: String, trim: true, default: "" },
        perTraveller: { type: Boolean, default: false },
        icon: { type: String, trim: true, default: "" },
        included: { type: Boolean, default: false },
    },
    { _id: true },
);

const preferencesSchema = new Schema(
    {
        roomTypes: {
            type: [preferenceOptionSchema],
            default: () => [
                { label: "Single", value: "single", extraPrice: 0 },
                { label: "Double", value: "double", extraPrice: 0 },
                { label: "Triple", value: "triple", extraPrice: 0 },
                {
                    label: "Shared room with another traveller",
                    value: "shared",
                    extraPrice: -500,
                },
            ],
        },
        mealPreferences: {
            type: [preferenceOptionSchema],
            default: () => [
                { label: "Vegetarian", value: "veg", extraPrice: 0 },
                { label: "Non-Vegetarian", value: "nonveg", extraPrice: 500 },
                { label: "Vegan", value: "vegan", extraPrice: 0 },
                { label: "Jain", value: "jain", extraPrice: 0 },
            ],
        },
        packageTypes: {
            type: [preferenceOptionSchema],
            default: () => [
                {
                    label: "Trip without flights",
                    value: "without-flights",
                    description: "Fixed itinerary and standard trip facilities. Flights are not included.",
                    includesFlights: false,
                    extraPrice: 0,
                },
                {
                    label: "Trip with flights",
                    value: "with-flights",
                    description: "The same fixed itinerary and facilities with flights included.",
                    includesFlights: true,
                    extraPrice: 0,
                },
            ],
        },
        drinkTypes: {
            type: [preferenceOptionSchema],
            default: () => [
                { label: "Non-Alcoholic", value: "non-alcoholic", extraPrice: 0 },
                { label: "Alcoholic", value: "alcoholic", extraPrice: 2000 },
            ],
        },
    },
    { _id: false },
);

const tripSchema = new Schema(
    {
        sourceTourId: {
            type: Schema.Types.ObjectId,
            ref: "Tour",
            default: null,
            sparse: true,
            unique: true,
            index: true,
        },
        agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        ownerAgent: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        productKey: { type: String, default: "trevio", index: true },
        visibility: { type: String, enum: ["public", "agency", "private"], default: "public" },
        archivedAt: { type: Date, default: null },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true, lowercase: true, index: true },
        tag: { type: String, trim: true, default: "Curated trip" },
        location: { type: String, required: true, trim: true },
        country: { type: String, trim: true, default: "India" },
        duration: { type: String, trim: true, default: "" },
        startDate: { type: Date, default: null, index: true },
        endDate: { type: Date, default: null, index: true },
        dates: [{ type: String, trim: true }],
        image: { type: String, trim: true, default: "" },
        photos: [{ type: String, trim: true }],
        description: { type: String, trim: true, default: "" },
        chips: [{ type: String, trim: true }],
        tags: [{ type: String, trim: true, lowercase: true, index: true }],
        rating: { type: Number, min: 0, max: 5, default: 0 },
        price: { type: priceSchema, required: true },
        availability: { type: availabilitySchema, default: () => ({}) },
        preferences: { type: preferencesSchema, default: () => ({}) },
        itinerary: [itineraryItemSchema],
        inclusions: [{ type: String, trim: true }],
        exclusions: [{ type: String, trim: true }],
        includedStays: [includedStaySchema],
        hotelOptions: [hotelOptionSchema],
        cancellation: { type: cancellationSchema, default: () => ({}) },
        extras: [extraSchema],
        featured: { type: Boolean, default: false, index: true },
        isListed: { type: Boolean, default: true, index: true },
        cancellationPolicy: {
            type: String,
            trim: true,
            default:
                "Full refund up to 7 days before departure; 50% refund within 7 days; no refund within 48 hours.",
        },
        reviews: [reviewSchema],
        status: {
            type: String,
            enum: TRIP_STATUS_LIST,
            default: TRIP_STATUS.LISTED,
            index: true,
        },
        tremVerified: { type: Boolean, default: false, index: true },
        tremVerifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        tremVerifiedAt: { type: Date, default: null },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true },
);

tripSchema.index({ status: 1, isListed: 1, featured: -1, sortOrder: 1 });
tripSchema.index({ category: 1, status: 1, isListed: 1 });
tripSchema.index({ agencyId: 1, ownerAgent: 1, status: 1 });

// Keep the persisted model name for existing MongoDB collection compatibility.
const Trip = mongoose.models?.TrevioTrip || mongoose.model("TrevioTrip", tripSchema);

export default Trip;
