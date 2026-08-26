import mongoose from "mongoose";

const ContactLeadSchema = new mongoose.Schema(
    {
        form: { type: String, default: "contact-agent" },
        enquiryRef: { type: String, unique: true, sparse: true, index: true },
        fields: { type: Object, required: true }, // { name, email, phone, ... }
        tourId: { type: String, default: null },
        tourTitle: { type: String, default: null },
        product: { type: String, enum: ["trevista", "trevio"], default: "trevista", index: true },
        ownerAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PartnerAgency",
            default: null,
            index: true,
        },
        assignmentRule: {
            type: String,
            enum: ["source_tour_owner", "custom_tour_partner", "master_admin_fallback", ""],
            default: "",
            index: true,
        },
        agentSnapshot: {
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            phone: { type: String, default: "" },
        },
        selection: {
            packageKey: { type: String, default: "" },
            packageName: { type: String, default: "" },
            hotelRoomKey: { type: String, default: "" },
            hotelRoomName: { type: String, default: "" },
            hotelSelections: { type: [mongoose.Schema.Types.Mixed], default: [] },
            hotelRequests: { type: [mongoose.Schema.Types.Mixed], default: [] },
            customizationPreference: {
                type: String,
                enum: ["package", "customize"],
                default: "package",
            },
        },
        customizationSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
        customizationAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
        claimedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
            index: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AgencyCustomer",
            default: null,
            index: true,
        },
        status: {
            type: String,
            enum: ["new", "in_review", "responded", "closed"],
            default: "new",
            index: true,
        },
        url: { type: String, default: null },
        notified: { type: Boolean, default: false },
    },
    { timestamps: true },
);

const ContactLead = mongoose.model("ContactLead", ContactLeadSchema);
export default ContactLead;
