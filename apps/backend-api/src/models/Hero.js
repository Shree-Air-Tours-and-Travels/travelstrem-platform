import mongoose from "mongoose";

const heroSchema = new mongoose.Schema({
  title: { type: String, required: true },
  highlight: { type: String, required: true },
  description: { type: String, required: true },
  eyebrow: { type: String, default: "Premium Travel Experiences" },
  buttonText: { type: String, default: "Explore Now" },
  secondaryButtonText: { type: String, default: "Watch story" },
  featuredDestination: {
    label: { type: String, default: "Top Destination" },
    title: { type: String, default: "Bali, Indonesia" },
  },
  stats: [
    {
      value: { type: String, required: true },
      label: { type: String, required: true },
    },
  ],
  visual: {
    headline: { type: String, default: "Live route studio" },
    subline: { type: String, default: "Flights, stays, weather, and local moments balanced in one plan." },
    orbitItems: [
      {
        label: { type: String, required: true },
        icon: { type: String, default: "plane" },
      },
    ],
    gallery: [
      {
        label: { type: String, required: true },
        value: { type: String, default: "" },
        icon: { type: String, default: "map" },
      },
    ],
  },
  images: {
    main: { type: String },
    gallery: [{ type: String }],
    video: { type: String }
  }
}, { timestamps: true });

const Hero = mongoose.model("Hero", heroSchema);
export default Hero;
