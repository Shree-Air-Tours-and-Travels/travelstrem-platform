// modules/tours/controller.js
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const toString = (v) => String(v ?? "");
const displayText = (value, fallback = "") => {
    if (value == null) return fallback;
    if (["string", "number", "boolean"].includes(typeof value))
        return String(value).trim() || fallback;
    if (Array.isArray(value))
        return (
            value
                .map((item) => displayText(item))
                .filter(Boolean)
                .join(", ") || fallback
        );
    if (!isObject(value)) return fallback;
    const direct = value.label ?? value.name ?? value.title;
    if (direct != null && direct !== value) return displayText(direct, fallback);
    const city = displayText(value.city);
    const country = displayText(value.country);
    if (city && country && city.toLowerCase() !== country.toLowerCase())
        return `${city}, ${country}`;
    if (city || country) return city || country;
    const from = displayText(value.from);
    const to = displayText(value.to);
    if (from && to) return `${from} to ${to}`;
    return from || to || fallback;
};
const normalizeCity = (value) => {
    if (!isObject(value)) return displayText(value) || null;
    if (value.from != null || value.to != null) {
        return { ...value, from: displayText(value.from), to: displayText(value.to) };
    }
    return displayText(value) || null;
};
const normalizeAddress = (value) =>
    isObject(value)
        ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, displayText(item)]))
        : null;
const normalizeTextList = (value) =>
    Array.isArray(value) ? value.map((item) => displayText(item)).filter(Boolean) : [];
const fallbackIncludedStays = (tour = {}) => {
    const stays = new Map();
    (Array.isArray(tour.itinerary) ? tour.itinerary : []).forEach((day) => {
        const propertyName = displayText(day?.accommodation);
        if (!propertyName || /^n\/?a$/i.test(propertyName)) return;
        const location = displayText(day?.location, displayText(tour.city?.to));
        const key = `${location}:${propertyName}`;
        const stay = stays.get(key) || {
            nights: 0,
            location,
            propertyName,
            propertyClass: "Standard stay",
            roomType: "Double or twin room",
            meals: [],
            description: "Accommodation included as per the itinerary.",
        };
        stay.nights += 1;
        stay.meals = [...new Set([...stay.meals, ...normalizeTextList(day?.meals)])];
        stays.set(key, stay);
    });
    const totalNights = Math.max(1, Number(tour.period?.nights || 1));
    return [...stays.values()].map((stay) => ({
        ...stay,
        nights: Math.min(stay.nights, totalNights),
    }));
};
const agencySummary = (value) =>
    value && typeof value === "object"
        ? {
              id: value._id || value.id || null,
              name: displayText(value.agencyName),
              reference: value.partnerAgencyRef || "",
              logo: value.logo || "",
              website: value.website || "",
              location: [value.address?.city, value.address?.state, value.address?.country]
                  .map((item) => displayText(item))
                  .filter(Boolean)
                  .join(", "),
          }
        : null;
import TourRepository from "../repositories/TourRepository.js";
import {
    buildManagementTourListQuery,
    buildManagementTourQuery,
    getManagementTourSort,
    isPrivateAgentDraft,
} from "../services/tourVisibility.service.js";
import FinancialEngine from "../../../core/financial-engine/index.js";
import { minorToDecimal } from "../../../core/financial-engine/utils/money.js";
import { getHandlerFromReq } from "../services/tourService.js";
import config from "../../../config/index.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";
import User from "../../auth/models/User.js";
import { audit } from "../../tenancy/audit.service.js";
import { localizeTourImageUrls } from "../../../services/cloudinary.js";
import { syncDerivedTourDeparture } from "../services/tourDepartureSyncService.js";
import { evaluateTourIntelligence } from "../services/tourIntelligence.rules.js";
import { refreshTourIntelligence } from "../services/tourIntelligence.service.js";
import {
    REALTIME_EVENTS,
    publishFanOut,
    publishToCatalog,
    publishToTour,
    realtimeNotify,
    tourDto,
} from "../../../realtime/index.js";
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
    archived: new Set([]),
    cancelled: new Set([]),
};
const canPublishTour = (req) =>
    req.access?.isMaster ||
    req.access?.role === "partner_admin" ||
    req.access?.agency?.settings?.tripPublishingPermissions?.agentCanPublish === true;
const assertTourTransition = (from, to, req) => {
    if (!to || from === to) return;
    if (!TOUR_TRANSITIONS[from]?.has(to))
        throw new Error(`Cannot move tour from ${from} to ${to}.`);
    if (to === "published" && !canPublishTour(req))
        throw Object.assign(
            new Error("This tour must be submitted for approval before publishing."),
            { status: 403 },
        );
};

const sendJson = (res, statusCode, body, req) => {
    if (!IS_DEVELOPMENT) return res.status(statusCode).json(body);

    const q = Number(req?.query?.delayMs);
    const header = Number(req?.headers?.["x-dev-delay"]);
    const delayMs =
        Number.isFinite(q) && !Number.isNaN(q)
            ? q
            : Number.isFinite(header) && !Number.isNaN(header)
              ? header
              : DEFAULT_DELAY_MS;

    if (!delayMs || delayMs <= 0) {
        if (DEBUG)
            console.debug(`[sendJson] dev delay disabled, returning immediately (${statusCode})`);
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
        if (s.min == null || s.max == null)
            throw new Error(`Seasonal pricing at index ${idx} missing min/max`);
        if (Number(s.min) > Number(s.max))
            throw new Error(`Seasonal pricing at index ${idx} has min > max`);
        const start = parseDate(s.startDate);
        const end = parseDate(s.endDate);
        if (!start || !end)
            throw new Error(`Seasonal pricing at index ${idx} missing startDate/endDate`);
        if (start > end)
            throw new Error(`Seasonal pricing '${s.seasonName || idx}' startDate is after endDate`);
        return { start, end, idx, seasonName: s.seasonName || idx };
    });

    normalized.sort((a, b) => a.start - b.start);
    for (let i = 1; i < normalized.length; i++) {
        const prev = normalized[i - 1];
        const curr = normalized[i];
        // If curr.start <= prev.end => overlap (strict overlap not allowed)
        if (curr.start <= prev.end) {
            throw new Error(
                `Seasonal pricing overlap between '${prev.seasonName}' and '${curr.seasonName}'`,
            );
        }
    }
};

const sanitizeIncludedStays = (value) => {
    if (!Array.isArray(value)) throw new Error("includedStays must be an array");
    return value.map((stay) => ({
        nights: Math.max(0, Number(stay?.nights || 0)),
        location: displayText(stay?.location),
        propertyName: displayText(stay?.propertyName),
        propertyClass: displayText(stay?.propertyClass),
        roomType: displayText(stay?.roomType),
        meals: normalizeTextList(stay?.meals),
        description: displayText(stay?.description),
        photos: normalizeTextList(stay?.photos).slice(0, 20),
        amenities: normalizeTextList(stay?.amenities).slice(0, 30),
        tier: ["base", "standard", "premium"].includes(stay?.tier) ? stay.tier : "",
        pricing: sanitizeStayPricing(stay?.pricing, { required: false }),
    }));
};

const STAY_PRICING_UNITS = new Set([
    "PER_PERSON",
    "PER_BOOKING",
    "PER_ROOM",
    "PER_NIGHT",
    "PER_ROOM_PER_NIGHT",
    "PER_PERSON_PER_NIGHT",
]);
const sanitizeStayPricing = (pricing, { required = false } = {}) => {
    if (!pricing || pricing.amountMinor == null || pricing.amountMinor === "") {
        if (required) throw new Error("Room pricing amount is required");
        return { unit: null, amountMinor: null, currency: "INR" };
    }
    const amountMinor = Number(pricing.amountMinor);
    const unit = String(pricing.unit || "PER_ROOM_PER_NIGHT").toUpperCase();
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
        throw new Error("Stay prices must be whole minor units, zero or more");
    if (!STAY_PRICING_UNITS.has(unit)) throw new Error(`Unsupported stay pricing unit: ${unit}`);
    return {
        unit,
        amountMinor,
        currency: String(pricing.currency || "INR")
            .toUpperCase()
            .slice(0, 3),
    };
};

const sanitizeHotelRooms = (rooms, optionIndex) => {
    if (!Array.isArray(rooms)) return [];
    const keys = new Set();
    return rooms.map((room, roomIndex) => {
        const roomKey = displayText(room?.roomKey) || `room-${roomIndex + 1}`;
        if (keys.has(roomKey))
            throw new Error(`hotelOptions[${optionIndex}] has duplicate room key "${roomKey}"`);
        keys.add(roomKey);
        const adults = Number(room?.maxAdults);
        const children = Number(room?.maxChildren);
        return {
            roomKey,
            name: displayText(room?.name) || `Room ${roomIndex + 1}`,
            description: displayText(room?.description),
            bedType: displayText(room?.bedType),
            maxAdults: Number.isFinite(adults) ? Math.max(1, Math.min(20, adults)) : 2,
            maxChildren: Number.isFinite(children) ? Math.max(0, Math.min(20, children)) : 0,
            meals: normalizeTextList(room?.meals).slice(0, 20),
            amenities: normalizeTextList(room?.amenities).slice(0, 30),
            photos: normalizeTextList(room?.photos).slice(0, 20),
            packageKeys: normalizeTextList(room?.packageKeys).slice(0, 10),
            available: room?.available !== false,
            pricing: sanitizeStayPricing(room?.pricing, { required: true }),
        };
    });
};

