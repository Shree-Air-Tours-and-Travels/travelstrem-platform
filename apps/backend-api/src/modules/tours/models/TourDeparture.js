import mongoose from "mongoose";
import { PRICE_SOURCE, PRICE_SOURCE_LIST } from "../../../constants/enums.js";

const { Schema } = mongoose;

const locationSchema = new Schema(
    {
        cityId: { type: String, trim: true, lowercase: true, default: "" },
        cityName: { type: String, trim: true, default: "" },
        countryId: { type: String, trim: true, lowercase: true, default: "" },
        countryName: { type: String, trim: true, default: "" },
    },
    { _id: false },
);

const departureSchema = new Schema(
    {
        tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true, index: true },
        origin: { type: locationSchema, default: () => ({}) },
        departureDate: { type: Date, required: true },
        returnDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ["scheduled", "active", "sold_out", "cancelled", "completed"],
            default: "active",
            index: true,
        },
        capacity: { type: Number, min: 0, default: null },
        availableSeats: { type: Number, min: 0, default: null },
        pricing: {
            currency: { type: String, default: "INR" },
            min: { type: Number, required: true, min: 0 },
            max: { type: Number, required: true, min: 0 },
            isFinal: { type: Boolean, default: false },
            source: { type: String, enum: PRICE_SOURCE_LIST, default: PRICE_SOURCE.MANUAL },
        },
        bookingOpensAt: { type: Date, default: null },
        bookingClosesAt: { type: Date, default: null },
        legacyDerived: { type: Boolean, default: false },
    },
    { timestamps: true },
);

departureSchema.index({ tourId: 1, status: 1, departureDate: 1, returnDate: 1 });
departureSchema.index({ "origin.cityId": 1, departureDate: 1, status: 1, availableSeats: 1 });
departureSchema.index({ departureDate: 1, returnDate: 1, "pricing.min": 1, "pricing.max": 1 });

const TourDeparture =
    mongoose.models?.TourDeparture || mongoose.model("TourDeparture", departureSchema);
export default TourDeparture;
