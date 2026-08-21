import mongoose from "mongoose";

const ContactLeadSchema = new mongoose.Schema({
  form: { type: String, default: "contact-agent" },
  enquiryRef: { type: String, unique: true, sparse: true, index: true },
  fields: { type: Object, required: true }, // { name, email, phone, ... }
  tourId: { type: String, default: null },
  tourTitle: { type: String, default: null },
  product: { type: String, enum: ["trevista", "trevio"], default: "trevista", index: true },
  ownerAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerAgency", default: null, index: true },
  agentSnapshot: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null, index: true },
  url: { type: String, default: null },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ContactLead = mongoose.model("ContactLead", ContactLeadSchema);
export default ContactLead;
