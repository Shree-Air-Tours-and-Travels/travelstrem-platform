// modules/tours/controller.js
import TourRepository from "../repositories/TourRepository.js";
import {
    getHandlerFromReq,
} from "../services/tourService.js";
import config from "../../../config/index.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";
const NODE_ENV = (config.nodeEnv || "development").toString().trim();
const IS_DEVELOPMENT = NODE_ENV === "development";
const DEFAULT_DELAY_MS = Number.isFinite(Number(config.devDelayMs))
    ? Number(config.devDelayMs)
    : 3000;
const DEBUG = Boolean(config.enableDebugLogs || config.debug);

const sendJson = (res, statusCode, body, req) => {
    if (!IS_DEVELOPMENT) return res.status(statusCode).json(body);

    const q = Number(req?.query?.delayMs);
    const header = Number(req?.headers?.["x-dev-delay"]);
    const delayMs = Number.isFinite(q) && !Number.isNaN(q)
        ? q
        : (Number.isFinite(header) && !Number.isNaN(header) ? header : DEFAULT_DELAY_MS);

    if (!delayMs || delayMs <= 0) {
        if (DEBUG) console.debug(`[sendJson] dev delay disabled, returning immediately (${statusCode})`);
        return res.status(statusCode).json(body);
    }

    if (DEBUG) console.debug(`[sendJson] delaying response by ${delayMs}ms (development mode)`);
    return setTimeout(() => res.status(statusCode).json(body), delayMs);
};

/* ----------------- Utilities ----------------- */

const parseDate = (v) => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d)) throw new Error(`Invalid date: ${v}`);
    return d;
};