const sanitizeHotelOptions = (value) => {
    if (!Array.isArray(value)) throw new Error("hotelOptions must be an array");
    const keys = new Set();
    return value
        .map((option, index) => {
            const optionKey = displayText(option?.optionKey) || `hotel-${index + 1}`;
            if (keys.has(optionKey)) throw new Error(`Duplicate hotel option key "${optionKey}"`);
            keys.add(optionKey);
            return {
                optionKey,
                stayKey:
                    displayText(option?.stayKey) ||
                    displayText(option?.location)
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "") ||
                    optionKey,
                title: displayText(option?.title),
                description: displayText(option?.description),
                propertyName: displayText(option?.propertyName),
                propertyClass: displayText(option?.propertyClass),
                location: displayText(option?.location),
                address: displayText(option?.address),
                nights: Math.max(0, Number(option?.nights ?? 1)),
                photos: normalizeTextList(option?.photos).slice(0, 20),
                amenities: normalizeTextList(option?.amenities).slice(0, 30),
                packageKeys: normalizeTextList(option?.packageKeys).slice(0, 10),
                rooms: sanitizeHotelRooms(option?.rooms, index),
                costLabel: displayText(option?.costLabel),
                cost: displayText(option?.cost),
                tier: ["base", "standard", "premium"].includes(option?.tier) ? option.tier : "",
                recommended: Boolean(option?.recommended),
                active: option?.active !== false,
                pricing: sanitizeStayPricing(option?.pricing, { required: false }),
            };
        })
        .filter((option) => option.title);
};

const sanitizeCommercial = (value, { allowIncomplete = false } = {}) => {
    if (!value || value.version !== "COMPONENTS_V1") return { version: "LEGACY" };
    const components = Array.isArray(value.components)
        ? value.components.map((component, index) => ({
              componentKey: displayText(component.componentKey) || `component-${index + 1}`,
              type: displayText(component.type).toUpperCase(),
              name: displayText(component.name),
              description: displayText(component.description),
              supplierRef: displayText(component.supplierRef),
              replacesComponentKey: displayText(component.replacesComponentKey),
              active: component.active !== false,
              status: displayText(component.status, "CONFIRMED").toUpperCase(),
              pricing: {
                  unit: displayText(component.pricing?.unit, "PER_BOOKING").toUpperCase(),
                  costAmountMinor: Number(component.pricing?.costAmountMinor),
                  // Selling totals are derived from cost + the tour pricing policy.
                  // Keep this compatibility field aligned with cost; never trust it
                  // as a client-authored total.
                  sellingAmountMinor: Number(component.pricing?.costAmountMinor),
                  currency: displayText(
                      component.pricing?.currency || value.currency,
                      "INR",
                  ).toUpperCase(),
              },
              details: isObject(component.details) ? component.details : null,
          }))
        : [];
    const keys = components.map((item) => item.componentKey);
    if (new Set(keys).size !== keys.length)
        throw new Error("Commercial component keys must be unique");
    components.forEach((component) => {
        if (!component.name)
            throw new Error(`Commercial component '${component.componentKey}' requires a name`);
        if (
            !Number.isSafeInteger(component.pricing.costAmountMinor) ||
            component.pricing.costAmountMinor < 0
        )
            throw new Error(`${component.componentKey} cost must be integer paise`);
    });
    const packages = Array.isArray(value.packages)
        ? value.packages.map((item, index) => ({
              packageKey: displayText(item.packageKey) || `package-${index + 1}`,
              tier: displayText(item.tier).toUpperCase(),
              name: displayText(item.name),
              description: displayText(item.description),
              enabled: item.enabled !== false,
              recommended: Boolean(item.recommended),
              includedComponentKeys: [
                  ...new Set((item.includedComponentKeys || []).map(String).filter(Boolean)),
              ],
              optionalComponentKeys: [
                  ...new Set((item.optionalComponentKeys || []).map(String).filter(Boolean)),
              ],
          }))
        : [];
    const enabled = packages.filter((item) => item.enabled);
    if (!allowIncomplete && (enabled.length < 2 || enabled.length > 3))
        throw new Error("Choose two or three enabled commercial packages");
    if (new Set(packages.map((item) => item.packageKey)).size !== packages.length)
        throw new Error("Commercial package keys must be unique");
    const known = new Set(keys);
    packages.forEach((item) => {
        if (!item.name || !["BASIC", "STANDARD", "PREMIUM"].includes(item.tier))
            throw new Error(`Commercial package '${item.packageKey}' needs a valid tier and name`);
        const optionalKeys = new Set(item.optionalComponentKeys);
        const duplicateAssignment = item.includedComponentKeys.find((key) => optionalKeys.has(key));
        if (duplicateAssignment)
            throw new Error(
                `Commercial package '${item.packageKey}' cannot include '${duplicateAssignment}' as both included and optional`,
            );
        [...item.includedComponentKeys, ...item.optionalComponentKeys].forEach((key) => {
            if (!known.has(key))
                throw new Error(
                    `Commercial package '${item.packageKey}' references missing component '${key}'`,
                );
        });
    });
    const basis = value.defaultBasis || {};
    const submittedPolicy = value.pricingPolicy || {};
    const pricingPolicy = {
        feeType: displayText(submittedPolicy.feeType, "PERCENTAGE").toUpperCase(),
        feePercent: Number(submittedPolicy.feePercent ?? 10),
        feeAmountMinor: Number(submittedPolicy.feeAmountMinor ?? 0),
        gstPercent: Number(submittedPolicy.gstPercent ?? 18),
        gstOn: "AGENT_FEE",
    };
    if (!["PERCENTAGE", "FIXED"].includes(pricingPolicy.feeType))
        throw new Error("Agent fee method must be percentage or fixed");
    if (
        !Number.isFinite(pricingPolicy.feePercent) ||
        pricingPolicy.feePercent < 0 ||
        pricingPolicy.feePercent > 100
    )
        throw new Error("Agent fee percentage must be between 0 and 100");
    if (!Number.isSafeInteger(pricingPolicy.feeAmountMinor) || pricingPolicy.feeAmountMinor < 0)
        throw new Error("Fixed agent fee must be integer paise");
    if (
        !Number.isFinite(pricingPolicy.gstPercent) ||
        pricingPolicy.gstPercent < 0 ||
        pricingPolicy.gstPercent > 100
    )
        throw new Error("GST percentage must be between 0 and 100");
    return {
        version: "COMPONENTS_V1",
        currency: displayText(value.currency, "INR").toUpperCase(),
        components,
        packages,
        pricingPolicy,
        defaultBasis: {
            adults: Number(basis.adults ?? 1),
            children: Number(basis.children ?? 0),
            infants: Number(basis.infants ?? 0),
            rooms: Number(basis.rooms ?? 1),
            vehicles: Number(basis.vehicles ?? 1),
            nights: Number(basis.nights ?? 1),
            days: Number(basis.days ?? 1),
        },
    };
};

