import mongoose from "mongoose";

const { Schema } = mongoose;

const productBrandingSchema = new Schema(
    {
        logoSrc: { type: String, default: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png" },
        name: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        initial: { type: String, default: "" },
    },
    { _id: false },
);

const clientSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        contactEmail: { type: String, default: "" },
        contactPhone: { type: String, default: "" },
        website: { type: String, default: "" },

        branding: {
            type: Map,
            of: productBrandingSchema,
            default: new Map([
                [
                    "trevio",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "Trevio",
                        subtitle: "by TravelsTrem",
                        initial: "",
                    },
                ],
                [
                    "trevista",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "Trevista",
                        subtitle: "by TravelsTrem",
                        initial: "",
                    },
                ],
                [
                    "trehub",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "Trehub",
                        subtitle: "Flights & Hotels by TravelsTrem",
                        initial: "",
                    },
                ],
                [
                    "app-shell",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "TravelsTrem",
                        subtitle: "Dashboard",
                        initial: "",
                    },
                ],
                [
                    "admin",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "TravelsTREM",
                        subtitle: "Admin",
                        initial: "",
                    },
                ],
                [
                    "booking",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "TravelsTrem",
                        subtitle: "Booking",
                        initial: "",
                    },
                ],
                [
                    "agent",
                    {
                        logoSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png",
                        name: "TravelsTrem",
                        subtitle: "Partner Portal",
                        initial: "",
                    },
                ],
            ]),
        },

        globalBrand: {
            logoSrc: { type: String, default: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519387/travelstrem/site-assets/270b607401bdfbd2ec822ea0.png" },
            label: { type: String, default: "TravelsTrem" },
        },
    },
    { timestamps: true },
);

clientSchema.index({ slug: 1 }, { unique: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;