const assertSeasonalPricingValid = (seasons = []) => {
    if (!Array.isArray(seasons)) return;
    const normalized = seasons.map((s, idx) => {
        if (s.min == null || s.max == null) throw new Error(`Seasonal pricing at index ${idx} missing min/max`);
        if (Number(s.min) > Number(s.max)) throw new Error(`Seasonal pricing at index ${idx} has min > max`);
        const start = parseDate(s.startDate);
        const end = parseDate(s.endDate);
        if (!start || !end) throw new Error(`Seasonal pricing at index ${idx} missing startDate/endDate`);
        if (start > end) throw new Error(`Seasonal pricing '${s.seasonName || idx}' startDate is after endDate`);
        return { start, end, idx, seasonName: s.seasonName || idx };
    });

    normalized.sort((a, b) => a.start - b.start);
    for (let i = 1; i < normalized.length; i++) {
        const prev = normalized[i - 1];
        const curr = normalized[i];
        // If curr.start <= prev.end => overlap (strict overlap not allowed)
        if (curr.start <= prev.end) {
            throw new Error(`Seasonal pricing overlap between '${prev.seasonName}' and '${curr.seasonName}'`);
        }
    }
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugifyTourTitle = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const findTourByRef = async (tourRef) => {
    const ref = decodeURIComponent(String(tourRef || "")).trim();
    if (!ref) return null;

    if (/^[0-9a-fA-F]{24}$/.test(ref)) {
        const byId = await TourRepository.findById(ref);
        if (byId) return byId;
    }

    const titleCandidate = ref.replace(/-/g, " ").trim();
    const directTitle = await TourRepository.findOne({
        title: new RegExp(`^${escapeRegExp(titleCandidate)}$`, "i"),
    });
    if (directTitle) return directTitle;

    const tours = await TourRepository.find({}, "title city address distance period startDate endDate photo photos desc price seasonalPricing itinerary highlights availability meetingPoint inclusions exclusions languages cancellationPolicy minAge maxAge maxGroupSize reviews featured tags isPublished status createdAt updatedAt");
    return tours.find((tour) => slugifyTourTitle(tour.title) === slugifyTourTitle(ref)) || null;
};

/**
 * Build priceInfo safely from a Tour doc (handles getCurrentPrice errors).
 */
const buildPriceInfo = (doc, date = new Date()) => {
    try {
        if (doc && typeof doc.getCurrentPrice === "function") {
            return doc.getCurrentPrice(date);
        }
    } catch (e) {
        // fallthrough to base price fallback
    }
    if (!doc || !doc.price) return null;
    return {
        min: doc.price.min,
        max: doc.price.max,
        currency: doc.price.currency,
        isFinal: !!doc.price.isFinal,
        source: doc.price.source || "manual",
        matchedSeason: null,
        note: "",
    };
};

/**
 * Normalize a tour object for API response and ensure all schema keys are present.
 * Accepts either mongoose doc or plain object (tourObj).
 */
const normalizeTourForResponse = (tourObj = {}, priceInfo = null) => {
    // defensive defaults
    return {
        _id: tourObj._id || tourObj.id || null,
        title: tourObj.title || "",
        city: tourObj.city || null,
        address: tourObj.address || null,
        distance: typeof tourObj.distance === "number" ? tourObj.distance : (tourObj.distance ? Number(tourObj.distance) : null),
        period: tourObj.period || null,
        startDate: tourObj.startDate || null,
        endDate: tourObj.endDate || null,
        photo: tourObj.photo || "",
        photos: Array.isArray(tourObj.photos) ? tourObj.photos : (tourObj.photos ? [tourObj.photos] : []),
        desc: tourObj.desc || "",
        price: tourObj.price || null,
        seasonalPricing: Array.isArray(tourObj.seasonalPricing) ? tourObj.seasonalPricing : [],
        itinerary: Array.isArray(tourObj.itinerary) ? tourObj.itinerary : [],
        highlights: Array.isArray(tourObj.highlights) ? tourObj.highlights : [],
        availability: tourObj.availability || { totalSeats: null, seatsAvailable: null },
        meetingPoint: tourObj.meetingPoint || "",
        inclusions: Array.isArray(tourObj.inclusions) ? tourObj.inclusions : [],
        exclusions: Array.isArray(tourObj.exclusions) ? tourObj.exclusions : [],
        languages: Array.isArray(tourObj.languages) ? tourObj.languages : [],
        cancellationPolicy: tourObj.cancellationPolicy || "",
        minAge: typeof tourObj.minAge === "number" ? tourObj.minAge : (tourObj.minAge ? Number(tourObj.minAge) : null),
        maxAge: typeof tourObj.maxAge === "number" ? tourObj.maxAge : (tourObj.maxAge ? Number(tourObj.maxAge) : null),
        maxGroupSize: tourObj.maxGroupSize || null,
        reviews: Array.isArray(tourObj.reviews) ? tourObj.reviews : [],
        featured: !!tourObj.featured,
        tags: Array.isArray(tourObj.tags) ? tourObj.tags : [],
        isPublished: typeof tourObj.isPublished === "boolean" ? tourObj.isPublished : true,
        status: tourObj.status || "published",
        createdAt: tourObj.createdAt || null,
        updatedAt: tourObj.updatedAt || null,
        avgRating: tourObj.avgRating != null ? tourObj.avgRating : (Array.isArray(tourObj.reviews) && tourObj.reviews.length ? (tourObj.reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / tourObj.reviews.length).toFixed(1) : 0),
        priceInfo: priceInfo || null,
        raw: tourObj, // keep raw object for debugging if needed
    };
};

/* ----------------- Sanitizer + validator ----------------- */

/**
 * sanitizeTourPayload(raw)
 * - enforces price, seasonalPricing, itinerary, highlights, period, maxGroupSize
 * - permits other keys but normalizes types
 */
const sanitizeTourPayload = (raw = {}) => {
    const p = { ...raw };

    // Required fields
    if (!p.title) throw new Error("Missing required field: title");
    if (!p.desc && !p.description) throw new Error("Missing required field: desc/description");

    // Price
    if (!p.price) throw new Error("Missing price object (price.min & price.max required)");
    if (p.price.min == null || p.price.max == null) throw new Error("price.min and price.max are required");
    p.price = {
        min: Number(p.price.min),
        max: Number(p.price.max),
        currency: p.price.currency || "INR",
        isFinal: !!p.price.isFinal,
        source: p.price.source || "manual",
    };
    if (Number.isNaN(p.price.min) || Number.isNaN(p.price.max)) throw new Error("price.min or price.max is not a number");
    if (p.price.min > p.price.max) throw new Error("price.min cannot be greater than price.max");

    // Seasonal pricing
    if (p.seasonalPricing) {
        if (!Array.isArray(p.seasonalPricing)) throw new Error("seasonalPricing must be an array");
        p.seasonalPricing = p.seasonalPricing.map((s, idx) => {
            if (s.min == null || s.max == null) throw new Error(`seasonalPricing[${idx}] requires min & max`);
            const start = parseDate(s.startDate);
            const end = parseDate(s.endDate);
            return {
                seasonName: s.seasonName || `Season ${idx + 1}`,
                startDate: start,
                endDate: end,
                min: Number(s.min),
                max: Number(s.max),
                currency: s.currency || p.price.currency || "INR",
                isFinal: !!s.isFinal,
                source: s.source || "manual",
                notes: s.notes || "",
            };
        });
        assertSeasonalPricingValid(p.seasonalPricing);
    }

    // Itinerary
    if (p.itinerary) {
        if (!Array.isArray(p.itinerary)) throw new Error("itinerary must be an array");
        p.itinerary = p.itinerary.map((it, idx) => {
            const day = it.day != null ? Number(it.day) : idx + 1;
            if (Number.isNaN(day) || day < 1) throw new Error(`itinerary[${idx}].day must be a positive integer`);
            return {
                day,
                title: it.title || "",
                summary: it.summary || "",
                activities: Array.isArray(it.activities) ? it.activities.map(String) : (it.activities ? [String(it.activities)] : []),
                meals: Array.isArray(it.meals) ? it.meals.map(String) : (it.meals ? [String(it.meals)] : []),
                accommodation: it.accommodation || "",
                location: it.location || "",
                notes: it.notes || "",
            };
        });
        const days = p.itinerary.map(i => i.day);
        const uniqDays = Array.from(new Set(days));
        if (uniqDays.length !== days.length) throw new Error("itinerary days must be unique");
        p.itinerary.sort((a, b) => a.day - b.day);
    }

    // Highlights
    if (p.highlights) {
        if (!Array.isArray(p.highlights)) throw new Error("highlights must be an array");
        p.highlights = p.highlights.map((h, idx) => ({
            title: h.title || `Highlight ${idx + 1}`,
            short: h.short || "",
            icon: h.icon || "",
            order: Number.isFinite(Number(h.order)) ? Number(h.order) : (h.order === 0 ? 0 : idx),
        }));
        p.highlights.sort((a, b) => a.order - b.order);
    }

    // Period
    if (p.period) {
        p.period = {
            days: Number(p.period.days),
            nights: Number(p.period.nights),
        };
        if (Number.isNaN(p.period.days) || Number(p.period.days) < 1) throw new Error("period.days must be a positive integer");
        if (Number.isNaN(p.period.nights) || Number(p.period.nights) < 0) throw new Error("period.nights must be a non-negative integer");
    }

    // Dates
    if (p.startDate) p.startDate = parseDate(p.startDate);
    if (p.endDate) p.endDate = parseDate(p.endDate);

    // Availability
    if (p.availability) {
        p.availability = {
            totalSeats: p.availability.totalSeats == null ? null : Number(p.availability.totalSeats),
            seatsAvailable: p.availability.seatsAvailable == null ? null : Number(p.availability.seatsAvailable),
        };
    }

    // Simple number validations
    if (p.maxGroupSize != null) {
        p.maxGroupSize = Number(p.maxGroupSize);
        if (Number.isNaN(p.maxGroupSize) || p.maxGroupSize < 1) throw new Error("maxGroupSize must be a positive integer");
    }
    if (p.minAge != null) {
        p.minAge = Number(p.minAge);
        if (Number.isNaN(p.minAge) || p.minAge < 0) throw new Error("minAge must be >= 0");
    }
    if (p.maxAge != null) {
        p.maxAge = Number(p.maxAge);
        if (Number.isNaN(p.maxAge) || p.maxAge < 0) throw new Error("maxAge must be >= 0");
    }

    // Reviews (optional) - shallow validation
    if (p.reviews) {
        if (!Array.isArray(p.reviews)) throw new Error("reviews must be an array");
        p.reviews = p.reviews.map((r, idx) => {
            if (!r.name || r.rating == null) throw new Error(`reviews[${idx}] requires name and rating`);
            return {
                name: String(r.name),
                rating: Number(r.rating),
                comment: r.comment || "",
            };
        });
    }

    // Other arrays/strings
    p.photos = Array.isArray(p.photos) ? p.photos.map(String) : (p.photos ? [String(p.photos)] : []);
    p.inclusions = Array.isArray(p.inclusions) ? p.inclusions.map(String) : (p.inclusions ? [String(p.inclusions)] : []);
    p.exclusions = Array.isArray(p.exclusions) ? p.exclusions.map(String) : (p.exclusions ? [String(p.exclusions)] : []);
    p.languages = Array.isArray(p.languages) ? p.languages.map(String) : (p.languages ? [String(p.languages)] : []);
    p.tags = Array.isArray(p.tags) ? p.tags.map(String) : (p.tags ? [String(p.tags)] : []);
    p.featured = !!p.featured;
    p.isPublished = typeof p.isPublished === "boolean" ? p.isPublished : true;
    p.status = p.status || "published";

    // Keep other structural fields as-is (city, address)
    return {
        title: String(p.title),
        city: p.city || null,
        address: p.address || null,
        distance: p.distance != null ? Number(p.distance) : p.distance,
        period: p.period || null,
        startDate: p.startDate || null,
        endDate: p.endDate || null,
        photo: p.photo || "",
        photos: p.photos || [],
        desc: p.desc || p.description || "",
        price: p.price,
        seasonalPricing: p.seasonalPricing || [],
        itinerary: p.itinerary || [],
        highlights: p.highlights || [],
        availability: p.availability || { totalSeats: null, seatsAvailable: null },
        meetingPoint: p.meetingPoint || "",
        inclusions: p.inclusions || [],
        exclusions: p.exclusions || [],
        languages: p.languages || [],
        cancellationPolicy: p.cancellationPolicy || "",
        minAge: p.minAge != null ? p.minAge : null,
        maxAge: p.maxAge != null ? p.maxAge : null,
        maxGroupSize: p.maxGroupSize != null ? p.maxGroupSize : null,
        reviews: p.reviews || [],
        featured: !!p.featured,
        tags: p.tags || [],
        isPublished: p.isPublished,
        status: p.status,
    };
};

/* ----------------- Controller actions ----------------- */

/**
 * GET /tours
 */
export const getTours = async (req, res) => {
    const handler = getHandlerFromReq(req);
    const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();
    const limit = Math.max(0, Math.min(Number(req.query?.limit) || 0, 50));
    const featuredOnly = req.query?.featured === "true";

    try {
        const query = featuredOnly ? { featured: true } : {};
        let toursQuery = TourRepository.find(query).sort({ createdAt: -1 });
        if (limit) toursQuery = toursQuery.limit(limit);

        const toursRaw = await toursQuery;

        const tours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
            const tourObj = doc.toObject ? doc.toObject() : doc;
            const priceInfo = buildPriceInfo(doc, dateQuery);
            const normalized = normalizeTourForResponse(tourObj, priceInfo);
            return normalized;
        });

        return sendJson(res, 200, {
            status: "success",
            component: {
                data: { tours },
                dataScope: { options: {} },
                elements: { labels: {}, urls: {} },
                structure: { header: {}, widgets: [], config: {}, actions: [] },
            },
            message: "Tours fetched successfully",
            handler,
        }, req);
    } catch (error) {
        console.error("getTours error:", error);
        return sendJson(res, 500, {
            status: "error",
            component: {
                data: { tours: [] },
                dataScope: { options: {} },
                elements: { labels: {}, urls: {} },
                structure: { header: {}, widgets: [], config: {}, actions: [] },
            },
            message: "Failed to fetch tours",
            handler,
            error: error.message,
        }, req);
    }
};

