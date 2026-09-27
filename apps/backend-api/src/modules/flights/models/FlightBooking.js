import crypto from "crypto";
import mongoose from "mongoose";
import { encryptedStringField } from "../../../core/auth/secureFields.js";
import { BOOKING_STATUSES, FLIGHT_BOOKING_STATUS } from "../types/flight.types.js";

const { Schema } = mongoose;
const bookingReference = () => `TRM-FLT-${String(new Date().getUTCFullYear()).slice(-2)}${crypto.randomInt(0, 10000).toString().padStart(4, "0")}`;

const passportSchema = new Schema({
    number: { ...encryptedStringField(), select: false },
    expiryDate: String,
    issuingCountry: String,
    nationality: String,
}, { _id: false });

const passengerSchema = new Schema({
    type: { type: String, enum: ["ADULT", "CHILD", "INFANT"], required: true },
    title: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: String,
    dateOfBirth: String,
    nationality: String,
    passport: passportSchema,
}, { _id: false });

const flightBookingSchema = new Schema({
    bookingRef: { type: String, unique: true, index: true, default: bookingReference },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
    ownerAgent: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: { type: String, enum: BOOKING_STATUSES, default: FLIGHT_BOOKING_STATUS.PENDING, index: true },
    paymentStatus: { type: String, enum: ["PENDING", "PAID", "FAILED", "REFUND_PENDING", "REFUNDED"], default: "PENDING" },
    ticketingStatus: { type: String, enum: ["PENDING", "CONFIRMED", "TICKETED", "FAILED"], default: "PENDING" },
    searchId: { type: String, required: true },
    offerId: { type: String, required: true },
    provider: { type: String, required: true },
    providerReference: { type: String, required: true, index: true },
    pnr: { type: String, required: true, unique: true, index: true },
    passengers: { type: [passengerSchema], required: true },
    segmentSnapshot: { type: [Schema.Types.Mixed], required: true, immutable: true },
    fareSnapshot: { type: Schema.Types.Mixed, required: true, immutable: true },
    priceSnapshot: { type: Schema.Types.Mixed, required: true, immutable: true },
    baggageSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
    seatSnapshot: { type: [Schema.Types.Mixed], default: [], immutable: true },
    extrasSnapshot: { type: [Schema.Types.Mixed], default: [], immutable: true },
    tickets: { type: [Schema.Types.Mixed], default: [] },
    cancellation: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

flightBookingSchema.set("toJSON", { virtuals: true, versionKey: false, transform: (_, value) => { delete value._id; return value; } });

export default mongoose.models?.FlightBooking || mongoose.model("FlightBooking", flightBookingSchema);
