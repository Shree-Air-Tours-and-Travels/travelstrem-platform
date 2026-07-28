import mongoose from "mongoose";

const { Schema } = mongoose;

const productBrandingSchema = new Schema({
  logoSrc: { type: String, default: "/favicon.png" },
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
      ["trevio", { logoSrc: "/favicon.png", name: "Trevio", subtitle: "by TravelsTrem", initial: "" }],
      ["trevista", { logoSrc: "/favicon.png", name: "Trevista", subtitle: "by TravelsTrem", initial: "" }],
      ["dashboard", { logoSrc: "/favicon.png", name: "TravelsTrem", subtitle: "Dashboard", initial: "" }],
      ["admin", { logoSrc: "/favicon.png", name: "TravelsTREM", subtitle: "Admin", initial: "" }],
      ["booking", { logoSrc: "/favicon.png", name: "TravelsTrem", subtitle: "Booking", initial: "" }],
      ["agent", { logoSrc: "/favicon.png", name: "TravelsTrem", subtitle: "Partner Portal", initial: "" }],
    ]),
  },

  globalBrand: {
    logoSrc: { type: String, default: "/favicon.png" },
    label: { type: String, default: "TravelsTrem" },
  },
}, { timestamps: true });

clientSchema.index({ slug: 1 }, { unique: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;