/**
 * GET /tours/:tourRef
 */
export const getTourByRef = async (req, res) => {
    const handler = getHandlerFromReq(req);
    const { tourRef } = req.params;
    const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();

    try {
        const tourRaw = await findTourByRef(tourRef);

        if (!tourRaw) {
            return sendJson(res, 404, {
                status: "error",
                message: "Tour not found",
                handler,
            }, req);
        }

        const tourObj = tourRaw.toObject ? tourRaw.toObject() : tourRaw;
        const priceInfo = buildPriceInfo(tourRaw, dateQuery);
        const normalized = normalizeTourForResponse(tourObj, priceInfo);

        return sendJson(res, 200, {
            status: "success",
            component: {
                data: normalized,
                dataScope: { options: {} },
                elements: { labels: {}, urls: {} },
                structure: { header: {}, widgets: [], config: {}, actions: [] },
            },
            message: "Tour fetched successfully",
            handler,
        }, req);
    } catch (error) {
        console.error("getTourByRef error:", error);
        return sendJson(res, 500, {
            status: "error",
            component: {
                data: null,
                dataScope: { options: {} },
                elements: { labels: {}, urls: {} },
                structure: { header: {}, widgets: [], config: {}, actions: [] },
            },
            message: "Failed to fetch tour",
            handler,
            error: error.message,
        }, req);
    }
};

