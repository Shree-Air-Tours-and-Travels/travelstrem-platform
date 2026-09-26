import mongoose from "mongoose";

const tourInteractionSchema = new mongoose.Schema(
    {
        tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true, index: true },
        type: { type: String, enum: ["view"], required: true },
        dedupeKey: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
);

tourInteractionSchema.index({ tourId: 1, type: 1, dedupeKey: 1 }, { unique: true });
tourInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default
    mongoose.models?.TourInteraction || mongoose.model("TourInteraction", tourInteractionSchema);

