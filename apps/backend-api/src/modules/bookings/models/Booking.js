import mongoose from "mongoose";
import { nanoid } from "nanoid";
import {
    BOOKING_STATUS,
    BOOKING_STATUS_LIST,
    PAYMENT_STATUS,
    PAYMENT_STATUS_LIST,
} from "../../../constants/enums.js";

const { Schema } = mongoose;

const bookingSchema = new Schema(
    {
        bookingRef: {
            type: String,
            default: () => `BKG-${nanoid(8).toUpperCase()}`,
            unique: true,
            index: true,
        },
        sourceEnquiryId: {
            type: Schema.Types.ObjectId,
            ref: "ContactLead",
            required: true,
            unique: true,
            index: true,
        },
        acceptedQuoteId: {
            type: Schema.Types.ObjectId,
            ref: "BookingQuote",
            required: true,
            unique: true,
            index: true,
        },
        userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "AgencyCustomer",
            default: null,
            index: true,
        },
        ownerAgent: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        agencyId: {
            type: Schema.Types.ObjectId,
            ref: "PartnerAgency",
            default: null,
            index: true,
        },
        product: { type: String, enum: ["trevista", "trevio"], required: true, index: true },
        journeyType: { type: String, enum: ["tour", "trip"], required: true, index: true },
        tourId: { type: String, default: null },
        tourTitle: { type: String, default: "" },
        status: {
            type: String,
            enum: BOOKING_STATUS_LIST,
            default: BOOKING_STATUS.CUSTOMER_ACCEPTED,
            index: true,
        },
        paymentStatus: {
            type: String,
            enum: PAYMENT_STATUS_LIST,
            default: PAYMENT_STATUS.TOKEN_PENDING,
            index: true,
        },
        enquirySnapshot: { type: Schema.Types.Mixed, required: true, immutable: true },
        selectionSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
        customizationSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
        pricingSnapshot: { type: Schema.Types.Mixed, required: true, immutable: true },
        financialSnapshot: { type: Schema.Types.Mixed, default: null, immutable: true },
        travellerDetails: { type: Schema.Types.Mixed, default: null },
        convertedAt: { type: Date, default: Date.now, immutable: true },
    },
    { timestamps: true },
);

bookingSchema.virtual("id").get(function id() {
    return this._id.toHexString();
});

bookingSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        delete ret._id;
    },
});

const Booking = mongoose.models?.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
