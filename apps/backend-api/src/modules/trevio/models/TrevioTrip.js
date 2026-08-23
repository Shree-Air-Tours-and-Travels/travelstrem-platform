import mongoose from "mongoose";

const { Schema } = mongoose;

export const TREVIO_TRIP_STATUS = Object.freeze({
  DRAFT: "draft",
  LISTED: "listed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

const TREVIO_TRIP_STATUS_LIST = Object.values(TREVIO_TRIP_STATUS);

const itineraryItemSchema = new Schema({
  day: { type: Number, required: true, min: 1 },
  title: { type: String, trim: true, default: "" },
  summary: { type: String, trim: true, default: "" },
  location: { type: String, trim: true, default: "" },
  activities: [{ type: String, trim: true }],
  meals: { type: String, trim: true, default: "" },
  accommodation: { type: String, trim: true, default: "" },
}, { _id: false });

const reviewSchema = new Schema({
  name: { type: String, trim: true, default: "Guest" },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  date: { type: String, trim: true, default: "" },
  comment: { type: String, trim: true, default: "" },
}, { _id: false });

const priceSchema = new Schema({
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, trim: true, default: "INR" },
  tokenAmount: { type: Number, min: 0, default: 1999 },
  isFinal: { type: Boolean, default: true },
}, { _id: false });

const availabilitySchema = new Schema({
  totalSeats: { type: Number, min: 0, default: null },
  seatsAvailable: { type: Number, min: 0, default: null },
}, { _id: false });

const preferenceOptionSchema = new Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true, lowercase: true },
  // Negative adjustments represent discounts (for example shared rooms).
  extraPrice: { type: Number, default: 0 },
}, { _id: false });

const preferencesSchema = new Schema({
  roomTypes: { type: [preferenceOptionSchema], default: () => [
    { label: "Single", value: "single", extraPrice: 0 },
    { label: "Double", value: "double", extraPrice: 0 },
    { label: "Triple", value: "triple", extraPrice: 0 },
    { label: "Shared", value: "shared", extraPrice: -500 },
  ]},
  mealPreferences: { type: [preferenceOptionSchema], default: () => [
    { label: "Vegetarian", value: "veg", extraPrice: 0 },
    { label: "Non-Vegetarian", value: "nonveg", extraPrice: 500 },
    { label: "Vegan", value: "vegan", extraPrice: 0 },
    { label: "Jain", value: "jain", extraPrice: 0 },
  ]},
  packageTypes: { type: [preferenceOptionSchema], default: () => [
    { label: "Standard", value: "standard", extraPrice: 0 },
    { label: "Premium", value: "premium", extraPrice: 5000 },
    { label: "Luxury", value: "luxury", extraPrice: 12000 },
  ]},
  drinkTypes: { type: [preferenceOptionSchema], default: () => [
    { label: "Non-Alcoholic", value: "non-alcoholic", extraPrice: 0 },
    { label: "Alcoholic", value: "alcoholic", extraPrice: 2000 },
  ]},
}, { _id: false });

const trevioTripSchema = new Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
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
  featured: { type: Boolean, default: false, index: true },
  isListed: { type: Boolean, default: true, index: true },
  cancellationPolicy: { type: String, trim: true, default: "Full refund up to 7 days before departure; 50% refund within 7 days; no refund within 48 hours." },
  reviews: [reviewSchema],
  status: { type: String, enum: TREVIO_TRIP_STATUS_LIST, default: TREVIO_TRIP_STATUS.LISTED, index: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

trevioTripSchema.index({ status: 1, isListed: 1, featured: -1, sortOrder: 1 });
trevioTripSchema.index({ category: 1, status: 1, isListed: 1 });

const TrevioTrip = mongoose.models?.TrevioTrip || mongoose.model("TrevioTrip", trevioTripSchema);

export default TrevioTrip;