export const applyDerivedCommercialPrice = async (tour, req) => {
    if (tour.commercial?.version !== "COMPONENTS_V1") return tour;
    const summaries = [];
    for (const packageOption of tour.commercial.packages.filter((item) => item.enabled !== false)) {
        const result = await FinancialEngine.calculateBookingFinancials({
            tour,
            packageKey: packageOption.packageKey,
            selections: tour.commercial.defaultBasis,
            context: {
                agencyId: req?.access?.agencyId || req?.user?.agencyId || tour.agencyId,
                tourId: tour._id || null,
            },
        });
        summaries.push({
            packageKey: packageOption.packageKey,
            tier: packageOption.tier,
            name: packageOption.name,
            costTotalMinor: result.commercial.costTotalMinor,
            sellingTotalMinor: result.commercial.sellingTotalMinor,
            agentFeeMinor: result.commercial.agentFeeMinor || 0,
            agentGstMinor: result.commercial.agentGstMinor || 0,
            marginMinor: result.commercial.componentMarginMinor,
            requiresRepricing: result.commercial.requiresRepricing,
        });
    }
    const amounts = summaries.map((item) => item.sellingTotalMinor);
    const minAmountMinor = Math.min(...amounts);
    const maxAmountMinor = Math.max(...amounts);
    const publishing = tour.status === "published";
    const hasFlights =
        tour.flights?.included === true ||
        (tour.commercial.components || []).some(
            (component) => component.active !== false && component.type === "FLIGHT",
        );
    const fixedWithFlights = tour.packageType === "fixed_departure" && hasFlights;
    if (publishing && fixedWithFlights && summaries.length !== 3)
        throw new Error(
            "Fixed-departure tours with flights require Base, Standard and Premium prices",
        );
    if (publishing && maxAmountMinor <= 0)
        throw new Error(
            "Published component-priced tours require a positive calculated selling price",
        );
    if (publishing && summaries.some((item) => item.marginMinor < 0))
        throw new Error("Published packages cannot have a negative component margin");
    const displayMode =
        tour.packageType === "custom"
            ? "STARTING_FROM"
            : fixedWithFlights && !summaries.some((item) => item.requiresRepricing)
              ? "FINAL"
              : "ESTIMATED";
    tour.commercial.derived = {
        minAmountMinor,
        maxAmountMinor,
        displayMode,
        packages: summaries,
        calculatedAt: new Date(),
    };
    tour.price = {
        min: Number(minorToDecimal(minAmountMinor)),
        max: Number(minorToDecimal(maxAmountMinor)),
        currency: tour.commercial.currency || "INR",
        isFinal: displayMode === "FINAL",
        source: "calculated",
    };
    if (tour.packageType === "fixed_departure" && Array.isArray(tour.departures)) {
        tour.departures = tour.departures.map((departure) => ({
            ...(departure?.toObject?.() || departure),
            pricing: {
                currency: tour.price.currency,
                min: tour.price.min,
                max: tour.price.max,
                isFinal: tour.price.isFinal,
                source: "component_calculation",
            },
        }));
    }
    return tour;
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

    const bySlug = await TourRepository.findOne({ slug: slugifyTourTitle(ref) });
    if (bySlug) return bySlug;

    const titleCandidate = ref.replace(/-/g, " ").trim();
    const directTitle = await TourRepository.findOne({
        title: new RegExp(`^${escapeRegExp(titleCandidate)}$`, "i"),
    });
    if (directTitle) return directTitle;

    const tours = await TourRepository.find(
        {},
        "title city address distance period startDate endDate photo photos desc price commercial seasonalPricing itinerary highlights includedStays hotelOptions cancellation extras availability flights meetingPoint inclusions exclusions languages cancellationPolicy minAge maxAge maxGroupSize reviews featured tags isPublished status builderProcess ownerAgent createdAt updatedAt",
    );
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
export const normalizeTourForResponse = (
    tourObj = {},
    priceInfo = null,
    { includeCommercialCosts = false, includeBuilderProcess = false } = {},
) => {
    const normalizedId = toString(tourObj._id || tourObj.id) || null;
    const agency =
        agencySummary(tourObj.agencyId) ||
        (displayText(tourObj.providerName)
            ? {
                  id: null,
                  name: displayText(tourObj.providerName),
                  reference: displayText(tourObj.partnerAgencyRef ?? tourObj.agencyRef),
                  logo: "",
                  website: "",
                  location: "",
              }
            : null);
    const ownerInfo = extractOwnerInfo(tourObj.ownerAgent);
    const includedStays =
        Array.isArray(tourObj.includedStays) && tourObj.includedStays.length
            ? tourObj.includedStays
            : fallbackIncludedStays(tourObj);
    const hotelOptions =
        Array.isArray(tourObj.hotelOptions) && tourObj.hotelOptions.length
            ? tourObj.hotelOptions
            : [];

    // defensive defaults
    return {
        _id: normalizedId,
        id: normalizedId,
        title: displayText(tourObj.title),
        city: normalizeCity(tourObj.city),
        address: normalizeAddress(tourObj.address),
        distance:
            typeof tourObj.distance === "number"
                ? tourObj.distance
                : tourObj.distance
                  ? Number(tourObj.distance)
                  : null,
        period: tourObj.period || null,
        startDate: tourObj.startDate || null,
        endDate: tourObj.endDate || null,
        photo: tourObj.photo || "",
        photos: Array.isArray(tourObj.photos)
            ? tourObj.photos
            : tourObj.photos
              ? [tourObj.photos]
              : [],
        desc: displayText(tourObj.desc ?? tourObj.description),
        price: tourObj.price || null,
        commercial:
            tourObj.commercial?.version === "COMPONENTS_V1"
                ? {
                      ...tourObj.commercial,
                      pricingPolicy: includeCommercialCosts
                          ? tourObj.commercial.pricingPolicy
                          : undefined,
                      components: (tourObj.commercial.components || []).map((component) =>
                          includeCommercialCosts
                              ? component
                              : {
                                    ...component,
                                    supplierRef: undefined,
                                    pricing: { ...component.pricing, costAmountMinor: undefined },
                                },
                      ),
                      derived: includeCommercialCosts
                          ? tourObj.commercial.derived
                          : {
                                ...tourObj.commercial.derived,
                                packages: (tourObj.commercial.derived?.packages || []).map(
                                    ({ costTotalMinor, marginMinor, ...item }) => item,
                                ),
                            },
                  }
                : { version: "LEGACY" },
        packageType: tourObj.packageType || "fixed_departure",
        departures: Array.isArray(tourObj.departures) ? tourObj.departures : [],
        flexibleConfig: tourObj.flexibleConfig || null,
        customConfig: tourObj.customConfig || null,
        seasonalPricing: Array.isArray(tourObj.seasonalPricing) ? tourObj.seasonalPricing : [],
        itinerary: Array.isArray(tourObj.itinerary)
            ? tourObj.itinerary.map((item) => ({
                  ...item,
                  title: displayText(item?.title),
                  summary: displayText(item?.summary),
                  activities: normalizeTextList(item?.activities),
                  meals: normalizeTextList(item?.meals),
                  accommodation: displayText(item?.accommodation),
                  location: displayText(item?.location),
                  notes: displayText(item?.notes),
              }))
            : [],
        highlights: Array.isArray(tourObj.highlights)
            ? tourObj.highlights.map((item) => ({
                  ...item,
                  title: displayText(item?.title),
                  short: displayText(item?.short),
              }))
            : [],
        includedStays: includedStays.map((stay) => ({
            ...stay,
            location: displayText(stay?.location),
            propertyName: displayText(stay?.propertyName),
            propertyClass: displayText(stay?.propertyClass),
            roomType: displayText(stay?.roomType),
            meals: normalizeTextList(stay?.meals),
            description: displayText(stay?.description),
        })),
        hotelOptions,
        cancellation: tourObj.cancellation || null,
        extras: Array.isArray(tourObj.extras) ? tourObj.extras : [],
        availability: tourObj.availability || { totalSeats: null, seatsAvailable: null },
        flights: tourObj.flights || { included: false, inventoryManaged: false },
        meetingPoint: displayText(tourObj.meetingPoint),
        inclusions: normalizeTextList(tourObj.inclusions),
        exclusions: normalizeTextList(tourObj.exclusions),
        languages: normalizeTextList(tourObj.languages),
        cancellationPolicy: displayText(tourObj.cancellationPolicy),
        minAge:
            typeof tourObj.minAge === "number"
                ? tourObj.minAge
                : tourObj.minAge
                  ? Number(tourObj.minAge)
                  : null,
        maxAge:
            typeof tourObj.maxAge === "number"
                ? tourObj.maxAge
                : tourObj.maxAge
                  ? Number(tourObj.maxAge)
                  : null,
        maxGroupSize: tourObj.maxGroupSize || null,
        reviews: Array.isArray(tourObj.reviews) ? tourObj.reviews : [],
        featured: !!tourObj.featured,
        trending: !!tourObj.trending,
        featuredRequest: tourObj.featuredRequest || { requested: false, status: "not_requested" },
        intelligence: tourObj.intelligence || { qualityScore: 0 },
        metrics: tourObj.metrics || {},
        tags: normalizeTextList(tourObj.tags),
        // Kept in the response temporarily for older clients; status is authoritative.
        isPublished: tourObj.status === "published",
        status: tourObj.status || "published",
        ...(includeBuilderProcess ? { builderProcess: tourObj.builderProcess || null } : {}),
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
        agency,
        operator: ownerInfo.ownerAgentName
            ? {
                  name: ownerInfo.ownerAgentName,
                  email: ownerInfo.ownerAgentEmail,
              }
            : null,
        ...ownerInfo,
        createdAt: tourObj.createdAt || null,
        updatedAt: tourObj.updatedAt || null,
        avgRating:
            tourObj.avgRating != null
                ? tourObj.avgRating
                : Array.isArray(tourObj.reviews) && tourObj.reviews.length
                  ? (
                        tourObj.reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) /
                        tourObj.reviews.length
                    ).toFixed(1)
                  : 0,
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
    for (const key of [
        "_id",
        "id",
        "__v",
        "createdAt",
        "updatedAt",
        "tremVerified",
        "tremVerifiedBy",
        "tremVerifiedAt",
        "createdBy",
    ])
        delete p[key];

    // Required fields
    if (!p.title) throw new Error("Missing required field: title");
    if (!p.desc && !p.description) throw new Error("Missing required field: desc/description");

    p.commercial = sanitizeCommercial(p.commercial);
    // Legacy tours accept a manual range. Component tours derive this projection server-side.
    if (!p.price && p.commercial.version === "COMPONENTS_V1")
        p.price = { min: 0, max: 0, currency: p.commercial.currency, source: "calculated" };
    if (!p.price) throw new Error("Missing price object (price.min & price.max required)");
    if (p.price.min == null || p.price.max == null)
        throw new Error("price.min and price.max are required");
    p.price = {
        min: Number(p.price.min),
        max: Number(p.price.max),
        currency: p.price.currency || "INR",
        isFinal: !!p.price.isFinal,
        source: p.price.source || "manual",
    };
    if (Number.isNaN(p.price.min) || Number.isNaN(p.price.max))
        throw new Error("price.min or price.max is not a number");
    if (p.price.min > p.price.max) throw new Error("price.min cannot be greater than price.max");

    // Seasonal pricing
    if (p.seasonalPricing) {
        if (!Array.isArray(p.seasonalPricing)) throw new Error("seasonalPricing must be an array");
        p.seasonalPricing = p.seasonalPricing.map((s, idx) => {
            if (s.min == null || s.max == null)
                throw new Error(`seasonalPricing[${idx}] requires min & max`);
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
            if (Number.isNaN(day) || day < 1)
                throw new Error(`itinerary[${idx}].day must be a positive integer`);
            return {
                day,
                title: it.title || "",
                summary: it.summary || "",
                activities: Array.isArray(it.activities)
                    ? it.activities.map(String)
                    : it.activities
                      ? [String(it.activities)]
                      : [],
                meals: Array.isArray(it.meals)
                    ? it.meals.map(String)
                    : it.meals
                      ? [String(it.meals)]
                      : [],
                accommodation: it.accommodation || "",
                location: it.location || "",
                notes: it.notes || "",
            };
        });
        const days = p.itinerary.map((i) => i.day);
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
            order: Number.isFinite(Number(h.order)) ? Number(h.order) : h.order === 0 ? 0 : idx,
        }));
        p.highlights.sort((a, b) => a.order - b.order);
    }

    // Period
    if (p.period) {
        p.period = {
            days: Number(p.period.days),
            nights: Number(p.period.nights),
        };
        if (Number.isNaN(p.period.days) || Number(p.period.days) < 1)
            throw new Error("period.days must be a positive integer");
        if (Number.isNaN(p.period.nights) || Number(p.period.nights) < 0)
            throw new Error("period.nights must be a non-negative integer");
    }

    // Dates
    if (p.startDate) p.startDate = parseDate(p.startDate);
    if (p.endDate) p.endDate = parseDate(p.endDate);

    // Availability
    if (p.availability) {
        p.availability = {
            totalSeats:
                p.availability.totalSeats == null ? null : Number(p.availability.totalSeats),
            seatsAvailable:
                p.availability.seatsAvailable == null
                    ? null
                    : Number(p.availability.seatsAvailable),
        };
    }
    p.flights = {
        ...p.flights,
        included: Boolean(p.flights?.included),
        inventoryManaged: Boolean(p.flights?.included && p.flights?.inventoryManaged),
        pricePerPerson: Number(p.flights?.pricePerPerson || 0),
        currency: displayText(p.flights?.currency, "INR"),
        departureCity: displayText(p.flights?.departureCity),
        arrivalCity: displayText(p.flights?.arrivalCity),
        airline: displayText(p.flights?.airline),
        notes: displayText(p.flights?.notes),
    };

    // Simple number validations
    if (p.maxGroupSize != null) {
        p.maxGroupSize = Number(p.maxGroupSize);
        if (Number.isNaN(p.maxGroupSize) || p.maxGroupSize < 1)
            throw new Error("maxGroupSize must be a positive integer");
    }
    if (p.minAge != null) {
        p.minAge = Number(p.minAge);
        if (Number.isNaN(p.minAge) || p.minAge < 0) throw new Error("minAge must be >= 0");
    }
    if (p.maxAge != null) {
        p.maxAge = Number(p.maxAge);
        if (Number.isNaN(p.maxAge) || p.maxAge < 0) throw new Error("maxAge must be >= 0");
    }

    // Reviews are platform-owned and will be written only by the completed-
    // booking review journey. Tour authors cannot seed or replace them.
    delete p.reviews;

    // Other arrays/strings
    p.photos = Array.isArray(p.photos) ? p.photos.map(String) : p.photos ? [String(p.photos)] : [];
    p.inclusions = Array.isArray(p.inclusions)
        ? p.inclusions.map(String)
        : p.inclusions
          ? [String(p.inclusions)]
          : [];
    p.exclusions = Array.isArray(p.exclusions)
        ? p.exclusions.map(String)
        : p.exclusions
          ? [String(p.exclusions)]
          : [];
    p.languages = Array.isArray(p.languages)
        ? p.languages.map(String)
        : p.languages
          ? [String(p.languages)]
          : [];
    p.tags = Array.isArray(p.tags) ? p.tags.map(String) : p.tags ? [String(p.tags)] : [];
    p.includedStays = p.includedStays === undefined ? [] : sanitizeIncludedStays(p.includedStays);
    p.hotelOptions = p.hotelOptions === undefined ? [] : sanitizeHotelOptions(p.hotelOptions);
    p.featured = !!p.featured;
    p.status = p.status || "published";
    // Legacy storage mirror only. Clients control publication through status.
    p.isPublished = p.status === "published";
    p.inventorySource = ["agent", "provider", "platform"].includes(p.inventorySource)
        ? p.inventorySource
        : "platform";

    // Package type
    const validPackageTypes = ["fixed_departure", "flexible", "custom"];
    p.packageType = validPackageTypes.includes(p.packageType) ? p.packageType : "fixed_departure";

    // Departures for fixed departure tours
    if (Array.isArray(p.departures)) {
        p.departures = p.departures
            .map((dep, idx) => ({
                label: dep.label || `Departure ${idx + 1}`,
                departureDate: parseDate(dep.departureDate),
                returnDate: parseDate(dep.returnDate),
                status: ["scheduled", "active", "sold_out", "cancelled", "completed"].includes(
                    dep.status,
                )
                    ? dep.status
                    : "active",
                capacity: dep.capacity == null ? null : Math.max(0, Number(dep.capacity)),
                seatsAvailable:
                    dep.seatsAvailable == null ? null : Math.max(0, Number(dep.seatsAvailable)),
                pricing: {
                    min: Number(dep.pricing?.min || dep.min || p.price?.min || 0),
                    max: Number(dep.pricing?.max || dep.max || p.price?.max || 0),
                    currency: dep.pricing?.currency || p.price?.currency || "INR",
                    isFinal: !!dep.pricing?.isFinal,
                    source: dep.pricing?.source || "manual",
                },
                bookingOpensAt: dep.bookingOpensAt ? parseDate(dep.bookingOpensAt) : null,
                bookingClosesAt: dep.bookingClosesAt ? parseDate(dep.bookingClosesAt) : null,
                notes: dep.notes || "",
            }))
            .filter((dep) => dep.departureDate && dep.returnDate);
    } else {
        p.departures = [];
    }

    // Flexible config
    if (p.flexibleConfig && typeof p.flexibleConfig === "object") {
        p.flexibleConfig = {
            earliestDeparture: p.flexibleConfig.earliestDeparture
                ? parseDate(p.flexibleConfig.earliestDeparture)
                : null,
            latestReturn: p.flexibleConfig.latestReturn
                ? parseDate(p.flexibleConfig.latestReturn)
                : null,
            blackoutDates: Array.isArray(p.flexibleConfig.blackoutDates)
                ? p.flexibleConfig.blackoutDates.map(parseDate).filter(Boolean)
                : [],
            pricingModel: ["seasonal", "fixed", "on_request"].includes(
                p.flexibleConfig.pricingModel,
            )
                ? p.flexibleConfig.pricingModel
                : "seasonal",
            minAdvanceBookingDays: Math.max(0, Number(p.flexibleConfig.minAdvanceBookingDays || 0)),
            maxAdvanceBookingDays:
                p.flexibleConfig.maxAdvanceBookingDays == null
                    ? null
                    : Math.max(0, Number(p.flexibleConfig.maxAdvanceBookingDays)),
        };
    }

    // Custom config
    if (p.customConfig && typeof p.customConfig === "object") {
        p.customConfig = {
            responseTimeframeHours: Math.max(
                1,
                Number(p.customConfig.responseTimeframeHours || 48),
            ),
            requireDates:
                typeof p.customConfig.requireDates === "boolean"
                    ? p.customConfig.requireDates
                    : true,
            requireGroupSize:
                typeof p.customConfig.requireGroupSize === "boolean"
                    ? p.customConfig.requireGroupSize
                    : true,
            allowAgentDraft:
                typeof p.customConfig.allowAgentDraft === "boolean"
                    ? p.customConfig.allowAgentDraft
                    : true,
            allowCustomerCustomization: p.customConfig.allowCustomerCustomization === true,
            questionnaireFields: Array.isArray(p.customConfig.questionnaireFields)
                ? p.customConfig.questionnaireFields.map(String)
                : [],
        };
    }

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
        commercial: p.commercial,
        packageType: p.packageType,
        departures: p.departures,
        flexibleConfig: p.flexibleConfig || null,
        customConfig: p.customConfig || null,
        seasonalPricing: p.seasonalPricing || [],
        itinerary: p.itinerary || [],
        highlights: p.highlights || [],
        includedStays: p.includedStays,
        hotelOptions: p.hotelOptions,
        availability: p.availability || { totalSeats: null, seatsAvailable: null },
        flights: p.flights,
        meetingPoint: p.meetingPoint || "",
        inclusions: p.inclusions || [],
        exclusions: p.exclusions || [],
        languages: p.languages || [],
        cancellationPolicy: p.cancellationPolicy || "",
        minAge: p.minAge != null ? p.minAge : null,
        maxAge: p.maxAge != null ? p.maxAge : null,
        maxGroupSize: p.maxGroupSize != null ? p.maxGroupSize : null,
        featuredRequest: { requested: p.featuredRequest?.requested === true },
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
 * sanitizeTourPayloadForUpdate(raw, options)
 * - Only processes fields that are present in `raw`
 * - Does NOT throw on missing required fields (title, desc, price)
 * - Returns only the fields that were sent, safe for partial PUT
 * - options.allowIncompleteCommercial: permits a component-priced commercial
 *   block that does not yet have two or three enabled packages (draft checkpoints)
 */
