import mongoose from "mongoose";
const schema = new mongoose.Schema(
    {
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },
        isUpdate: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["draft", "provisioning", "completed", "failed"],
            default: "draft",
        },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        process: { type: mongoose.Schema.Types.Mixed, default: {} },
        provisioningStartedAt: Date,
        emailSent: { type: Boolean, default: false },
    },
    { timestamps: true, optimisticConcurrency: true },
);
export default mongoose.models.ClientRegistration || mongoose.model("ClientRegistration", schema);
