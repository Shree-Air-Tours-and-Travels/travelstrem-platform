import mongoose from "mongoose";
import { SUPPORT_SENDER_TYPE_LIST } from "@packages/trem-support-contracts";

const { Schema } = mongoose;

const attachmentSchema = new Schema({
  fileName: { type: String, trim: true, required: true },
  url: { type: String, trim: true, required: true },
  mimeType: { type: String, trim: true, default: "" },
  size: { type: Number, min: 0, default: 0 },
}, { _id: true });

const supportTicketMessageSchema = new Schema({
  ticket: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
  senderType: { type: String, enum: SUPPORT_SENDER_TYPE_LIST, required: true },
  senderName: { type: String, trim: true, default: "" },
  content: { type: String, trim: true, required: true, maxlength: 5000 },
  attachments: { type: [attachmentSchema], default: [] },
  readAt: { type: Date, default: null },
}, { timestamps: true });

supportTicketMessageSchema.index({ ticket: 1, createdAt: 1 });
supportTicketMessageSchema.set("toJSON", { virtuals: true, versionKey: false, transform: (_, ret) => { delete ret._id; } });

export default mongoose.models?.SupportTicketMessage || mongoose.model("SupportTicketMessage", supportTicketMessageSchema);
