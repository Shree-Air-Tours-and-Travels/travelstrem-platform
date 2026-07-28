import mongoose from "mongoose";

const { Schema } = mongoose;

const productBrandingSchema = new Schema({
  logoSrc: { type: String, default: "" },
  name: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  initial: { type: String, default: "" },
}, { _id: false });

const clientSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  contactEmail: { type: String, default: "" },
  contactPhone: { type: String, default: "" },
  website: { type: String, default: "" },

  branding: {
    type: Map,
    of: productBrandingSchema,
    default: new Map([
      ["trevio", { logoSrc: "", name: "Trevio", subtitle: "by TravelsTrem", initial: "T" }],
      ["trevista", { logoSrc: "", name: "Trevista", subtitle: "by TravelsTrem", initial: "Tv" }],
      ["dashboard", { logoSrc: "", name: "TravelsTrem", subtitle: "Dashboard", initial: "T" }],
      ["admin", { logoSrc: "", name: "TravelsTREM", subtitle: "Admin", initial: "T" }],
      ["booking", { logoSrc: "", name: "TravelsTrem", subtitle: "Booking", initial: "T" }],
      ["agent", { logoSrc: "", name: "TravelsTrem", subtitle: "Partner Portal", initial: "T" }],
    ]),
  },

  globalBrand: {
    logoSrc: { type: String, default: "" },
    label: { type: String, default: "TravelsTrem" },
  },
}, { timestamps: true });

clientSchema.index({ slug: 1 }, { unique: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;
