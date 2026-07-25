import Service from "../models/Service.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";
import config from "../../../config/env.js";

const stripRemoteEntry = (value = "") => String(value || "").replace(/\/remoteEntry\.js$/, "").replace(/\/$/, "");
const productUrl = (key, fallback) => stripRemoteEntry(
    config.PORTAL_CONFIG?.frontends?.[key]?.appUrl ||
    config.PORTAL_CONFIG?.frontends?.[key]?.baseUrl ||
    config.PORTAL_CONFIG?.frontends?.[key]?.remoteEntry ||
    fallback
);

const PRODUCT_URLS = {
    trevio: productUrl("trevio", "http://localhost:3005"),
    trevista: productUrl("trevista", "http://localhost:3001"),
};

const productServices = [
    {
        id: "trevio",
        label: "Trevio",
        shortDescription: "Community-based travel experiences.",
        description: "Group trips, weekend adventures, treks, expeditions, events, and travel communities under Trevio by TravelsTrem.",
        fullDescription: "Trevio owns the community travel layer of the TravelsTrem ecosystem: group trips, weekend trips, adventures, treks, expeditions, international group tours, events, and travel communities.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
        coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
        features: ["Group Trips", "Weekend Trips", "Adventures", "Treks", "Expeditions", "Travel Communities"],
        highlights: ["Group trips", "Adventures", "Trip captains", "Communities"],
        cta: { label: "Open Trevio", href: PRODUCT_URLS.trevio },
        disabled: false,
    },
    {
        id: "trevista",
        label: "Trevista",
        shortDescription: "Holiday packages and customized travel planning.",
        description: "Domestic packages, international packages, honeymoon packages, family tours, corporate tours, luxury holidays, and customized packages.",
        fullDescription: "Trevista owns the holiday planning layer of the TravelsTrem ecosystem: packages, itineraries, holiday planning, and package booking for domestic and international travel.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
        coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
        features: ["Domestic Packages", "International Packages", "Honeymoon Packages", "Family Tours", "Corporate Tours", "Customized Packages"],
        highlights: ["Holiday packages", "Itineraries", "Custom planning", "Luxury holidays"],
        cta: { label: "Open Trevista", href: PRODUCT_URLS.trevista },
        disabled: false,
    },
];

export const getServices = async (req, res) => {
    try {
        res.status(200).json({
            ...pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/services.json", {
                injectData: { services: productServices },
            }),
            message: "Services fetched successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch services",
            error: err.message,
        });
    }
};

export const createService = async (req, res) => {
    try {
        const allowed = ["id", "label", "shortDescription", "description", "fullDescription", "image", "coverImage", "features", "highlights", "cta", "disabled"];
        const body = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) body[key] = req.body[key];
        }
        const newService = new Service(body);

        const savedService = await newService.save();

        res.status(201).json({
            ...pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/services.json", {
                injectData: { services: [savedService] },
            }),
            message: "Service created successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: "Failed to create service",
            error: err.message,
        });
    }
};
