import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // store image path or URL
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
