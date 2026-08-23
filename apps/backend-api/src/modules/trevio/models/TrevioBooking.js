import mongoose from "mongoose";

const { Schema } = mongoose;
const trevioBookingSchema = new Schema({
  bookingRef: { type: String, required: true, unique: true },
  quoteId: { type: String, required: true, unique: true },
  product: { type: String, default: "trevio" },
  tripRef: { type: String, required: true, index: true },
  trip: { type: Schema.Types.Mixed, default: {} },
  travelWindow: { type: Schema.Types.Mixed, default: {} },
  travellers: { type: [Schema.Types.Mixed], default: [] },
  addons: { type: [Schema.Types.Mixed], default: [] },
  pricing: { type: Schema.Types.Mixed, default: {} },
  contact: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, default: "QUOTE_REQUESTED", index: true },
  agentRef: { type: String, default: "" },
  assignedAgentRef: { type: String, default: "" },
  assignedAgencyRef: { type: String, default: "" },
  paymentSummary: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, toJSON: { virtuals: true } });

trevioBookingSchema.virtual("id").get(function getId() { return String(this._id); });
export default mongoose.models?.TrevioBooking || mongoose.model("TrevioBooking", trevioBookingSchema);
