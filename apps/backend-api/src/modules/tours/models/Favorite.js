import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: String, default: "anonymous" },
  product: { type: String, enum: ["trevio", "trevista"], default: "trevista" },
  createdAt: { type: Date, default: Date.now },
});

favoriteSchema.index({ tourId: 1, userId: 1, product: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
