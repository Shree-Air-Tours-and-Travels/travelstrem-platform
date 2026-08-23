import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TrevioTripRepository from "../repositories/TrevioTripRepository.js";
import { normalizeTrevioTrip } from "../services/trevioTripService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const escapeRegExp = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findTripByRef = async (tripRef) => {
    const ref = decodeURIComponent(String(tripRef || "")).trim();
    if (!ref) return null;
    if (/^[0-9a-fA-F]{24}$/.test(ref)) {
        const byId = await TrevioTripRepository.findOne({ _id: ref });
        if (byId) return byId;
    }
    const bySlug = await TrevioTripRepository.findBySlug(ref);
    if (bySlug) return bySlug;
    const byTitle = await TrevioTripRepository.findOne({
        title: new RegExp(`^${escapeRegExp(ref.replace(/-/g, " ").trim())}$`, "i"),
    });
    if (byTitle) return byTitle;
    return null;
};

function ensurePageContract(widget) {
    const c = widget.component || {};
    if (!c.dataScope) c.dataScope = { options: {} };
    if (!c.dataScope.options) c.dataScope.options = {};
    if (!c.elements) c.elements = { labels: {}, urls: {} };
    if (!c.elements.labels) c.elements.labels = {};
    if (!c.elements.urls) c.elements.urls = {};
    if (!c.structure) c.structure = {};
    if (!c.structure.header) c.structure.header = {};
    if (!c.structure.widgets) c.structure.widgets = [];
    if (!c.structure.config) c.structure.config = {};
    if (!c.structure.actions) c.structure.actions = [];
    return widget;
}

const normalizeTripForWidget = (trip = {}) => {
    const normalized = normalizeTrevioTrip(trip);
    return {
        _id: normalized._id,
        id: normalized.id,
        slug: normalized.slug,
        title: normalized.title,
        category: normalized.category,
        location: normalized.location,
        country: normalized.country,
        duration: normalized.duration,
        desc: normalized.desc,
        description: normalized.description,
        photo: normalized.photo,
        photos: normalized.photos,
        image: normalized.image,
        chips: normalized.chips,
        tags: normalized.tags,
        rating: normalized.rating,
        avgRating: normalized.avgRating,
        reviewCount: normalized.reviewCount,
        featured: normalized.featured,
        tremVerified: normalized.tremVerified,
        tremVerifiedAt: normalized.tremVerifiedAt,
        tag: normalized.tag,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        dates: normalized.dates,
        priceInfo: normalized.priceInfo,
        availability: normalized.availability,
        agency: normalized.agency,
        operator: normalized.operator,
        preferences: normalized.preferences || {},
        itinerary: (trip.itinerary || []).map((item) => ({
            day: item.day || 1,
            title: item.title || item.location || "Experience day",
            summary:
                item.summary || (Array.isArray(item.activities) ? item.activities.join(", ") : ""),
            location: item.location || "",
            activities: Array.isArray(item.activities) ? item.activities : [],
            meals: item.meals || "",
            accommodation: item.accommodation || "",
            notes: item.notes || "",
        })),
        inclusions: Array.isArray(trip.inclusions) ? trip.inclusions : [],
        exclusions: Array.isArray(trip.exclusions) ? trip.exclusions : [],
        includedStays: Array.isArray(trip.includedStays) ? trip.includedStays : [],
        hotelOptions: Array.isArray(trip.hotelOptions) ? trip.hotelOptions : [],
        cancellation: trip.cancellation || null,
        extras: Array.isArray(trip.extras) ? trip.extras : [],
        reviews: Array.isArray(trip.reviews) ? trip.reviews : normalized.reviews || [],
        cancellationPolicy: trip.cancellationPolicy || normalized.cancellationPolicy || "",
    };
};

