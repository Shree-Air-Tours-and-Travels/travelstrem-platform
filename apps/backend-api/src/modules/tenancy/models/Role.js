import mongoose from "mongoose";
const schema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        permissions: [{ type: String }],
        system: { type: Boolean, default: true },
    },
    { timestamps: true },
);
export default mongoose.models.Role || mongoose.model("Role", schema);