export const sanitizeTourPayloadForUpdate = (
    raw = {},
    { allowIncompleteCommercial = false } = {},
) => {
    const p = { ...raw };
    for (const key of [
        "_id",
        "id",
        "__v",
        "createdAt",
        "updatedAt",
        "tremVerified",
        "tremVerifiedBy",
        "tremVerifiedAt",
        "createdBy",
    ])
        delete p[key];
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
        if (p.price.min == null || p.price.max == null)
            throw new Error("price.min and price.max are required");
        result.price = {
            min: Number(p.price.min),
            max: Number(p.price.max),
            currency: p.price.currency || "INR",
            isFinal: !!p.price.isFinal,
            source: p.price.source || "manual",
        };
        if (Number.isNaN(result.price.min) || Number.isNaN(result.price.max))
            throw new Error("price.min or price.max is not a number");
        if (result.price.min > result.price.max)
            throw new Error("price.min cannot be greater than price.max");
    }

    if (p.commercial !== undefined)
        result.commercial = sanitizeCommercial(p.commercial, {
            allowIncomplete: allowIncompleteCommercial,
        });

    if (p.seasonalPricing !== undefined) {
        if (!Array.isArray(p.seasonalPricing)) throw new Error("seasonalPricing must be an array");
        result.seasonalPricing = p.seasonalPricing.map((s, idx) => {
            if (s.min == null || s.max == null)
                throw new Error(`seasonalPricing[${idx}] requires min & max`);
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
            if (Number.isNaN(day) || day < 1)
                throw new Error(`itinerary[${idx}].day must be a positive integer`);
            return {
                day,
                title: it.title || "",
                summary: it.summary || "",
                activities: Array.isArray(it.activities)
                    ? it.activities.map(String)
                    : it.activities
                      ? [String(it.activities)]
                      : [],
                meals: Array.isArray(it.meals)
                    ? it.meals.map(String)
                    : it.meals
                      ? [String(it.meals)]
                      : [],
                accommodation: it.accommodation || "",
                location: it.location || "",
                notes: it.notes || "",
            };
        });
        const days = result.itinerary.map((i) => i.day);
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
            order: Number.isFinite(Number(h.order)) ? Number(h.order) : h.order === 0 ? 0 : idx,
        }));
        result.highlights.sort((a, b) => a.order - b.order);
    }

    if (p.includedStays !== undefined) {
        result.includedStays = sanitizeIncludedStays(p.includedStays);
    }

    if (p.hotelOptions !== undefined) {
        result.hotelOptions = sanitizeHotelOptions(p.hotelOptions);
    }

    if (p.period !== undefined) {
        result.period = {
            days: Number(p.period.days),
            nights: Number(p.period.nights),
        };
        if (Number.isNaN(result.period.days) || result.period.days < 1)
            throw new Error("period.days must be a positive integer");
        if (Number.isNaN(result.period.nights) || result.period.nights < 0)
            throw new Error("period.nights must be a non-negative integer");
    }

    if (p.startDate !== undefined) result.startDate = p.startDate ? parseDate(p.startDate) : null;
    if (p.endDate !== undefined) result.endDate = p.endDate ? parseDate(p.endDate) : null;

    if (p.city !== undefined) result.city = p.city || null;
    if (p.address !== undefined) result.address = p.address || null;
    if (p.distance !== undefined) result.distance = p.distance != null ? Number(p.distance) : null;
    if (p.photo !== undefined) result.photo = p.photo || "";
    if (p.meetingPoint !== undefined) result.meetingPoint = p.meetingPoint || "";
    if (p.cancellationPolicy !== undefined) result.cancellationPolicy = p.cancellationPolicy || "";
    if (p.featuredRequest !== undefined) {
        result.featuredRequest = { requested: p.featuredRequest?.requested === true };
    }
    if (p.group !== undefined) {
        const min = p.group?.min == null ? 1 : Number(p.group.min);
        const max = p.group?.max == null ? null : Number(p.group.max);
        if (!Number.isFinite(min) || min < 1) throw new Error("group.min must be at least 1");
        if (max != null && (!Number.isFinite(max) || max < min))
            throw new Error("group.max must be greater than or equal to group.min");
        result.group = { min, max };
    }
    if (p.status !== undefined) {
        const status = String(p.status || "draft");
        if (!Object.prototype.hasOwnProperty.call(TOUR_TRANSITIONS, status))
            throw new Error(`Invalid tour status: ${status}`);
        result.status = status;
        // Keep the legacy field synchronized without exposing a second control.
        result.isPublished = result.status === "published";
    }
    if (p.ownerAgent !== undefined) result.ownerAgent = p.ownerAgent || null;
    if (p.agencyRef !== undefined) result.agencyRef = String(p.agencyRef || "");
    if (p.partnerAgencyRef !== undefined)
        result.partnerAgencyRef = String(p.partnerAgencyRef || "");
    if (p.inventorySource !== undefined) {
        result.inventorySource = ["agent", "provider", "platform"].includes(p.inventorySource)
            ? p.inventorySource
            : "platform";
    }
    if (p.providerName !== undefined) result.providerName = String(p.providerName || "");

    if (p.availability !== undefined) {
        result.availability = {
            totalSeats:
                p.availability.totalSeats == null ? null : Number(p.availability.totalSeats),
            seatsAvailable:
                p.availability.seatsAvailable == null
                    ? null
                    : Number(p.availability.seatsAvailable),
        };
    }
    if (p.flights !== undefined) {
        result.flights = {
            ...p.flights,
            included: Boolean(p.flights?.included),
            inventoryManaged: Boolean(p.flights?.included && p.flights?.inventoryManaged),
            pricePerPerson: Number(p.flights?.pricePerPerson || 0),
            currency: displayText(p.flights?.currency, "INR"),
            departureCity: displayText(p.flights?.departureCity),
            arrivalCity: displayText(p.flights?.arrivalCity),
            airline: displayText(p.flights?.airline),
            notes: displayText(p.flights?.notes),
        };
    }

    if (p.maxGroupSize !== undefined) {
        result.maxGroupSize = Number(p.maxGroupSize);
        if (Number.isNaN(result.maxGroupSize) || result.maxGroupSize < 1)
            throw new Error("maxGroupSize must be a positive integer");
    }
    if (p.minAge !== undefined) {
        result.minAge = p.minAge != null ? Number(p.minAge) : null;
        if (result.minAge != null && (Number.isNaN(result.minAge) || result.minAge < 0))
            throw new Error("minAge must be >= 0");
    }
    if (p.maxAge !== undefined) {
        result.maxAge = p.maxAge != null ? Number(p.maxAge) : null;
        if (result.maxAge != null && (Number.isNaN(result.maxAge) || result.maxAge < 0))
            throw new Error("maxAge must be >= 0");
    }

    if (p.photos !== undefined) {
        result.photos = Array.isArray(p.photos)
            ? p.photos.map(String)
            : p.photos
              ? [String(p.photos)]
              : [];
    }
    if (p.inclusions !== undefined) {
        result.inclusions = Array.isArray(p.inclusions)
            ? p.inclusions.map(String)
            : p.inclusions
              ? [String(p.inclusions)]
              : [];
    }
    if (p.exclusions !== undefined) {
        result.exclusions = Array.isArray(p.exclusions)
            ? p.exclusions.map(String)
            : p.exclusions
              ? [String(p.exclusions)]
              : [];
    }
    if (p.languages !== undefined) {
        result.languages = Array.isArray(p.languages)
            ? p.languages.map(String)
            : p.languages
              ? [String(p.languages)]
              : [];
    }
    if (p.tags !== undefined) {
        result.tags = Array.isArray(p.tags) ? p.tags.map(String) : p.tags ? [String(p.tags)] : [];
    }

    // Package type
    if (p.packageType !== undefined) {
        const validPackageTypes = ["fixed_departure", "flexible", "custom"];
        result.packageType = validPackageTypes.includes(p.packageType)
            ? p.packageType
            : "fixed_departure";
    }

    // Departures for fixed departure tours
    if (p.departures !== undefined) {
        if (!Array.isArray(p.departures)) throw new Error("departures must be an array");
        result.departures = p.departures
            .map((dep, idx) => ({
                label: dep.label || `Departure ${idx + 1}`,
                departureDate: parseDate(dep.departureDate),
                returnDate: parseDate(dep.returnDate),
                status: ["scheduled", "active", "sold_out", "cancelled", "completed"].includes(
                    dep.status,
                )
                    ? dep.status
                    : "active",
                capacity: dep.capacity == null ? null : Math.max(0, Number(dep.capacity)),
                seatsAvailable:
                    dep.seatsAvailable == null ? null : Math.max(0, Number(dep.seatsAvailable)),
                pricing: {
                    min: Number(dep.pricing?.min || dep.min || 0),
                    max: Number(dep.pricing?.max || dep.max || 0),
                    currency: dep.pricing?.currency || "INR",
                    isFinal: !!dep.pricing?.isFinal,
                    source: dep.pricing?.source || "manual",
                },
                bookingOpensAt: dep.bookingOpensAt ? parseDate(dep.bookingOpensAt) : null,
                bookingClosesAt: dep.bookingClosesAt ? parseDate(dep.bookingClosesAt) : null,
                notes: dep.notes || "",
            }))
            .filter((dep) => dep.departureDate && dep.returnDate);
    }

    // Flexible config
    if (p.flexibleConfig !== undefined) {
        if (p.flexibleConfig && typeof p.flexibleConfig === "object") {
            result.flexibleConfig = {
                earliestDeparture: p.flexibleConfig.earliestDeparture
                    ? parseDate(p.flexibleConfig.earliestDeparture)
                    : null,
                latestReturn: p.flexibleConfig.latestReturn
                    ? parseDate(p.flexibleConfig.latestReturn)
                    : null,
                blackoutDates: Array.isArray(p.flexibleConfig.blackoutDates)
                    ? p.flexibleConfig.blackoutDates.map(parseDate).filter(Boolean)
                    : [],
                pricingModel: ["seasonal", "fixed", "on_request"].includes(
                    p.flexibleConfig.pricingModel,
                )
                    ? p.flexibleConfig.pricingModel
                    : "seasonal",
                minAdvanceBookingDays: Math.max(
                    0,
                    Number(p.flexibleConfig.minAdvanceBookingDays || 0),
                ),
                maxAdvanceBookingDays:
                    p.flexibleConfig.maxAdvanceBookingDays == null
                        ? null
                        : Math.max(0, Number(p.flexibleConfig.maxAdvanceBookingDays)),
            };
        } else {
            result.flexibleConfig = null;
        }
    }

    // Custom config
    if (p.customConfig !== undefined) {
        if (p.customConfig && typeof p.customConfig === "object") {
            result.customConfig = {
                responseTimeframeHours: Math.max(
                    1,
                    Number(p.customConfig.responseTimeframeHours || 48),
                ),
                requireDates:
                    typeof p.customConfig.requireDates === "boolean"
                        ? p.customConfig.requireDates
                        : true,
                requireGroupSize:
                    typeof p.customConfig.requireGroupSize === "boolean"
                        ? p.customConfig.requireGroupSize
                        : true,
                allowAgentDraft:
                    typeof p.customConfig.allowAgentDraft === "boolean"
                        ? p.customConfig.allowAgentDraft
                        : true,
                allowCustomerCustomization: p.customConfig.allowCustomerCustomization === true,
                questionnaireFields: Array.isArray(p.customConfig.questionnaireFields)
                    ? p.customConfig.questionnaireFields.map(String)
                    : [],
            };
        } else {
            result.customConfig = null;
        }
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
    const ownerId = toString(tour.ownerAgent?._id || tour.ownerAgent);
    const userId = toString(actor?._id || actor?.sub || actor?.id || user?.sub || user?.id);

    // An in-progress Agent draft is a private workspace record. Elevated
    // users receive it only after the Agent submits it for review.
    if (isPrivateAgentDraft(tour)) {
        return Boolean(ownerId && userId && ownerId === userId);
    }

    // Admin can modify any tour
    if (access?.isMaster || (actor?.role === "admin" && actor?.adminLevel === "master"))
        return true;

    if (
        role === "partner_admin" &&
        actorAgencyId &&
        toString(tourAgencyId) === toString(actorAgencyId)
    )
        return true;

    // Agent can only modify tours they own AND that are agent-scoped
    if (role === "partner_agent" || actor?.role === "agent") {
        if (!actorAgencyId || toString(tourAgencyId) !== toString(actorAgencyId)) return false;
        if (ownerId && userId && ownerId === userId) return true;
    }

    return false;
};

