import mongoose from "mongoose";

const schema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, enum: ["flight", "hotel", "trip", "tour"], required: true },
    title: { type: String, required: true, maxlength: 180 },
    path: { type: String, required: true },
    query: { type: String, required: true, maxlength: 4000 },
}, { timestamps: true });
schema.index({ userId: 1, mode: 1, query: 1 }, { unique: true });
export default mongoose.models.SavedSearch || mongoose.model("SavedSearch", schema);
