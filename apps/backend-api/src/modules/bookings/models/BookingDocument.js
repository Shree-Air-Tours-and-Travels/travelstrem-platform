import mongoose from "mongoose";
import {
    DOCUMENT_STATUS,
    DOCUMENT_STATUS_LIST,
    DOCUMENT_TYPE,
    DOCUMENT_TYPE_LIST,
} from "../../../constants/enums.js";

const { Schema } = mongoose;

export const DOCUMENT_TYPES = DOCUMENT_TYPE_LIST;

const bookingDocumentSchema = new Schema(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
        travellerId: {
            type: Schema.Types.ObjectId,
            ref: "BookingTraveller",
            default: null,
            index: true,
        },
        type: { type: String, enum: DOCUMENT_TYPES, default: DOCUMENT_TYPE.OTHER, index: true },
        fileName: { type: String, trim: true, default: "" },
        url: { type: String, trim: true, default: "" },
        mimeType: { type: String, trim: true, default: "" },
        size: { type: Number, default: 0 },
        quoteAmount: { type: Number, default: null },
        quoteVersion: { type: Number, default: null, index: true },
        currency: { type: String, trim: true, uppercase: true, default: "" },
        status: {
            type: String,
            enum: DOCUMENT_STATUS_LIST,
            default: DOCUMENT_STATUS.UPLOADED,
            index: true,
        },
        storageProvider: { type: String, enum: ["LOCAL", "R2", "CLOUDINARY"], default: "LOCAL" },
        storageKey: { type: String, trim: true, default: "" },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

bookingDocumentSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

bookingDocumentSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        delete ret._id;
    },
});

bookingDocumentSchema.index({ bookingId: 1, type: 1 });
bookingDocumentSchema.index({ travellerId: 1, type: 1 });

const BookingDocument =
    mongoose.models?.BookingDocument || mongoose.model("BookingDocument", bookingDocumentSchema);
export default BookingDocument;