/**
 * Extract owner display info from a populated or raw ownerAgent field.
 */
const extractOwnerInfo = (ownerAgent) => {
    if (!ownerAgent) return { ownerAgentName: "", ownerAgentRef: "", ownerAgentEmail: "" };
    if (isObject(ownerAgent) && ownerAgent._id) {
        return {
            ownerAgentName: ownerAgent.name || "",
            ownerAgentRef: ownerAgent.agentRef || "",
            ownerAgentEmail: ownerAgent.email || "",
        };
    }
    return { ownerAgentName: "", ownerAgentRef: "", ownerAgentEmail: "" };
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
        const query = buildManagementTourListQuery(req, featuredOnly);
        let toursQuery = TourRepository.find(query).sort(getManagementTourSort(req.query?.sort));
        if (limit) toursQuery = toursQuery.limit(limit);

        const toursRaw = await toursQuery;

        const tours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
            const tourObj = doc.toObject ? doc.toObject() : doc;
            const priceInfo = buildPriceInfo(doc, dateQuery);
            // Management screens use this collection for View and Edit, so
            // retain the complete schema instead of a display-card projection.
            const normalized = normalizeTourForResponse(tourObj, priceInfo, {
                includeCommercialCosts: true,
                includeBuilderProcess: true,
            });
            return normalized;
        });

        return sendJson(
            res,
            200,
            {
                status: "success",
                component: {
                    data: { tours },
                    dataScope: { options: {} },
                    elements: { labels: {}, urls: {} },
                    structure: { header: {}, widgets: [], config: {}, actions: [] },
                },
                message: "Tours fetched successfully",
                handler,
            },
            req,
        );
    } catch (error) {
        console.error("getTours error:", error);
        return sendJson(
            res,
            500,
            {
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
            },
            req,
        );
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
            return sendJson(
                res,
                404,
                {
                    status: "error",
                    message: "Tour not found",
                    handler,
                },
                req,
            );
        }

        const tourObj = tourRaw.toObject ? tourRaw.toObject() : tourRaw;
        if (tourObj.status !== "published") {
            return sendJson(res, 404, { status: "error", message: "Tour not found", handler }, req);
        }
        const priceInfo = buildPriceInfo(tourRaw, dateQuery);
        const normalized = normalizeTourForResponse(tourObj, priceInfo);

        return sendJson(
            res,
            200,
            {
                status: "success",
                component: {
                    data: normalized,
                    dataScope: { options: {} },
                    elements: { labels: {}, urls: {} },
                    structure: { header: {}, widgets: [], config: {}, actions: [] },
                },
                message: "Tour fetched successfully",
                handler,
            },
            req,
        );
    } catch (error) {
        console.error("getTourByRef error:", error);
        return sendJson(
            res,
            500,
            {
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
            },
            req,
        );
    }
};

