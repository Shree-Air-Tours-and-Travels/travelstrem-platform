import mongoose from "mongoose";

const heroSchema = new mongoose.Schema({
  title: { type: String, required: true },
  highlight: { type: String, required: true },
  description: { type: String, required: true },
  buttonText: { type: String, default: "Explore Now" },
  images: {
    main: { type: String, required: true },     // main hero image
    gallery: [{ type: String }],               // optional gallery images
    video: { type: String }                     // optional hero video
  }
}, { timestamps: true });

const Hero = mongoose.model("Hero", heroSchema);
export default Hero;
