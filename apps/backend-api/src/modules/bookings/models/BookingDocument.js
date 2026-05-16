import mongoose from "mongoose";

const { Schema } = mongoose;

export const DOCUMENT_TYPES = ["passport", "visa", "government_id", "photo", "insurance", "vaccination", "ticket", "voucher", "invoice", "other"];

const bookingDocumentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  travellerId: { type: Schema.Types.ObjectId, ref: "BookingTraveller", default: null, index: true },
  type: { type: String, enum: DOCUMENT_TYPES, default: "other", index: true },
  fileName: { type: String, trim: true, default: "" },
  url: { type: String, trim: true, default: "" },
  mimeType: { type: String, trim: true, default: "" },
  size: { type: Number, default: 0 },
  status: { type: String, enum: ["PENDING", "UPLOADED", "APPROVED", "REJECTED"], default: "UPLOADED", index: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

bookingDocumentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingDocumentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingDocumentSchema.index({ bookingId: 1, type: 1 });
bookingDocumentSchema.index({ travellerId: 1, type: 1 });

const BookingDocument = mongoose.models?.BookingDocument || mongoose.model("BookingDocument", bookingDocumentSchema);
export default BookingDocument;
