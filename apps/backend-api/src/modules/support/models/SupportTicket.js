import mongoose from "mongoose";
import {
  SUPPORT_CHANNEL,
  SUPPORT_CHANNEL_LIST,
  SUPPORT_TICKET_PRIORITY,
  SUPPORT_TICKET_PRIORITY_LIST,
  SUPPORT_TICKET_STATUS,
  SUPPORT_TICKET_STATUS_LIST,
} from "@packages/trem-support-contracts";

const { Schema } = mongoose;

const attachmentSchema = new Schema({
  fileName: { type: String, trim: true, required: true },
  url: { type: String, trim: true, required: true },
  mimeType: { type: String, trim: true, default: "" },
  size: { type: Number, min: 0, default: 0 },
}, { _id: true });

const supportTicketSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  serviceId: { type: String, trim: true, lowercase: true, default: "", index: true },
  categoryId: { type: String, trim: true, lowercase: true, required: true, index: true },
  subcategoryId: { type: String, trim: true, lowercase: true, default: "" },
  subject: { type: String, trim: true, required: true, maxlength: 180 },
  description: { type: String, trim: true, required: true, maxlength: 5000 },
  status: { type: String, enum: SUPPORT_TICKET_STATUS_LIST, default: SUPPORT_TICKET_STATUS.OPEN, index: true },
  priority: { type: String, enum: SUPPORT_TICKET_PRIORITY_LIST, default: SUPPORT_TICKET_PRIORITY.NORMAL, index: true },
  channel: { type: String, enum: SUPPORT_CHANNEL_LIST, default: SUPPORT_CHANNEL.WEB },
  assignedTeam: { type: String, trim: true, default: "" },
  attachments: { type: [attachmentSchema], default: [] },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  unreadByCustomer: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true });

supportTicketSchema.index({ user: 1, lastActivityAt: -1 });
supportTicketSchema.index({ user: 1, status: 1, lastActivityAt: -1 });

supportTicketSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

export default mongoose.models?.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