/**
 * POST /tours
 */
export const createTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    try {
        const sanitized = sanitizeTourPayload(req.body);

        const newTour = TourRepository.create(sanitized);
        const savedTour = await newTour.save();

        const priceInfo = buildPriceInfo(savedTour, new Date());
        const normalized = normalizeTourForResponse(savedTour.toObject ? savedTour.toObject() : savedTour, priceInfo);

        return sendJson(res, 201, {
            ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                injectData: { tours: [normalized], tour: normalized },
            }),
            message: "Tour created successfully",
            handler,
        }, req);
    } catch (error) {
        console.error("createTour error:", error);
        return sendJson(res, 400, {
            status: "error",
            message: "Failed to create tour",
            handler,
            error: error.message,
        }, req);
    }
};

/**
 * PUT /tours/:id
 */
export const updateTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    const { id } = req.params;

    try {
        const sanitized = sanitizeTourPayload(req.body);

        const updatedTour = await TourRepository.findByIdAndUpdate(id, sanitized, {
            new: true,
            runValidators: true,
        });

        if (!updatedTour) {
            return sendJson(res, 404, {
                status: "error",
                message: "Tour not found",
                handler,
            }, req);
        }

        const priceInfo = buildPriceInfo(updatedTour, new Date());
        const normalized = normalizeTourForResponse(updatedTour.toObject ? updatedTour.toObject() : updatedTour, priceInfo);

        return sendJson(res, 200, {
            ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                injectData: { tours: [normalized], tour: normalized },
            }),
            message: "Tour updated successfully",
            handler,
        }, req);
    } catch (error) {
        console.error("updateTour error:", error);
        return sendJson(res, 400, {
            status: "error",
            message: "Failed to update tour",
            handler,
            error: error.message,
        }, req);
    }
};

/**
 * DELETE /tours/:id
 */
export const deleteTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    const { id } = req.params;
    try {
        const deletedTour = await TourRepository.findByIdAndDelete(id);
        if (!deletedTour) {
            return sendJson(res, 404, {
                status: "error",
                message: "Tour not found",
                handler,
            }, req);
        }

        return sendJson(res, 200, {
            ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                injectData: { deletedTourId: id },
            }),
            message: "Tour deleted successfully",
            handler,
        }, req);
    } catch (error) {
        console.error("deleteTour error:", error);
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to delete tour",
            handler,
            error: error.message,
        }, req);
    }
};

/**
 * DELETE /tours (deleteAllTours)
 */
export const deleteAllTours = async (req, res) => {
    const handler = getHandlerFromReq(req);
    try {
        const result = await TourRepository.deleteMany({});
        return sendJson(res, 200, {
            ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                injectData: { deletedCount: result.deletedCount || 0 },
            }),
            message: `Deleted ${result.deletedCount || 0} tours`,
            handler,
        }, req);
    } catch (error) {
        console.error("deleteAllTours error:", error);
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to delete tours",
            handler,
            error: error.message,
        }, req);
    }
};
