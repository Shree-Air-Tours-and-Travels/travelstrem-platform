import Favorite from "../models/Favorite.js";
import Tour from "../models/Tour.js";
import mongoose from "mongoose";
import { recordTourSignal } from "../services/tourIntelligence.service.js";
import Product from "../../tenancy/models/Product.js";

const getTripModel = () => mongoose.models?.TrevioTrip || null;

const FAVORITES_COPY = Object.freeze({
    hero: {
        eyebrow: "Your travel shortlist",
        title: "Saved journeys",
        description:
            "Keep the journeys you love together, compare the essentials and return when you are ready to plan.",
    },
    controls: {
        searchPlaceholder: "Search saved tours and destinations",
        productLabel: "Product",
        sortLabel: "Sort saved journeys",
        sortOptions: [
            { value: "recent", label: "Recently saved" },
            { value: "oldest", label: "Oldest saved" },
            { value: "price-low", label: "Price: low to high" },
            { value: "price-high", label: "Price: high to low" },
            { value: "title", label: "Tour name" },
        ],
    },
    labels: {
        allProducts: "All saved journeys",
        saved: "Saved",
        products: "Available products",
        result: "saved journey",
        results: "saved journeys",
        perPerson: "Per person",
        savedOn: "Saved on",
        view: "Explore this tour",
        remove: "Remove from saved journeys",
        loading: "Loading saved journeys",
    },
    states: {
        emptyTitle: "Start building your travel shortlist",
        emptyDescription: "Explore available products and save the journeys you want to revisit.",
        filteredTitle: "No saved journeys match these filters",
        filteredDescription: "Try another search or clear your current filters.",
        errorTitle: "Your saved journeys could not be loaded",
        errorDescription: "Your saved items are safe. Please try loading them again.",
    },
    actions: { explore: "Explore tours", clear: "Clear filters", retry: "Try again" },
});

const getVisibleProducts = () =>
    Product.find({ status: "active", hidden: { $ne: true } })
        .select("key name description")
        .sort({ name: 1 })
        .lean();

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

        const normalizedProduct = String(product || "trevista").trim().toLowerCase();
        const availableProduct = await Product.exists({
            key: normalizedProduct,
            status: "active",
            hidden: { $ne: true },
        });
        if (!availableProduct) {
            return res.status(404).json({
                status: "error",
                message: "This travel product is not currently available",
            });
        }

        const existing = await Favorite.findOne({ tourId, userId, product: normalizedProduct });

        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
            if (normalizedProduct === "trevista") {
                recordTourSignal(tourId, "wishlist", -1).catch((error) =>
                    console.error("[TourIntelligence] wishlist signal failed:", error.message),
                );
            }
            return res
                .status(200)
                .json({ status: "success", componentData: { data: { favorited: false } } });
        }

        await Favorite.create({ tourId, userId, product: normalizedProduct });
        if (normalizedProduct === "trevista") {
            recordTourSignal(tourId, "wishlist").catch((error) =>
                console.error("[TourIntelligence] wishlist signal failed:", error.message),
            );
        }
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
        const products = await getVisibleProducts();
        const productMap = new Map(products.map((product) => [product.key, product]));
        const visibleProductKeys = products.map((product) => product.key);
        const favorites = visibleProductKeys.length
            ? await Favorite.find({ userId, product: { $in: visibleProductKeys } })
                  .sort({ createdAt: -1 })
                  .lean()
            : [];

        const trevistaIds = favorites.filter((f) => f.product === "trevista").map((f) => f.tourId);
        const trevioIds = favorites.filter((f) => f.product === "trevio").map((f) => f.tourId);

        const Trip = getTripModel();

        const [trevistaTours, trevioTrips] = await Promise.all([
            trevistaIds.length ? Tour.find({ _id: { $in: trevistaIds } }) : [],
            trevioIds.length && Trip ? Trip.find({ _id: { $in: trevioIds } }) : [],
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
                    return trip
                        ? {
                              ...trip,
                              _id: id,
                              id,
                              tourId: id,
                              product: "trevio",
                              productLabel: productMap.get("trevio")?.name || "",
                              favoriteId: String(fav._id),
                              savedAt: fav.createdAt,
                          }
                        : null;
                }
                const tour = tourMap.get(id);
                return tour
                    ? {
                          ...tour,
                          _id: id,
                          id,
                          tourId: id,
                          product: "trevista",
                          productLabel: productMap.get("trevista")?.name || "",
                          favoriteId: String(fav._id),
                          savedAt: fav.createdAt,
                      }
                    : null;
            })
            .filter(Boolean);

        const productOptions = [
            { value: "all", label: FAVORITES_COPY.labels.allProducts },
            ...products.map((product) => ({
                value: product.key,
                label: product.name,
                description: product.description || "",
            })),
        ];

        return res.status(200).json({
            status: "success",
            componentData: {
                data: ordered,
                view: {
                    ...FAVORITES_COPY,
                    controls: { ...FAVORITES_COPY.controls, productOptions },
                    summary: { savedCount: ordered.length, productCount: products.length },
                },
                structure: {
                    widgets: [
                        {
                            type: "favorites",
                            props: {
                                chips: productOptions.map((option, index) => ({
                                    id: option.value,
                                    label: option.label,
                                    active: index === 0,
                                })),
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
