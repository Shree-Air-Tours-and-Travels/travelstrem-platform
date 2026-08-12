import mongoose from "mongoose";

const { Schema } = mongoose;

const discoveryChipSchema = new Schema({
    label: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    chipType: {
        type: String,
        enum: ["ALL", "TAG", "FEATURED", "DESTINATION", "ORIGIN", "COUNTRY"],
        required: true,
    },
    referenceId: { type: String, trim: true, lowercase: true, default: "" },
    icon: { type: String, trim: true, default: "" },
    priority: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
}, { timestamps: true });

discoveryChipSchema.index({ active: 1, priority: -1, label: 1 });

const TourDiscoveryChip = mongoose.models?.TourDiscoveryChip || mongoose.model("TourDiscoveryChip", discoveryChipSchema);
export default TourDiscoveryChip;
