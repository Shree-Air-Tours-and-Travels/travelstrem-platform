import mongoose from "mongoose";
import {
  SUPPORT_REQUEST_STATUS,
  SUPPORT_REQUEST_STATUS_LIST,
  SUPPORT_REQUEST_TYPE_LIST,
} from "@packages/trem-support-contracts";

const { Schema } = mongoose;

const supportBookingRequestSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  type: { type: String, enum: SUPPORT_REQUEST_TYPE_LIST, required: true, index: true },
  status: { type: String, enum: SUPPORT_REQUEST_STATUS_LIST, default: SUPPORT_REQUEST_STATUS.SUBMITTED, index: true },
  reasonId: { type: String, trim: true, default: "" },
  note: { type: String, trim: true, default: "", maxlength: 3000 },
  selection: { type: Schema.Types.Mixed, default: null },
  eligibilitySnapshot: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

supportBookingRequestSchema.index({ user: 1, booking: 1, type: 1, createdAt: -1 });
supportBookingRequestSchema.set("toJSON", { virtuals: true, versionKey: false, transform: (_, ret) => { delete ret._id; } });

export default mongoose.models?.SupportBookingRequest || mongoose.model("SupportBookingRequest", supportBookingRequestSchema);