/**
 * Backend-generated realtime events for tour mutations. Only safe DTOs leave
 * the server; the database write above has already committed.
 */
const publishTourRealtimeEvents = (before, after) => {
    try {
        const dto = tourDto(after);
        const tourTitle = dto.title || "Tour";
        const becameUnavailable = before?.status === "published" && after.status !== "published";
        publishToTour(String(after._id), REALTIME_EVENTS.TOUR_UPDATED, dto, {
            notify: realtimeNotify(
                becameUnavailable ? "Tour is no longer available" : "Tour updated",
                becameUnavailable
                    ? `${tourTitle} was just unpublished. We will show the closest available alternatives.`
                    : `${tourTitle} was updated.`,
                becameUnavailable ? "info" : "success",
                `tour:${dto.tourId || after._id}:${becameUnavailable ? "unavailable" : "updated"}`,
            ),
        });
        // A tour that was visible in the public catalog must invalidate every
        // open listing when its card data changes or when it is unpublished.
        // Draft-only edits stay private.
        if (before?.status === "published") {
            publishToCatalog(REALTIME_EVENTS.TOUR_UPDATED, dto);
        }
        const beforePrice = before?.price || {};
        const afterPrice = dto.price || {};
        if (
            Number(beforePrice.min) !== Number(afterPrice.min) ||
            Number(beforePrice.max ?? beforePrice.min) !== Number(afterPrice.max)
        ) {
            publishFanOut(
                { agencyId: dto.agencyId, skipAdmins: true },
                REALTIME_EVENTS.TOUR_PRICE_CHANGED,
                {
                    tourId: dto.tourId,
                    price: afterPrice,
                    previousPrice: { min: beforePrice.min ?? null, max: beforePrice.max ?? null },
                },
                {
                    notify: realtimeNotify(
                        "Tour price updated",
                        `${tourTitle} pricing changed.`,
                        "info",
                        `tour:${dto.tourId || after._id}:price`,
                    ),
                },
            );
        }
        if (before?.status !== after.status && after.status === "published") {
            // Catalog broadcast: every connected client (open listing pages
            // included) learns a new tour just became publicly visible.
            publishToCatalog(REALTIME_EVENTS.TOUR_PUBLISHED, dto);
            publishFanOut({ agencyId: dto.agencyId }, REALTIME_EVENTS.TOUR_PUBLISHED, dto, {
                notify: realtimeNotify(
                    "Tour published",
                    `${tourTitle} is now live.`,
                    "success",
                    `tour:${dto.tourId || after._id}:published`,
                ),
            });
        }
    } catch (error) {
        console.error("[TourController] realtime publish failed:", error?.message);
    }
};

