// modules/tours/controller.js
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const toString = (v) => String(v ?? "");
const agencySummary = (value) => value && typeof value === "object" ? {
    id: value._id || value.id || null,
    name: value.agencyName || "",
    reference: value.partnerAgencyRef || "",
    logo: value.logo || "",
    website: value.website || "",
    location: [value.address?.city, value.address?.state, value.address?.country].filter(Boolean).join(", "),
} : null;
import TourRepository from "../repositories/TourRepository.js";
import {
    getHandlerFromReq,
} from "../services/tourService.js";
import config from "../../../config/index.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";
import Booking from "../../bookings/models/Booking.js";
import User from "../../auth/models/User.js";
import { audit } from "../../tenancy/audit.service.js";
const NODE_ENV = (config.nodeEnv || "development").toString().trim();
const IS_DEVELOPMENT = NODE_ENV === "development";
const DEFAULT_DELAY_MS = Number.isFinite(Number(config.devDelayMs))
    ? Number(config.devDelayMs)
    : 3000;
const DEBUG = Boolean(config.enableDebugLogs || config.debug);
const TOUR_TRANSITIONS = {
    draft: new Set(["pending_approval", "published", "archived", "cancelled"]),
    pending_approval: new Set(["draft", "published", "archived", "cancelled"]),
    published: new Set(["unpublished", "archived", "cancelled"]),
    unpublished: new Set(["published", "archived", "cancelled"]),
    archived: new Set([]), cancelled: new Set([]),
};
const canPublishTour = (req) => req.access?.isMaster || req.access?.role === "partner_admin" || req.access?.agency?.settings?.tripPublishingPermissions?.agentCanPublish === true;
const assertTourTransition = (from, to, req) => {
    if (!to || from === to) return;
    if (!TOUR_TRANSITIONS[from]?.has(to)) throw new Error(`Cannot move tour from ${from} to ${to}.`);
    if (to === "published" && !canPublishTour(req)) throw Object.assign(new Error("This tour must be submitted for approval before publishing."), { status: 403 });
};

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

    const tours = await TourRepository.find({}, "title city address distance period startDate endDate photo photos desc price seasonalPricing itinerary highlights availability meetingPoint inclusions exclusions languages cancellationPolicy minAge maxAge maxGroupSize reviews featured tags isPublished status ownerAgent createdAt updatedAt");
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
export const normalizeTourForResponse = (tourObj = {}, priceInfo = null) => {
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
        includedStays: Array.isArray(tourObj.includedStays) ? tourObj.includedStays : [],
        hotelOptions: Array.isArray(tourObj.hotelOptions) ? tourObj.hotelOptions : [],
        cancellation: tourObj.cancellation || null,
        extras: Array.isArray(tourObj.extras) ? tourObj.extras : [],
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
        tremVerified: Boolean(tourObj.tremVerified),
        tremVerifiedAt: tourObj.tremVerifiedAt || null,
        ownerAgent: isObject(tourObj.ownerAgent)
            ? toString(tourObj.ownerAgent._id)
            : toString(tourObj.ownerAgent) || null,
        agentTour: !!tourObj.agentTour,
        agencyRef: tourObj.agencyRef || "",
        partnerAgencyRef: tourObj.partnerAgencyRef || "",
        inventorySource: tourObj.inventorySource || "platform",
        providerName: tourObj.providerName || "",
        agency: agencySummary(tourObj.agencyId),
        ...extractOwnerInfo(tourObj.ownerAgent),
        createdAt: tourObj.createdAt || null,
        updatedAt: tourObj.updatedAt || null,
         avgRating: tourObj.avgRating != null ? tourObj.avgRating : (Array.isArray(tourObj.reviews) && tourObj.reviews.length ? (tourObj.reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / tourObj.reviews.length).toFixed(1) : 0),
         priceInfo: priceInfo || null,
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
    // Persistence and verification metadata is exclusively server-owned.
    // Imports may contain these fields, but they must never affect a tour.
    for (const key of ["_id", "id", "__v", "createdAt", "updatedAt", "tremVerified", "tremVerifiedBy", "tremVerifiedAt", "createdBy"]) delete p[key];

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
    p.inventorySource = ["agent", "provider", "platform"].includes(p.inventorySource) ? p.inventorySource : "platform";

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
        ownerAgent: p.ownerAgent || null,
        agencyRef: p.agencyRef || "",
        partnerAgencyRef: p.partnerAgencyRef || "",
        inventorySource: p.inventorySource,
        providerName: p.providerName || "",
    };
};

