import mongoose from "mongoose";
import ApiError from "../../shared/errors/ApiError.js";

const schema = new mongoose.Schema(
    {
        _id: { type: String, default: "platform" },
        name: { type: String, required: true },
        logoSrc: { type: String, required: true },
        logoDarkSrc: { type: String, default: "" },
        faviconSrc: { type: String, default: "" },
        windowTitle: { type: String, default: "" },
        tagline: { type: String, default: "" },
        contactEmail: { type: String, default: "" },
        contactPhone: { type: String, default: "" },
        website: { type: String, default: "" },
        footer: { type: mongoose.Schema.Types.Mixed, default: {} },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true, autoCreate: false, autoIndex: false },
);
export const PlatformBrand =
    mongoose.models.PlatformBrand || mongoose.model("PlatformBrand", schema);

export async function resolveBrand(client = null) {
    if (client)
        return {
            ...client.globalBrand,
            name: client.globalBrand?.label || client.name,
            label: client.globalBrand?.label || client.name,
            logoSrc: client.globalBrand?.logoSrc || "",
            logoDarkSrc: client.globalBrand?.logoDarkSrc || "",
            faviconSrc: client.globalBrand?.faviconSrc || "",
            windowTitle:
                client.globalBrand?.windowTitle || client.globalBrand?.label || client.name,
            contactEmail: client.contactEmail || "",
            contactPhone: client.contactPhone || "",
            website: client.domains?.website || client.website || "",
        };
    if (process.env.TENANT_CLIENT_ID) throw new ApiError(503, "Tenant branding is unavailable.");
    const record = await PlatformBrand.findById("platform").lean();
    if (!record) throw new ApiError(503, "Platform branding has not been initialized.");
    const { _id, updatedBy, __v, createdAt, updatedAt, ...brand } = record;
    return { ...brand, faviconSrc: "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519386/travelstrem/site-assets/e38709b8a4ada750aed0f6df.png", label: brand.name, windowTitle: brand.windowTitle || brand.name };
}

export function validateBrand(input) {
    const result = {};
    const fail = (field, message) => {
        throw new ApiError(422, message, { [field]: message });
    };
    for (const key of [
        "name",
        "logoSrc",
        "logoDarkSrc",
        "faviconSrc",
        "windowTitle",
        "tagline",
        "contactEmail",
        "contactPhone",
        "website",
    ]) {
        if (input[key] === undefined) continue;
        if (
            typeof input[key] !== "string" ||
            input[key].length > (key.includes("Src") ? 2000 : 200)
        )
            fail(key, "Enter a valid branding value.");
        result[key] = input[key].trim();
        if (["name", "logoSrc"].includes(key) && !result[key]) fail(key, "This field is required.");
        if (["logoSrc", "logoDarkSrc", "faviconSrc", "website"].includes(key) && result[key]) {
            let url;
            try {
                url = new URL(result[key]);
            } catch {
                fail(key, "Enter a valid HTTPS URL.");
            }
            if (url.protocol !== "https:" || url.username || url.password)
                fail(key, "Enter a valid HTTPS URL.");
        }
        if (
            key === "contactEmail" &&
            result[key] &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result[key])
        )
            fail(key, "Enter a valid email address.");
    }
    if (!Object.keys(result).length) fail("name", "Provide branding fields to update.");
    return result;
}
