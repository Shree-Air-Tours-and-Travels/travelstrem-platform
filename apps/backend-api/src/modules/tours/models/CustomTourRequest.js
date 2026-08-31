import mongoose from "mongoose";
import {
    CUSTOM_TOUR_REQUEST_STATUS,
    CUSTOM_TOUR_REQUEST_STATUS_LIST,
} from "../../../constants/enums.js";

const { Schema } = mongoose;

const questionnaireResponseSchema = new Schema(
    {
        field: { type: String, required: true },
        value: { type: Schema.Types.Mixed, default: null },
    },
    { _id: false },
);

const customTourRequestSchema = new Schema(
    {
        tour: { type: Schema.Types.ObjectId, ref: "Tour", required: true, index: true },
        user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        contactLead: { type: Schema.Types.ObjectId, ref: "ContactLead", default: null },

        status: {
            type: String,
            enum: CUSTOM_TOUR_REQUEST_STATUS_LIST,
            default: CUSTOM_TOUR_REQUEST_STATUS.REQUESTED,
            index: true,
        },

        // Customer-submitted details
        preferredDates: {
            startDate: { type: Date, default: null },
            endDate: { type: Date, default: null },
            isFlexible: { type: Boolean, default: false },
        },
        groupSize: {
            adults: { type: Number, min: 1, default: 1 },
            children: { type: Number, min: 0, default: 0 },
            infants: { type: Number, min: 0, default: 0 },
        },
        questionnaireResponses: [questionnaireResponseSchema],
        specialRequests: { type: String, trim: true, default: "" },

        // Agent/admin review fields
        assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
        internalNotes: { type: String, trim: true, default: "" },

        // Quote reference when quoted
        quoteId: { type: Schema.Types.ObjectId, ref: "BookingQuote", default: null },

        // Converted booking reference
        bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },

        // Expiry
        expiresAt: { type: Date, default: null, index: true },

        // Audit
        agencyId: { type: Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        respondedAt: { type: Date, default: null },
        quotedAt: { type: Date, default: null },
        resolvedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

customTourRequestSchema.index({ status: 1, createdAt: -1 });
customTourRequestSchema.index({ tour: 1, status: 1 });

const CustomTourRequest =
    mongoose.models?.CustomTourRequest ||
    mongoose.model("CustomTourRequest", customTourRequestSchema);

export default CustomTourRequest;
