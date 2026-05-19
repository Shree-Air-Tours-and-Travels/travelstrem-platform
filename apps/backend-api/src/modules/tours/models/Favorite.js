import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
  userId: { type: String, default: "anonymous" },
  createdAt: { type: Date, default: Date.now },
});

favoriteSchema.index({ tourId: 1, userId: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