/**
 * sanitizeTourPayloadForUpdate(raw)
 * - Only processes fields that are present in `raw`
 * - Does NOT throw on missing required fields (title, desc, price)
 * - Returns only the fields that were sent, safe for partial PUT
 */
const sanitizeTourPayloadForUpdate = (raw = {}) => {
    const p = { ...raw };
    for (const key of ["_id", "id", "__v", "createdAt", "updatedAt", "tremVerified", "tremVerifiedBy", "tremVerifiedAt", "createdBy"]) delete p[key];
    const result = {};

    if (p.title !== undefined) {
        if (!p.title) throw new Error("Missing required field: title");
        result.title = String(p.title);
    }

    if (p.desc !== undefined || p.description !== undefined) {
        if (!p.desc && !p.description) throw new Error("Missing required field: desc/description");
        result.desc = p.desc || p.description || "";
    }

    if (p.price !== undefined) {
        if (!p.price) throw new Error("Missing price object (price.min & price.max required)");
        if (p.price.min == null || p.price.max == null) throw new Error("price.min and price.max are required");
        result.price = {
            min: Number(p.price.min),
            max: Number(p.price.max),
            currency: p.price.currency || "INR",
            isFinal: !!p.price.isFinal,
            source: p.price.source || "manual",
        };
        if (Number.isNaN(result.price.min) || Number.isNaN(result.price.max)) throw new Error("price.min or price.max is not a number");
        if (result.price.min > result.price.max) throw new Error("price.min cannot be greater than price.max");
    }

    if (p.seasonalPricing !== undefined) {
        if (!Array.isArray(p.seasonalPricing)) throw new Error("seasonalPricing must be an array");
        result.seasonalPricing = p.seasonalPricing.map((s, idx) => {
            if (s.min == null || s.max == null) throw new Error(`seasonalPricing[${idx}] requires min & max`);
            const start = parseDate(s.startDate);
            const end = parseDate(s.endDate);
            return {
                seasonName: s.seasonName || `Season ${idx + 1}`,
                startDate: start,
                endDate: end,
                min: Number(s.min),
                max: Number(s.max),
                currency: s.currency || result.price?.currency || "INR",
                isFinal: !!s.isFinal,
                source: s.source || "manual",
                notes: s.notes || "",
            };
        });
        assertSeasonalPricingValid(result.seasonalPricing);
    }

    if (p.itinerary !== undefined) {
        if (!Array.isArray(p.itinerary)) throw new Error("itinerary must be an array");
        result.itinerary = p.itinerary.map((it, idx) => {
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
        const days = result.itinerary.map(i => i.day);
        const uniqDays = Array.from(new Set(days));
        if (uniqDays.length !== days.length) throw new Error("itinerary days must be unique");
        result.itinerary.sort((a, b) => a.day - b.day);
    }

    if (p.highlights !== undefined) {
        if (!Array.isArray(p.highlights)) throw new Error("highlights must be an array");
        result.highlights = p.highlights.map((h, idx) => ({
            title: h.title || `Highlight ${idx + 1}`,
            short: h.short || "",
            icon: h.icon || "",
            order: Number.isFinite(Number(h.order)) ? Number(h.order) : (h.order === 0 ? 0 : idx),
        }));
        result.highlights.sort((a, b) => a.order - b.order);
    }

    if (p.period !== undefined) {
        result.period = {
            days: Number(p.period.days),
            nights: Number(p.period.nights),
        };
        if (Number.isNaN(result.period.days) || result.period.days < 1) throw new Error("period.days must be a positive integer");
        if (Number.isNaN(result.period.nights) || result.period.nights < 0) throw new Error("period.nights must be a non-negative integer");
    }

    if (p.startDate !== undefined) result.startDate = p.startDate ? parseDate(p.startDate) : null;
    if (p.endDate !== undefined) result.endDate = p.endDate ? parseDate(p.endDate) : null;

    if (p.city !== undefined) result.city = p.city || null;
    if (p.address !== undefined) result.address = p.address || null;
    if (p.distance !== undefined) result.distance = p.distance != null ? Number(p.distance) : null;
    if (p.photo !== undefined) result.photo = p.photo || "";
    if (p.meetingPoint !== undefined) result.meetingPoint = p.meetingPoint || "";
    if (p.cancellationPolicy !== undefined) result.cancellationPolicy = p.cancellationPolicy || "";
    if (p.featured !== undefined) result.featured = !!p.featured;
    if (p.isPublished !== undefined) result.isPublished = typeof p.isPublished === "boolean" ? p.isPublished : true;
    if (p.status !== undefined) result.status = p.status || "published";
    if (p.ownerAgent !== undefined) result.ownerAgent = p.ownerAgent || null;
    if (p.agencyRef !== undefined) result.agencyRef = String(p.agencyRef || "");
    if (p.partnerAgencyRef !== undefined) result.partnerAgencyRef = String(p.partnerAgencyRef || "");
    if (p.inventorySource !== undefined) {
        result.inventorySource = ["agent", "provider", "platform"].includes(p.inventorySource) ? p.inventorySource : "platform";
    }
    if (p.providerName !== undefined) result.providerName = String(p.providerName || "");

    if (p.availability !== undefined) {
        result.availability = {
            totalSeats: p.availability.totalSeats == null ? null : Number(p.availability.totalSeats),
            seatsAvailable: p.availability.seatsAvailable == null ? null : Number(p.availability.seatsAvailable),
        };
    }

    if (p.maxGroupSize !== undefined) {
        result.maxGroupSize = Number(p.maxGroupSize);
        if (Number.isNaN(result.maxGroupSize) || result.maxGroupSize < 1) throw new Error("maxGroupSize must be a positive integer");
    }
    if (p.minAge !== undefined) {
        result.minAge = p.minAge != null ? Number(p.minAge) : null;
        if (result.minAge != null && (Number.isNaN(result.minAge) || result.minAge < 0)) throw new Error("minAge must be >= 0");
    }
    if (p.maxAge !== undefined) {
        result.maxAge = p.maxAge != null ? Number(p.maxAge) : null;
        if (result.maxAge != null && (Number.isNaN(result.maxAge) || result.maxAge < 0)) throw new Error("maxAge must be >= 0");
    }

    if (p.photos !== undefined) {
        result.photos = Array.isArray(p.photos) ? p.photos.map(String) : (p.photos ? [String(p.photos)] : []);
    }
    if (p.inclusions !== undefined) {
        result.inclusions = Array.isArray(p.inclusions) ? p.inclusions.map(String) : (p.inclusions ? [String(p.inclusions)] : []);
    }
    if (p.exclusions !== undefined) {
        result.exclusions = Array.isArray(p.exclusions) ? p.exclusions.map(String) : (p.exclusions ? [String(p.exclusions)] : []);
    }
    if (p.languages !== undefined) {
        result.languages = Array.isArray(p.languages) ? p.languages.map(String) : (p.languages ? [String(p.languages)] : []);
    }
    if (p.tags !== undefined) {
        result.tags = Array.isArray(p.tags) ? p.tags.map(String) : (p.tags ? [String(p.tags)] : []);
    }

    if (p.reviews !== undefined) {
        if (!Array.isArray(p.reviews)) throw new Error("reviews must be an array");
        result.reviews = p.reviews.map((r, idx) => {
            if (!r.name || r.rating == null) throw new Error(`reviews[${idx}] requires name and rating`);
            return {
                name: String(r.name),
                rating: Number(r.rating),
                comment: r.comment || "",
            };
        });
    }

    return result;
};

/**
 * Check whether the requesting user can modify (update/delete) the given tour.
 * - Admins can modify any tour.
 * - Partner admins can modify every tour assigned to their agency.
 * - Agents can only modify tours they own (ownerAgent matches their user id).
 */
export const canModifyTour = (user, tour, access = null) => {
    if ((!user && !access?.user) || !tour) return false;

    // loadAccessContext hydrates the current database user and agency. Prefer it
    // over the JWT-shaped req.user, which may not contain agencyRole/agencyId.
    const actor = access?.user || user;
    const role = access?.role || actor?.agencyRole;
    const actorAgencyId = access?.agencyId || actor?.agencyId || user?.agencyId;
    const tourAgencyId = tour.agencyId?._id || tour.agencyId?.id || tour.agencyId;

    // Admin can modify any tour
    if (access?.isMaster || (actor?.role === "admin" && actor?.adminLevel === "master")) return true;

    if (role === "partner_admin" && actorAgencyId && toString(tourAgencyId) === toString(actorAgencyId)) return true;

    // Agent can only modify tours they own AND that are agent-scoped
    if (role === "partner_agent" || actor?.role === "agent") {
        if (!actorAgencyId || toString(tourAgencyId) !== toString(actorAgencyId)) return false;
        const ownerId = toString(tour.ownerAgent?._id || tour.ownerAgent);
        const userId = toString(actor?._id || actor?.sub || actor?.id || user?.sub || user?.id);
        if (ownerId && userId && ownerId === userId) return true;
    }

    return false;
};

/**
 * Extract owner display info from a populated or raw ownerAgent field.
 */
const extractOwnerInfo = (ownerAgent) => {
    if (!ownerAgent) return { ownerAgentName: "", ownerAgentRef: "" };
    if (isObject(ownerAgent) && ownerAgent._id) {
        return {
            ownerAgentName: ownerAgent.name || "",
            ownerAgentRef: ownerAgent.agentRef || "",
        };
    }
    return { ownerAgentName: "", ownerAgentRef: "" };
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
        if (!(req.user?.role === "admin" && req.user?.adminLevel === "master")) {
            query.agencyId = req.user?.agencyId || null;
            if (req.user?.agencyRole !== "partner_admin") query.ownerAgent = req.user?.sub;
        }
        let toursQuery = TourRepository.find(query).sort({ createdAt: -1 });
        if (limit) toursQuery = toursQuery.limit(limit);

        const toursRaw = await toursQuery;

         const tours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
             const tourObj = doc.toObject ? doc.toObject() : doc;
             const priceInfo = buildPriceInfo(doc, dateQuery);
             // Management screens use this collection for View and Edit, so
             // retain the complete schema instead of a display-card projection.
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
        if (!req.access?.isMaster && !req.access?.agency?.productAccess?.includes("trevista")) {
            return sendJson(res, 403, { status: "error", message: "Trevista is not assigned to this agency." }, req);
        }
        if (sanitized.startDate && sanitized.endDate && sanitized.startDate > sanitized.endDate) throw new Error("Tour end date must be after its start date.");
        if (req.user?.role === "agent") {
            sanitized.ownerAgent = req.user.sub || req.user.id || null;
            sanitized.createdBy = req.user.sub || req.user.id || null;
            sanitized.agencyId = req.user.agencyId || null;
            sanitized.agentTour = true;
            sanitized.agentRef = req.user.agentRef || "";
            sanitized.agencyRef = req.user.agencyRef || "";
            sanitized.partnerAgencyRef = req.user.partnerAgencyRef || "";
            sanitized.inventorySource = "agent";
            sanitized.productKey = "trevista";
            if (!canPublishTour(req) && sanitized.status === "published") {
                sanitized.status = "pending_approval";
                sanitized.isPublished = false;
            }
        } else if (req.access?.isMaster) {
            if (req.body.agencyId) sanitized.agencyId = req.body.agencyId;
            sanitized.createdBy = req.user.sub || req.user.id || null;
            sanitized.productKey = "trevista";
        }
        if (req.access?.isMaster && sanitized.status === "published") {
            sanitized.tremVerified = true;
            sanitized.tremVerifiedBy = req.user.sub || req.user.id;
            sanitized.tremVerifiedAt = new Date();
        }

        const newTour = TourRepository.create(sanitized);
        const savedTour = await newTour.save();
        await audit(req, { action: "trip.created", entityType: "Tour", entityId: savedTour._id, agencyId: savedTour.agencyId, after: savedTour.toObject() });

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
        return sendJson(res, error.status || 400, {
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
        const existing = await TourRepository.findById(id);
        if (!existing) {
            return sendJson(res, 404, {
                status: "error",
                message: "Tour not found",
                handler,
            }, req);
        }

        if (!canModifyTour(req.user, existing, req.access)) {
            return sendJson(res, 403, {
                status: "error",
                message: "You do not have permission to modify this tour",
                handler,
            }, req);
        }

        const sanitized = sanitizeTourPayloadForUpdate(req.body);
        assertTourTransition(existing.status, sanitized.status, req);
        const nextStart = sanitized.startDate !== undefined ? sanitized.startDate : existing.startDate;
        const nextEnd = sanitized.endDate !== undefined ? sanitized.endDate : existing.endDate;
        if (nextStart && nextEnd && nextStart > nextEnd) throw new Error("Tour end date must be after its start date.");
        for (const key of ["agencyId", "createdBy", "productKey", "agencyRef", "partnerAgencyRef", "inventorySource"]) delete sanitized[key];
        if (req.access?.isMaster && (sanitized.status || existing.status) === "published") {
            sanitized.tremVerified = true;
            sanitized.tremVerifiedBy = req.user.sub || req.user.id;
            sanitized.tremVerifiedAt = new Date();
        } else if (!req.access?.isMaster) {
            sanitized.tremVerified = false;
            sanitized.tremVerifiedBy = null;
            sanitized.tremVerifiedAt = null;
        }
        if (req.body.ownerAgent !== undefined) {
            const requestedOwnerId = toString(req.body.ownerAgent?._id || req.body.ownerAgent);
            const existingOwnerId = toString(existing.ownerAgent?._id || existing.ownerAgent);
            if (requestedOwnerId === existingOwnerId) delete sanitized.ownerAgent;
            else if (!(req.access?.isMaster || req.access?.role === "partner_admin")) delete sanitized.ownerAgent;
            else if (req.access?.isMaster && !existing.agencyId) sanitized.ownerAgent = null;
            else if (!req.body.ownerAgent) sanitized.ownerAgent = null;
            else {
                const owner = await User.exists({ _id: requestedOwnerId, agencyId: existing.agencyId, agencyRole: "partner_agent", accountStatus: "active", agentApprovalStatus: "approved" });
                if (!owner) return sendJson(res, 400, { status: "error", message: "Tour owner must be an active agent in the same agency." }, req);
                sanitized.ownerAgent = requestedOwnerId;
            }
        }

        const updatedTour = await TourRepository.findByIdAndUpdate(id, sanitized, {
            new: true,
            runValidators: true,
        });
        await audit(req, { action: "trip.updated", entityType: "Tour", entityId: updatedTour._id, agencyId: updatedTour.agencyId, before: existing.toObject(), after: updatedTour.toObject() });

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
        return sendJson(res, error.status || 400, {
            status: "error",
            message: "Failed to update tour",
            handler,
            error: error.message,
        }, req);
    }
};

/** Master-admin approval is explicit and cannot be set through create/update payloads. */
export const verifyTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    if (!req.access?.isMaster) {
        return sendJson(res, 403, { status: "error", message: "Only a master admin can verify a tour.", handler }, req);
    }
    try {
        const tour = await TourRepository.findByIdAndUpdate(req.params.id, {
            tremVerified: true,
            tremVerifiedBy: req.user.sub || req.user.id,
            tremVerifiedAt: new Date(),
        }, { new: true, runValidators: true });
        if (!tour) return sendJson(res, 404, { status: "error", message: "Tour not found.", handler }, req);
        await audit(req, { action: "trip.verified", entityType: "Tour", entityId: tour._id, agencyId: tour.agencyId, after: tour.toObject() });
        const normalized = normalizeTourForResponse(tour.toObject(), buildPriceInfo(tour, new Date()));
        return sendJson(res, 200, { status: "success", component: { data: { tour: normalized, tours: [normalized] } }, message: "Tour verified by TravelsTREM.", handler }, req);
    } catch (error) {
        return sendJson(res, 400, { status: "error", message: error.message || "Could not verify tour.", handler }, req);
    }
};

/**
 * DELETE /tours/:id
 */
export const deleteTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    const { id } = req.params;
    try {
        const existing = await TourRepository.findById(id);
        if (!existing) {
            return sendJson(res, 404, {
                status: "error",
                message: "Tour not found",
                handler,
            }, req);
        }

        if (!canModifyTour(req.user, existing, req.access)) {
            return sendJson(res, 403, {
                status: "error",
                message: "You do not have permission to delete this tour",
                handler,
            }, req);
        }

        const hasBookings = await Booking.exists({ tour: existing._id, deletedAt: null });
        if (!hasBookings && (req.access?.isMaster || ["draft", "pending_approval"].includes(existing.status))) {
            const before = existing.toObject();
            await existing.deleteOne();
            await audit(req, { action: "trip.deleted", entityType: "Tour", entityId: existing._id, agencyId: existing.agencyId, before });
            return sendJson(res, 200, {
                ...pageDefinitionService.buildPageResponse("tours-remote/listing", { injectData: { deletedTourId: id } }),
                message: "Tour permanently deleted successfully",
                handler,
            }, req);
        }
        existing.status = "archived";
        existing.isPublished = false;
        existing.archivedAt = new Date();
        const deletedTour = await existing.save();
        await audit(req, { action: hasBookings ? "trip.archived_with_bookings" : "trip.archived", entityType: "Tour", entityId: existing._id, agencyId: existing.agencyId });

        return sendJson(res, 200, {
            ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                injectData: { deletedTourId: id },
            }),
            message: "Tour archived successfully",
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
        if (!(req.user?.role === "admin" && req.user?.adminLevel === "master")) {
            return sendJson(res, 403, {
                status: "error",
                message: "Only admins can delete all tours",
                handler,
            }, req);
        }
        const result = await TourRepository.updateMany({}, { $set: { status: "archived", isPublished: false, archivedAt: new Date() } });
        return sendJson(res, 200, {
            ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                injectData: { deletedCount: result.modifiedCount || 0 },
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

/**
 * GET /tours/:id/price (getTourPricePreview)
 */
export const getTourPricePreview = async (req, res) => {
    try {
        const { id } = req.params;
        const dateParam = req.query.date || new Date().toISOString();
        const guests = Math.max(1, Number(req.query.guests) || 1);
        const date = new Date(dateParam);

        if (Number.isNaN(date.getTime())) {
            return res.status(400).json({ status: "error", message: "Invalid date" });
        }

        const doc = await TourRepository.findById(id);
        if (!doc) {
            return res.status(404).json({ status: "error", message: "Tour not found" });
        }

        const priceInfo = buildPriceInfo(doc, date);
        const perPerson = priceInfo?.min || 0;
        const total = perPerson * guests;

        return res.status(200).json({
            status: "success",
            componentData: {
                data: {
                    priceSnapshot: {
                        perPerson,
                        total,
                        min: priceInfo?.min,
                        max: priceInfo?.max,
                        currency: priceInfo?.currency || "INR",
                        isFinal: !!priceInfo?.isFinal,
                    },
                },
            },
        });
    } catch (error) {
        console.error("getTourPricePreview error:", error);
        return res.status(500).json({ status: "error", message: "Failed to get price preview" });
    }
};
