import Favorite from "../models/Favorite.js";
import Tour from "../models/Tour.js";
import mongoose from "mongoose";

const getTrevioTripModel = () => mongoose.models?.TrevioTrip || null;

const normalizeTripForFavorites = (doc) => {
    const trip = doc?.toObject ? doc.toObject({ virtuals: true }) : doc || {};
    const p = trip.price || {};
    const price = typeof p === "number" ? p : p.amount || 0;
    const currency = typeof p === "object" ? p.currency || "INR" : "INR";
    return {
        ...trip,
        price,
        priceInfo: {
            min: price,
            max: price,
            currency,
            isFinal: typeof p === "object" ? p.isFinal !== false : true,
            source: "trevio",
        },
    };
};

const normalizeTourForFavorites = (doc) => {
    const tour = doc?.toObject ? doc.toObject({ virtuals: true }) : doc || {};
    const p = tour.price || {};
    const min = Number(p.min ?? tour.priceInfo?.min ?? 0);
    const max = Number(p.max ?? min);
    return {
        ...tour,
        price: min,
        priceInfo: {
            min,
            max,
            currency: p.currency || "INR",
            isFinal: !!p.isFinal,
            source: p.source || "manual",
        },
    };
};

export const toggleFavorite = async (req, res) => {
    try {
        const { tourId, product = "trevista" } = req.body;
        const userId = req.user?.sub || req.user?.id || req.user?._id || req.user?.userId;

        if (!tourId) {
            return res.status(400).json({ status: "error", message: "tourId is required" });
        }

        const existing = await Favorite.findOne({ tourId, userId, product });

        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
            return res
                .status(200)
                .json({ status: "success", componentData: { data: { favorited: false } } });
        }

        await Favorite.create({ tourId, userId, product });
        return res
            .status(200)
            .json({ status: "success", componentData: { data: { favorited: true } } });
    } catch (error) {
        console.error("toggleFavorite error:", error);
        return res.status(500).json({ status: "error", message: "Failed to toggle favorite" });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const userId = req.user?.sub || req.user?.id || req.user?._id || req.user?.userId;
        const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 }).lean();

        const trevistaIds = favorites.filter((f) => f.product === "trevista").map((f) => f.tourId);
        const trevioIds = favorites.filter((f) => f.product === "trevio").map((f) => f.tourId);

        const TrevioTrip = getTrevioTripModel();

        const [trevistaTours, trevioTrips] = await Promise.all([
            trevistaIds.length ? Tour.find({ _id: { $in: trevistaIds } }) : [],
            trevioIds.length && TrevioTrip ? TrevioTrip.find({ _id: { $in: trevioIds } }) : [],
        ]);

        const tourMap = new Map(
            trevistaTours.map((t) => [String(t._id), normalizeTourForFavorites(t)]),
        );
        const tripMap = new Map(
            (trevioTrips || []).map((t) => [String(t._id), normalizeTripForFavorites(t)]),
        );

        const ordered = favorites
            .map((fav) => {
                const id = String(fav.tourId);
                if (fav.product === "trevio") {
                    const trip = tripMap.get(id);
                    return trip ? { ...trip, product: "trevio" } : null;
                }
                const tour = tourMap.get(id);
                return tour ? { ...tour, product: "trevista" } : null;
            })
            .filter(Boolean);

        return res.status(200).json({
            status: "success",
            componentData: {
                data: ordered,
                structure: {
                    widgets: [
                        {
                            type: "favorites",
                            props: {
                                chips: [
                                    { id: "all", label: "All Products", active: true },
                                    { id: "trevista", label: "Packages" },
                                    { id: "trevio", label: "Trips" },
                                ],
                            },
                        },
                    ],
                },
                config: {},
            },
            message: "Favorites fetched successfully",
        });
    } catch (error) {
        console.error("getFavorites error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to get favorites",
            componentData: { data: [], structure: { widgets: [] }, config: {} },
        });
    }
};