export const updateTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    const { id } = req.params;

    try {
        const existing = await TourRepository.findById(id);
        if (!existing) {
            return sendJson(
                res,
                404,
                {
                    status: "error",
                    message: "Tour not found",
                    handler,
                },
                req,
            );
        }

        if (!canModifyTour(req.user, existing, req.access)) {
            return sendJson(
                res,
                403,
                {
                    status: "error",
                    message: "You do not have permission to modify this tour",
                    handler,
                },
                req,
            );
        }

        const sanitized = sanitizeTourPayloadForUpdate(req.body);
        if (sanitized.featuredRequest !== undefined) {
            const requested = sanitized.featuredRequest.requested === true;
            sanitized.featuredRequest = {
                ...(existing.featuredRequest?.toObject?.() || existing.featuredRequest || {}),
                requested,
                status: requested ? "pending" : "not_requested",
                requestedAt: requested ? new Date() : null,
                requestedBy: requested ? req.user.sub || req.user.id : null,
                evaluatedAt: null,
                reason: requested
                    ? "Waiting for TravelsTREM intelligence review."
                    : "Featured consideration has not been requested.",
            };
        }
        // Never trust client-authored intelligence output fields.
        delete sanitized.featured;
        delete sanitized.trending;
        delete sanitized.metrics;
        delete sanitized.intelligence;
        delete sanitized.reviews;
        assertTourTransition(existing.status, sanitized.status, req);
        const nextStart =
            sanitized.startDate !== undefined ? sanitized.startDate : existing.startDate;
        const nextEnd = sanitized.endDate !== undefined ? sanitized.endDate : existing.endDate;
        if (nextStart && nextEnd && nextStart > nextEnd)
            throw new Error("Tour end date must be after its start date.");
        for (const key of [
            "agencyId",
            "createdBy",
            "productKey",
            "agencyRef",
            "partnerAgencyRef",
            "inventorySource",
        ])
            delete sanitized[key];
        // Verification changes only through POST /:id/verify by a master admin.
        delete sanitized.tremVerified;
        delete sanitized.tremVerifiedBy;
        delete sanitized.tremVerifiedAt;
        if (req.body.ownerAgent !== undefined) {
            const requestedOwnerId = toString(req.body.ownerAgent?._id || req.body.ownerAgent);
            const existingOwnerId = toString(existing.ownerAgent?._id || existing.ownerAgent);
            if (requestedOwnerId === existingOwnerId) delete sanitized.ownerAgent;
            else if (!(req.access?.isMaster || req.access?.role === "partner_admin"))
                delete sanitized.ownerAgent;
            else if (req.access?.isMaster && !existing.agencyId) sanitized.ownerAgent = null;
            else if (!req.body.ownerAgent) sanitized.ownerAgent = null;
            else {
                const owner = await User.exists({
                    _id: requestedOwnerId,
                    agencyId: existing.agencyId,
                    agencyRole: "partner_agent",
                    accountStatus: "active",
                    agentApprovalStatus: "approved",
                });
                if (!owner)
                    return sendJson(
                        res,
                        400,
                        {
                            status: "error",
                            message: "Tour owner must be an active agent in the same agency.",
                        },
                        req,
                    );
                sanitized.ownerAgent = requestedOwnerId;
            }
        }

        const recalculated = { ...existing.toObject(), ...sanitized };
        await applyDerivedCommercialPrice(recalculated, req);
        if (recalculated.commercial?.version === "COMPONENTS_V1") {
            sanitized.commercial = recalculated.commercial;
            sanitized.price = recalculated.price;
        }
        const intelligence = evaluateTourIntelligence(recalculated);
        sanitized.featured = intelligence.featured;
        sanitized.trending = intelligence.trending;
        sanitized.metrics = intelligence.metrics;
        sanitized.intelligence = intelligence.intelligence;
        sanitized.featuredRequest = intelligence.featuredRequest;

        // Preflight the response contract before applying the update so a
        // contract configuration error cannot occur after the mutation.
        const listingResponse = pageDefinitionService.buildPageResponse("tours-remote/listing");
        await localizeTourImageUrls(sanitized);
        let updatedTour = await TourRepository.findByIdAndUpdate(id, sanitized, {
            new: true,
            runValidators: true,
        });
        await refreshTourIntelligence(updatedTour._id, { publish: false });
        updatedTour = (await TourRepository.findById(updatedTour._id)) || updatedTour;
        await syncDerivedTourDeparture(updatedTour);
        await audit(req, {
            action: "trip.updated",
            entityType: "Tour",
            entityId: updatedTour._id,
            agencyId: updatedTour.agencyId,
            before: existing.toObject(),
            after: updatedTour.toObject(),
        });

        publishTourRealtimeEvents(existing, updatedTour);

        const priceInfo = buildPriceInfo(updatedTour, new Date());
        const normalized = normalizeTourForResponse(
            updatedTour.toObject ? updatedTour.toObject() : updatedTour,
            priceInfo,
            { includeCommercialCosts: true, includeBuilderProcess: true },
        );

        listingResponse.component.data = {
            ...listingResponse.component.data,
            tours: [normalized],
            tour: normalized,
        };
        return sendJson(
            res,
            200,
            {
                ...listingResponse,
                message: "Tour updated successfully",
                handler,
            },
            req,
        );
    } catch (error) {
        console.error("updateTour error:", error);
        return sendJson(
            res,
            error.status || 400,
            {
                status: "error",
                message: "Failed to update tour",
                handler,
                error: error.message,
            },
            req,
        );
    }
};

