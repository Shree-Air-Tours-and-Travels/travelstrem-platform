import { PlatformBrand } from "./service.js";
import config from "../../config/env.js";
import appHeader from "../../config/appHeader.js";

// Bootstrap values are used only for the first insert. Runtime identity comes from the database.
export async function seedPlatformBrand() {
    if (process.env.TENANT_CLIENT_ID) return;
    const logoSrc =
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1791109947/ae275b55-9a5c-4f50-b3ad-2f2984404097.png";
    const logoDarkSrc =
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1791110002/ad999807-fc7d-4448-91e7-78b93f98cce5.png";
    await PlatformBrand.updateOne(
        { _id: "platform" },
        {
            $set: {
                faviconSrc:
                    "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519386/travelstrem/site-assets/e38709b8a4ada750aed0f6df.png",
            },
            $setOnInsert: {
                name: config.COMPANY_NAME || "TravelsTREM",
                logoSrc,
                logoDarkSrc,
                windowTitle: config.COMPANY_NAME || "TravelsTREM",
                tagline:
                    config.COMPANY_TAGLINE || "Tours · Reservations · Experiences · Management",
                website: "https://travelstrem.com",
                footer: appHeader.componentData.footer,
            },
        },
        { upsert: true, runValidators: true },
    );
}