export const getTripWidget = async (req, res) => {
    try {
        const widgetRef =
            req.query.ref ||
            (req.params.widgetFile ? `./widgets/${req.params.widgetFile}.json` : null);
        if (!widgetRef) {
            return res.status(400).json({ status: "error", message: "Missing widget reference" });
        }

        let resolvedPath;
        const pageKey = req.query.pageKey || "trevio-remote/details";
        if (pageKey === "trevio-remote/details") {
            resolvedPath = path.resolve(DATA_DIR, "trevio-remote/details", widgetRef);
        } else {
            resolvedPath = path.resolve(DATA_DIR, widgetRef);
        }

        if (!resolvedPath.startsWith(DATA_DIR)) {
            return res.status(403).json({ status: "error", message: "Invalid widget path" });
        }

        const raw = fs.readFileSync(resolvedPath, "utf8");
        const widget = JSON.parse(raw);
        const fileName = path.basename(resolvedPath);

        if (pageKey === "trevio-remote/details") {
            const tripRef = req.query.tripRef;
            if (tripRef) {
                const tripDoc = await findTripByRef(tripRef);
                if (tripDoc) {
                    const tripObj = tripDoc.toObject
                        ? tripDoc.toObject({ virtuals: true })
                        : tripDoc;
                    const normalized = normalizeTripForWidget(tripObj);
                    switch (fileName) {
                        case "tour-overview.json":
                            widget.component.data.tour = normalized;
                            break;
                        case "tour-facts.json":
                            widget.component.data.tour = {
                                startDate: normalized.startDate || "",
                                endDate: normalized.endDate || "",
                                location: normalized.location || "",
                                availability: normalized.availability || {},
                                distance: tripObj.distance || null,
                            };
                            break;
                        case "tour-gallery.json":
                            widget.component.data.photos = normalized.photos || [];
                            widget.component.data.title = normalized.title;
                            widget.component.data.city = { from: "", to: normalized.location };
                            break;
                        case "pricing-card.json":
                            widget.component.data.tour = normalized;
                            widget.component.data.priceInfo = normalized.priceInfo;
                            widget.component.data.availability = normalized.availability;
                            break;
                        case "tour-highlights.json":
                            widget.component.data.highlights = (normalized.chips || []).map(
                                (chip, i) => ({
                                    title: chip,
                                    short: "",
                                    icon: "",
                                    order: i,
                                }),
                            );
                            break;
                        case "itinerary-timeline.json":
                            widget.component.data.itinerary = [
                                ...(normalized.itinerary || []),
                            ].sort((a, b) => Number(a.day) - Number(b.day));
                            break;
                        case "inclusions-exclusions.json":
                            widget.component.data.inclusions = normalized.inclusions || [];
                            widget.component.data.exclusions = normalized.exclusions || [];
                            break;
                        case "included-stays.json":
                            widget.component.data.stays = normalized.includedStays || [];
                            widget.component.data.hotelOptions = normalized.hotelOptions || [];
                            break;
                        case "cancellation-policy.json":
                            widget.component.data.cancellationPolicy =
                                normalized.cancellationPolicy || "";
                            widget.component.data.cancellation = normalized.cancellation || null;
                            widget.component.data.extras = Array.isArray(normalized.extras)
                                ? normalized.extras
                                : [];
                            break;
                        case "reviews-section.json":
                            widget.component.data.reviews = normalized.reviews || [];
                            widget.component.data.avgRating = normalized.avgRating || 0;
                            widget.component.data.reviewCount = normalized.reviewCount || 0;
                            break;
                        case "similar-tours.json": {
                            const allTrips = await TrevioTripRepository.find({
                                status: "listed",
                                isListed: true,
                            }).sort({ createdAt: -1 });
                            const currentTags = new Set(
                                (normalized.tags || []).map((t) => String(t).toLowerCase()),
                            );
                            widget.component.data.tours = (Array.isArray(allTrips) ? allTrips : [])
                                .map((doc) => {
                                    const obj = doc.toObject
                                        ? doc.toObject({ virtuals: true })
                                        : doc;
                                    return normalizeTrevioTrip(obj);
                                })
                                .filter(
                                    (candidate) => String(candidate._id) !== String(normalized._id),
                                )
                                .sort((a, b) => {
                                    const aScore = (a.tags || []).filter((t) =>
                                        currentTags.has(String(t).toLowerCase()),
                                    ).length;
                                    const bScore = (b.tags || []).filter((t) =>
                                        currentTags.has(String(t).toLowerCase()),
                                    ).length;
                                    return bScore - aScore;
                                })
                                .slice(0, 3);
                            break;
                        }
                        default:
                            break;
                    }
                } else {
                    return res.status(404).json({ status: "error", message: "Trip not found" });
                }
            }
        }

        return res.status(200).json(ensurePageContract(widget));
    } catch (error) {
        console.error("getTripWidget error:", error);
        return res.status(404).json({ status: "error", message: "Widget not found" });
    }
};

export const getTripDetailsWidget = (req, res) => {
    req.query.pageKey = "trevio-remote/details";
    req.query.tripRef = req.params.tripRef;
    return getTripWidget(req, res);
};