/** Master-admin approval is explicit and cannot be set through create/update payloads. */
export const verifyTour = async (req, res) => {
    const handler = getHandlerFromReq(req);
    if (!req.access?.isMaster) {
        return sendJson(
            res,
            403,
            { status: "error", message: "Only a master admin can verify a tour.", handler },
            req,
        );
    }
    try {
        const existing = await TourRepository.findById(req.params.id);
        if (!existing || isPrivateAgentDraft(existing)) {
            return sendJson(
                res,
                404,
                { status: "error", message: "Tour not found.", handler },
                req,
            );
        }
        const verificationAt = new Date();
        const verificationState = {
            ...existing.toObject(),
            tremVerified: true,
            tremVerifiedBy: req.user.sub || req.user.id,
            tremVerifiedAt: verificationAt,
        };
        const intelligence = evaluateTourIntelligence(verificationState, verificationAt);
        let tour = await TourRepository.findByIdAndUpdate(
            req.params.id,
            {
                tremVerified: true,
                tremVerifiedBy: req.user.sub || req.user.id,
                tremVerifiedAt: verificationAt,
                featured: intelligence.featured,
                trending: intelligence.trending,
                metrics: intelligence.metrics,
                intelligence: intelligence.intelligence,
                featuredRequest: intelligence.featuredRequest,
            },
            { new: true, runValidators: true },
        );
        if (!tour)
            return sendJson(
                res,
                404,
                { status: "error", message: "Tour not found.", handler },
                req,
            );
        await refreshTourIntelligence(tour._id, { publish: false });
        tour = (await TourRepository.findById(tour._id)) || tour;
        await audit(req, {
            action: "trip.verified",
            entityType: "Tour",
            entityId: tour._id,
            agencyId: tour.agencyId,
            after: tour.toObject(),
        });
        publishTourRealtimeEvents(existing, tour);
        const normalized = normalizeTourForResponse(
            tour.toObject(),
            buildPriceInfo(tour, new Date()),
            { includeCommercialCosts: true },
        );
        return sendJson(
            res,
            200,
            {
                status: "success",
                component: { data: { tour: normalized, tours: [normalized] } },
                message: "Tour verified by TravelsTREM.",
                handler,
            },
            req,
        );
    } catch (error) {
        return sendJson(
            res,
            400,
            { status: "error", message: error.message || "Could not verify tour.", handler },
            req,
        );
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
            return sendJson(
                res,
                404,
                {
                    status: "error",
                    message: "Tour not found",
                    handler,
                },
                req,
            );
        }

        if (!canModifyTour(req.user, existing, req.access)) {
            return sendJson(
                res,
                403,
                {
                    status: "error",
                    message: "You do not have permission to delete this tour",
                    handler,
                },
                req,
            );
        }
        const before = existing.toObject();

        // Public/history-bearing tours are archived so active viewers can be
        // notified and recommendation intelligence retains a source profile.
        if (["draft", "pending_approval"].includes(existing.status)) {
            await existing.deleteOne();
            await audit(req, {
                action: "trip.deleted",
                entityType: "Tour",
                entityId: existing._id,
                agencyId: existing.agencyId,
                before,
            });
            return sendJson(
                res,
                200,
                {
                    ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                        injectData: { deletedTourId: id },
                    }),
                    message: "Tour permanently deleted successfully",
                    handler,
                },
                req,
            );
        }
        existing.status = "archived";
        existing.isPublished = false;
        existing.archivedAt = new Date();
        const archiveIntelligence = evaluateTourIntelligence(existing.toObject());
        existing.featured = archiveIntelligence.featured;
        existing.trending = archiveIntelligence.trending;
        existing.intelligence = archiveIntelligence.intelligence;
        existing.featuredRequest = archiveIntelligence.featuredRequest;
        const deletedTour = await existing.save();
        await audit(req, {
            action: "trip.archived",
            entityType: "Tour",
            entityId: existing._id,
            agencyId: existing.agencyId,
        });
        publishTourRealtimeEvents(before, deletedTour);

        return sendJson(
            res,
            200,
            {
                ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                    injectData: { deletedTourId: id },
                }),
                message: "Tour archived successfully",
                handler,
            },
            req,
        );
    } catch (error) {
        console.error("deleteTour error:", error);
        return sendJson(
            res,
            500,
            {
                status: "error",
                message: "Failed to delete tour",
                handler,
                error: error.message,
            },
            req,
        );
    }
};

/**
 * DELETE /tours (deleteAllTours)
 */
export const deleteAllTours = async (req, res) => {
    const handler = getHandlerFromReq(req);
    try {
        if (!(req.user?.role === "admin" && req.user?.adminLevel === "master")) {
            return sendJson(
                res,
                403,
                {
                    status: "error",
                    message: "Only admins can delete all tours",
                    handler,
                },
                req,
            );
        }
        const result = await TourRepository.updateMany(
            { $nor: [{ status: "draft", agentTour: true, ownerAgent: { $ne: null } }] },
            { $set: { status: "archived", isPublished: false, archivedAt: new Date() } },
        );
        return sendJson(
            res,
            200,
            {
                ...pageDefinitionService.buildPageResponse("tours-remote/listing", {
                    injectData: { deletedCount: result.modifiedCount || 0 },
                }),
                message: `Deleted ${result.deletedCount || 0} tours`,
                handler,
            },
            req,
        );
    } catch (error) {
        console.error("deleteAllTours error:", error);
        return sendJson(
            res,
            500,
            {
                status: "error",
                message: "Failed to delete tours",
                handler,
                error: error.message,
            },
            req,
        );
    }
};

/**
 * GET /tours/:id/price (getTourPricePreview)
 */
export const calculateTourPackage = async (req, res) => {
    try {
        const tour = await findTourByRef(req.params.id);
        if (!tour) return res.status(404).json({ status: "error", message: "Tour not found" });
        if (isPrivateAgentDraft(tour) && !canModifyTour(req.user, tour, req.access)) {
            return res.status(404).json({ status: "error", message: "Tour not found" });
        }
        if (tour.commercial?.version !== "COMPONENTS_V1")
            return res.status(409).json({
                status: "error",
                message: "This legacy tour does not have component packages yet",
            });
        const result = await FinancialEngine.calculateBookingFinancials({
            tour,
            packageKey: req.body?.packageKey,
            selections: req.body?.selections || {},
            context: { agencyId: tour.agencyId, tourId: tour._id },
        });
        const canViewCost = Boolean(
            req.access?.isMaster ||
            req.access?.role === "partner_admin" ||
            canModifyTour(req.user, tour, req.access),
        );
        const commercial = canViewCost
            ? result.commercial
            : {
                  ...result.commercial,
                  costTotalMinor: undefined,
                  componentMarginMinor: undefined,
                  lines: result.commercial.lines.map(
                      ({ costUnitAmountMinor, costAmountMinor, marginMinor, ...line }) => line,
                  ),
              };
        const { commercial: _privateCommercial, ...financials } = result;
        return res.json({ status: "success", component: { data: { commercial, financials } } });
    } catch (error) {
        return res
            .status(error.status || 400)
            .json({ status: "error", message: error.message || "Could not calculate package" });
    }
};

/** Public, read-only quote preview. Money values are resolved from the tour. */
export const previewTourCustomization = async (req, res) => {
    try {
        const tour = await findTourByRef(req.params.id);
        if (!tour || tour.status !== "published")
            return res.status(404).json({ status: "error", message: "Tour not found" });
        if (tour.commercial?.version !== "COMPONENTS_V1")
            return res.status(409).json({
                status: "error",
                message: "Package comparison is not available for this tour",
            });
        const preview = FinancialEngine.calculateTourCustomizationPreview({
            tour,
            packageKey: String(req.body?.packageKey || "").slice(0, 100),
            hotelSelections: Array.isArray(req.body?.hotelSelections)
                ? req.body.hotelSelections.slice(0, 20).map((item) => ({
                      stayKey: String(item?.stayKey || "").slice(0, 100),
                      hotelOptionKey: String(item?.hotelOptionKey || "").slice(0, 100),
                      roomOptionKey: String(item?.roomOptionKey || "").slice(0, 100),
                  }))
                : [],
            hotelRequests: Array.isArray(req.body?.hotelRequests)
                ? req.body.hotelRequests.slice(0, 12).map((item) => ({
                      stayKey: String(item?.stayKey || "").slice(0, 100),
                      propertyClass: String(item?.propertyClass || "").slice(0, 80),
                      roomType: String(item?.roomType || "").slice(0, 120),
                      budgetPerNight: String(item?.budgetPerNight || "").slice(0, 20),
                      requirements: String(item?.requirements || "").slice(0, 600),
                  }))
                : [],
            hotelOptionKey: String(req.body?.hotelOptionKey || "").slice(0, 100),
            roomOptionKey: String(req.body?.roomOptionKey || "").slice(0, 100),
            travellerCount: Number(req.body?.travellerCount),
        });
        const selectedPackage = (tour.commercial?.packages || []).find(
            (item) => item.enabled !== false && String(item.packageKey || item.tier) === String(req.body?.packageKey || ""),
        );
        const components = new Map(
            (tour.commercial?.components || []).filter((item) => item.active !== false)
                .map((item) => [String(item.componentKey || ""), item]),
        );
        const hasStructuredFlights = [...components.values()].some((item) => item.type === "FLIGHT");
        const includedFlightComponents = (selectedPackage?.includedComponentKeys || [])
            .map((key) => components.get(String(key)))
            .filter((item) => item?.type === "FLIGHT");
        const includesFlights = hasStructuredFlights
            ? includedFlightComponents.length > 0
            : Boolean(tour.flights?.included);
        const requestedFlights = String(req.body?.flightPreference || "without_flights");
        if (includesFlights && requestedFlights !== "with_flights")
            return res.status(400).json({ status: "error", message: "Flights are already included in this package" });
        const addFlights = !includesFlights && requestedFlights === "with_flights";
        const responsePreview = {
            ...preview,
            flight: {
                includedInPackage: includesFlights,
                request: includesFlights ? "KEEP_INCLUDED" : addFlights ? "ADD" : "NONE",
                names: includedFlightComponents.map((item) => item.name),
            },
            ...(addFlights ? {
                quoteMode: "CUSTOMIZED",
                customized: { totalMinor: null, perPersonMinor: null, status: "PENDING_AGENT_QUOTE" },
                requiresRepricing: true,
            } : {}),
        };
        return res.status(200).json({ status: "success", component: { data: { preview: responsePreview } } });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error?.message || "Could not compare package prices",
        });
    }
};

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
        if (!doc || doc.status !== "published") {
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
