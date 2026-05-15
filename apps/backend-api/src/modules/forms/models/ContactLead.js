import mongoose from "mongoose";

const ContactLeadSchema = new mongoose.Schema({
  form: { type: String, default: "contact-agent" },
  fields: { type: Object, required: true }, // { name, email, phone, ... }
  tourId: { type: String, default: null },
  tourTitle: { type: String, default: null },
  url: { type: String, default: null },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ContactLead = mongoose.model("ContactLead", ContactLeadSchema);
export default ContactLead;
