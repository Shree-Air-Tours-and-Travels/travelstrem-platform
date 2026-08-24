import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeTourForResponse } from "./tourController.js";
import TourRepository from "../repositories/TourRepository.js";
import { getTourDiscovery, searchToursFromRawRequest } from "../services/tourSearchService.js";
import {
    buildManagementTourListQuery,
    getManagementTourSort,
} from "../services/tourVisibility.service.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import { getHiddenProductKeys } from "../../../utils/hiddenProductCache.js";
import {
    calculateTourCustomizationPreview,
    calculateTourHotelUnitPrice,
} from "../../../core/financial-engine/services/tour-commercial.service.js";
import {
    findIntelligentSimilarTours,
    recordTourView,
} from "../services/tourIntelligence.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const HREF_PRODUCT_RE = /[?&]tab=([a-z]+)/i;
const ITEM_PRODUCT_KEYS = ["trevio", "trevista", "trehub", "trecare"];

const hideProductItems = (node, hiddenKeys) => {
    if (!node || typeof node !== "object" || !hiddenKeys.length) return node;
    if (Array.isArray(node)) return node.map((item) => hideProductItems(item, hiddenKeys));

    const next = { ...node };

    if (next.id && ITEM_PRODUCT_KEYS.includes(next.id) && hiddenKeys.includes(next.id)) {
        next.hide = true;
    }
    if (next.productName && hiddenKeys.includes(String(next.productName).toLowerCase())) {
        next.hide = true;
    }
    if (typeof next.href === "string") {
        const tabMatch = next.href.match(HREF_PRODUCT_RE);
        if (tabMatch && hiddenKeys.includes(tabMatch[1].toLowerCase())) {
            next.hide = true;
        }
    }

    for (const key of Object.keys(next)) {
        if (key === "component") {
            next[key] = hideProductItems(next[key], hiddenKeys);
        } else if (key === "data" && typeof next[key] === "object") {
            next[key] = hideProductItems(next[key], hiddenKeys);
        } else if (key === "items" && Array.isArray(next[key])) {
            next[key] = next[key].map((item) => hideProductItems(item, hiddenKeys));
        } else if (key === "widgets" && Array.isArray(next[key])) {
            next[key] = next[key].map((item) => hideProductItems(item, hiddenKeys));
        }
    }

    return next;
};

const PAGE_DIR_MAP = {
    "tours-remote/home": "tours-remote/home",
    "tours-remote/listing": "tours-remote/listing",
    "tours-remote/details": "tours-remote/details",
    "agent-shell/services/tours-management": "agent-shell/services/tours-management",
};

const escapeRegExp = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const textValue = (value, fallback = "") => {
    if (value == null) return fallback;
    if (["string", "number", "boolean"].includes(typeof value)) {
        const text = String(value).trim();
        return text && text !== "[object Object]" ? text : fallback;
    }
    if (Array.isArray(value)) return value.map((item) => textValue(item)).find(Boolean) || fallback;
    if (typeof value === "object") {
        if (value._bsontype && typeof value.toString === "function") {
            const text = value.toString().trim();
            return text && text !== "[object Object]" ? text : fallback;
        }
        return textValue(
            value.slug ??
                value.tourRef ??
                value.value ??
                value.label ??
                value.name ??
                value.title ??
                value.en ??
                value.default ??
                value._id ??
                value.id,
            fallback,
        );
    }
    return fallback;
};

const slugifyTourTitle = (value = "") =>
    textValue(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const findTourByRef = async (tourRef, { includeUnpublishedSource = false } = {}) => {
    const ref = decodeURIComponent(String(tourRef || "")).trim();
    if (!ref) return null;
    const visibility = includeUnpublishedSource ? {} : { status: "published" };
    if (/^[0-9a-fA-F]{24}$/.test(ref)) {
        const byId = await TourRepository.findOne({ _id: ref, ...visibility });
        if (byId) return byId;
    }
    const bySlug = await TourRepository.findOne({
        slug: slugifyTourTitle(ref),
        ...visibility,
    });
    if (bySlug) return bySlug;
    const titleCandidate = ref.replace(/-/g, " ").trim();
    const directTitle = await TourRepository.findOne({
        title: new RegExp(`^${escapeRegExp(titleCandidate)}$`, "i"),
        ...visibility,
    });
    if (directTitle) return directTitle;
    const tours = await TourRepository.find(visibility);
    return tours.find((tour) => slugifyTourTitle(tour.title) === slugifyTourTitle(ref)) || null;
};

const buildPriceInfo = (doc, date = new Date()) => {
    try {
        if (doc && typeof doc.getCurrentPrice === "function") {
            return doc.getCurrentPrice(date);
        }
    } catch (e) {
        /* fallthrough */
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

const normalizeTourCardForResponse = (tourObj = {}, priceInfo = null) => {
    const reviews = Array.isArray(tourObj.reviews) ? tourObj.reviews : [];
    const reviewCount = reviews.length;
    const title = textValue(tourObj.title);
    const slug = slugifyTourTitle(tourObj.slug || title || tourObj._id || tourObj.id);

    return {
        _id: textValue(tourObj._id || tourObj.id) || null,
        id: textValue(tourObj.id || tourObj._id) || null,
        slug,
        tourRef: slug,
        title,
        city: tourObj.city ? { from: tourObj.city.from, to: tourObj.city.to } : null,
        address: tourObj.address
            ? { city: tourObj.address.city, country: tourObj.address.country }
            : null,
        period: tourObj.period || null,
        photo: tourObj.photo || "",
        photos:
            Array.isArray(tourObj.photos) && tourObj.photos.length > 0 ? [tourObj.photos[0]] : [],
        desc: tourObj.desc ? tourObj.desc.slice(0, 120) : "",
        avgRating: tourObj.avgRating != null ? tourObj.avgRating : 0,
        maxGroupSize: tourObj.maxGroupSize || null,
        reviewCount,
        reviews: [],
        featured: !!tourObj.featured,
        trending: !!tourObj.trending,
        tremVerified: Boolean(tourObj.tremVerified),
        tremVerifiedAt: tourObj.tremVerifiedAt || null,
        tags: Array.isArray(tourObj.tags) ? tourObj.tags.slice(0, 4) : [],
        similarity: tourObj.similarity || null,
        priceInfo: priceInfo || null,
    };
};

// Keep the Tour Facts endpoint deliberately narrow. The UI only renders these
// fields, so returning the full tour leaks unrelated commercial and operational
// data to a public detail-page request.
const normalizeTourFactsForResponse = (tour = {}) => ({
    city:
        tour.city && typeof tour.city === "object"
            ? { from: String(tour.city.from || ""), to: String(tour.city.to || "") }
            : String(tour.city || ""),
    distance: Number(tour.distance) > 0 ? Number(tour.distance) : null,
    startDate: tour.startDate || null,
    endDate: tour.endDate || null,
    availability: {
        seatsAvailable: tour.availability?.seatsAvailable ?? null,
    },
});

const normalizeTourOverviewForResponse = (tour = {}) => ({
    // _id is required for favourites and enquiry actions.
    _id: tour._id || null,
    status: tour.status || null,
    title: String(tour.title || ""),
    city:
        tour.city && typeof tour.city === "object"
            ? { from: String(tour.city.from || ""), to: String(tour.city.to || "") }
            : String(tour.city || ""),
    desc: String(tour.desc || ""),
    period: tour.period
        ? {
              days: Number(tour.period.days || 0),
              nights: Number(tour.period.nights || 0),
          }
        : null,
    avgRating: Number(tour.avgRating || 0),
    maxGroupSize: Number(tour.maxGroupSize || 0) || null,
    availability: { totalSeats: tour.availability?.totalSeats ?? null },
    tags: Array.isArray(tour.tags) ? tour.tags.map(String).slice(0, 8) : [],
    agency: tour.agency || null,
    operator: tour.operator || null,
    providerName: tour.providerName || "",
    inventorySource: tour.inventorySource || "platform",
    ownerAgentName: tour.ownerAgentName || "",
    ownerAgentEmail: tour.ownerAgentEmail || "",
});

const publicPackages = (tour = {}) => {
    if (tour.commercial?.version !== "COMPONENTS_V1") return [];
    const definitions = new Map(
        (tour.commercial.packages || [])
            .filter((item) => item?.enabled !== false)
            .map((item) => [String(item.packageKey || ""), item]),
    );
    const components = new Map(
        (tour.commercial.components || [])
            .filter((item) => item?.active !== false)
            .map((item) => [String(item.componentKey || ""), item]),
    );
    return (tour.commercial.derived?.packages || [])
        .map((derived) => {
            const definition = definitions.get(String(derived.packageKey || "")) || {};
            const componentNames = (keys) =>
                (keys || []).map((key) => components.get(String(key))?.name).filter(Boolean);
            return {
                packageKey: String(derived.packageKey || definition.packageKey || ""),
                tier: String(derived.tier || definition.tier || ""),
                name: String(derived.name || definition.name || "Package"),
                description: String(definition.description || ""),
                recommended: Boolean(definition.recommended),
                included: componentNames(definition.includedComponentKeys),
                optional: componentNames(definition.optionalComponentKeys),
                sellingTotalMinor: Number(derived.sellingTotalMinor || 0),
                requiresRepricing: Boolean(derived.requiresRepricing),
            };
        })
        .filter((item) => item.packageKey && item.sellingTotalMinor > 0);
};

const normalizePricingCardForResponse = (tour = {}) => ({
    // _id and title are action inputs; the remaining fields are displayed.
    _id: tour._id || null,
    title: String(tour.title || ""),
    city:
        tour.city && typeof tour.city === "object"
            ? { from: String(tour.city.from || ""), to: String(tour.city.to || "") }
            : String(tour.city || ""),
    distance: Number(tour.distance) > 0 ? Number(tour.distance) : null,
    availability: { seatsAvailable: tour.availability?.seatsAvailable ?? null },
    priceInfo: tour.priceInfo
        ? {
              min: Number(tour.priceInfo.min || 0),
              max: Number(tour.priceInfo.max || 0),
              currency: String(tour.priceInfo.currency || "INR"),
              isFinal: Boolean(tour.priceInfo.isFinal),
          }
        : null,
    commercialPricing:
        tour.commercial?.version === "COMPONENTS_V1"
            ? {
                  currency: String(tour.commercial.currency || tour.priceInfo?.currency || "INR"),
                  displayMode: String(tour.commercial.derived?.displayMode || "ESTIMATED"),
                  packages: publicPackages(tour),
              }
            : null,
});

const normalizeStayPricing = (pricing, tour) => calculateTourHotelUnitPrice({ tour, pricing });
const stayKeyFor = (option = {}) =>
    String(option.stayKey || option.location || option.optionKey || option._id || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalizeHotelOptionsForResponse = (tour = {}, selectedPackageKey = "") => {
    const packageNames = new Map(
        (tour.commercial?.packages || []).map((item) => [
            String(item.packageKey || ""),
            String(item.name || ""),
        ]),
    );
    return (tour.hotelOptions || [])
        .filter((option) => option?.active !== false)
        .map((option, index) => {
            const pricing = normalizeStayPricing(option.pricing, tour);
            return {
                id: String(option._id || option.optionKey || `hotel-${index + 1}`),
                value: String(option.optionKey || option._id || `hotel-${index + 1}`),
                stayKey: stayKeyFor(option),
                title: String(option.title || option.propertyName || "Hotel option"),
                propertyName: String(option.propertyName || option.title || ""),
                propertyClass: String(option.propertyClass || ""),
                location: String(option.location || ""),
                address: String(option.address || ""),
                nights: Math.max(0, Number(option.nights ?? 1)),
                description: String(option.description || ""),
                photos: (option.photos || []).map(String).slice(0, 20),
                amenities: (option.amenities || []).map(String).slice(0, 30),
                packageKeys: (option.packageKeys || []).map(String).slice(0, 10),
                packageNames: (option.packageKeys || [])
                    .map((key) => packageNames.get(String(key)))
                    .filter(Boolean),
                recommended: Boolean(option.recommended),
                costLabel: String(option.costLabel || "Upgrade price"),
                cost: "",
                pricing,
                pricePending: !pricing,
                rooms: (option.rooms || [])
                    .filter((room) => room?.available !== false)
                    .map((room, roomIndex) => {
                        const roomPricing = normalizeStayPricing(room.pricing, tour);
                        const effectivePackageKeys = (room.packageKeys || []).length
                            ? room.packageKeys
                            : option.packageKeys || [];
                        const requiresUpgrade = Boolean(
                            selectedPackageKey &&
                            !effectivePackageKeys.map(String).includes(String(selectedPackageKey)),
                        );
                        let upgradePricing = null;
                        if (requiresUpgrade) {
                            try {
                                const preview = calculateTourCustomizationPreview({
                                    tour,
                                    packageKey: selectedPackageKey,
                                    hotelOptionKey: String(option.optionKey || option._id || ""),
                                    roomOptionKey: String(room.roomKey || room._id || ""),
                                    travellerCount: 1,
                                });
                                if (preview.hotel?.supplement?.perPersonMinor != null) {
                                    upgradePricing = {
                                        amountMinor: preview.hotel.supplement.perPersonMinor,
                                        currency: preview.currency,
                                        unit: "PER_PERSON",
                                    };
                                }
                            } catch {
                                upgradePricing = null;
                            }
                        }
                        return {
                            id: String(room._id || room.roomKey || `room-${roomIndex + 1}`),
                            value: String(room.roomKey || room._id || `room-${roomIndex + 1}`),
                            name: String(room.name || `Room ${roomIndex + 1}`),
                            description: String(room.description || ""),
                            bedType: String(room.bedType || ""),
                            maxAdults: Number(room.maxAdults || 2),
                            maxChildren: Number(room.maxChildren || 0),
                            meals: (room.meals || []).map(String).slice(0, 20),
                            amenities: (room.amenities || []).map(String).slice(0, 30),
                            photos: (room.photos || []).map(String).slice(0, 20),
                            packageKeys: effectivePackageKeys.map(String).slice(0, 10),
                            packageNames: effectivePackageKeys
                                .map((key) => packageNames.get(String(key)))
                                .filter(Boolean),
                            includedInSelectedPackage: Boolean(
                                selectedPackageKey &&
                                effectivePackageKeys
                                    .map(String)
                                    .includes(String(selectedPackageKey)),
                            ),
                            pricing: requiresUpgrade ? upgradePricing : roomPricing || pricing,
                            pricePending: requiresUpgrade
                                ? !upgradePricing
                                : !roomPricing && !pricing,
                        };
                    }),
            };
        });
};

const selectedPackageFor = (tour = {}, requestedKey = "") => {
    const packages = (tour.commercial?.packages || []).filter(
        (item) => item?.enabled !== false && item?.packageKey,
    );
    const requested = packages.find(
        (item) => String(item.packageKey) === String(requestedKey || ""),
    );
    return String(
        (requested || packages.find((item) => item.recommended) || packages[0])?.packageKey || "",
    );
};

const resolvePackageStays = (tour = {}, packageKey = "") => {
    const seenStays = new Set();
    const resolved = (tour.hotelOptions || [])
        .filter((option) => option?.active !== false)
        .flatMap((option) => {
            const stayKey = stayKeyFor(option);
            if (seenStays.has(stayKey)) return [];
            const room = (option.rooms || []).find(
                (item) =>
                    item?.available !== false &&
                    (item.packageKeys || []).map(String).includes(String(packageKey)),
            );
            if (!room) return [];
            seenStays.add(stayKey);
            return [
                {
                    _id: `${String(option.optionKey || option._id)}:${String(room.roomKey || room._id)}`,
                    stayKey,
                    hotelOptionKey: String(option.optionKey || option._id || ""),
                    roomOptionKey: String(room.roomKey || room._id || ""),
                    nights: Math.max(0, Number(option.nights || 0)),
                    location: String(option.location || ""),
                    propertyName: String(option.propertyName || option.title || ""),
                    propertyClass: String(option.propertyClass || ""),
                    roomType: String(room.name || ""),
                    meals: (room.meals || []).map(String).slice(0, 20),
                    description: String(room.description || option.description || ""),
                    photos: (room.photos?.length ? room.photos : option.photos || [])
                        .map(String)
                        .slice(0, 20),
                    amenities: [
                        ...new Set(
                            [...(option.amenities || []), ...(room.amenities || [])].map(String),
                        ),
                    ].slice(0, 30),
                    includedForPackageKey: packageKey,
                },
            ];
        });
    return resolved.length
        ? resolved
        : Array.isArray(tour.includedStays)
          ? tour.includedStays.map((stay, index) => ({
                ...stay,
                stayKey: stayKeyFor({
                    stayKey: stay?.stayKey,
                    location: stay?.location,
                    optionKey: `stay-${index + 1}`,
                }),
            }))
          : [];
};

/**
 * Single-call listing widget for the agent Tours Management page: returns the
 * page metadata (labels/config from the widget JSON) AND the agent-scoped
 * tour collection in one response, so the client never needs a second
 * /tours.json round trip. Search + sort are applied server-side via query
 * params (?query=&sort=newest|oldest|title). Access is scoped exactly like
 * GET /tours.json (buildManagementTourQuery) — the route carries the same
 * auth + permission middleware.
 */
export const getTourManagementListingWidget = async (req, res) => {
    try {
        const pageDir = path.resolve(
            DATA_DIR,
            PAGE_DIR_MAP["agent-shell/services/tours-management"],
        );
        const resolvedPath = path.resolve(pageDir, "./widgets/tour-management-listing.json");
        if (!resolvedPath.startsWith(DATA_DIR)) {
            return res.status(403).json({ status: "error", message: "Invalid widget path" });
        }
        const widget = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

        if (String(req.query.metadataOnly || "").toLowerCase() === "true") {
            widget.component.data = {};
            widget.component = await masterDataService.hydrateDataScope(widget.component);
            return res.status(200).json(ensurePageContract(widget));
        }

        const mongoQuery = buildManagementTourListQuery(req);
        const mongoSort = getManagementTourSort(req.query.sort);

        const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();
        const toursRaw = await TourRepository.find(mongoQuery).sort(mongoSort);
        const tours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
            const tourObj = doc.toObject ? doc.toObject() : doc;
            // Management screens use this collection for View and Edit, so
            // retain the complete schema instead of a display-card projection.
            return normalizeTourForResponse(tourObj, buildPriceInfo(doc, dateQuery), {
                includeCommercialCosts: true,
                includeBuilderProcess: true,
            });
        });

        widget.component.data.tours = tours;
        widget.component = await masterDataService.hydrateDataScope(widget.component);
        return res.status(200).json(ensurePageContract(widget));
    } catch (error) {
        console.error("getTourManagementListingWidget error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to load tours",
        });
    }
};

export const getWidget = async (req, res) => {
    try {
        const pageKey = req.query.pageKey;
        const widgetRef =
            req.query.ref ||
            (req.params.widgetFile ? `./widgets/${req.params.widgetFile}.json` : null);

        if (!widgetRef) {
            return res.status(400).json({
                status: "error",
                message: "Missing widget reference",
            });
        }

        let resolvedPath;
        if (pageKey && PAGE_DIR_MAP[pageKey]) {
            const pageDir = path.resolve(DATA_DIR, PAGE_DIR_MAP[pageKey]);
            resolvedPath = path.resolve(pageDir, widgetRef);
        } else {
            resolvedPath = path.resolve(DATA_DIR, widgetRef);
        }

        if (!resolvedPath.startsWith(DATA_DIR)) {
            return res.status(403).json({
                status: "error",
                message: "Invalid widget path",
            });
        }

        const raw = fs.readFileSync(resolvedPath, "utf8");
        const widget = JSON.parse(raw);

        const fileName = path.basename(resolvedPath);

        // Keep workflow status choices in the backend contract. The checked-in
        // legacy widget still exposes date sorting, so normalize it here until
        // that root-owned data file can be migrated safely.
        if (fileName === "tour-management-filters.json") {
            widget.component.elements = widget.component.elements || {};
            widget.component.elements.labels = {
                ...(widget.component.elements.labels || {}),
                allStatuses: "All statuses",
                statusDraft: "Draft",
                statusPendingApproval: "Pending approval",
                statusPublished: "Published",
                statusUnpublished: "Unpublished",
                statusCancelled: "Cancelled",
            };
            widget.component.structure = widget.component.structure || {};
            widget.component.structure.config = widget.component.structure.config || {};
            delete widget.component.structure.config.sort;
            widget.component.structure.config.status = {
                options: [
                    { id: "", labelRef: "allStatuses" },
                    { id: "draft", labelRef: "statusDraft" },
                    { id: "pending_approval", labelRef: "statusPendingApproval" },
                    { id: "published", labelRef: "statusPublished" },
                    { id: "unpublished", labelRef: "statusUnpublished" },
                    { id: "cancelled", labelRef: "statusCancelled" },
                ],
            };
        }

        // Filter choices are part of the widget contract. Resolve them for every
        // request, including metadata requests, so consumers receive a complete
        // DB-backed filter definition instead of reconstructing it client-side.
        if (fileName === "tour-filters.json") {
            const searchResult = await searchToursFromRawRequest({ page: 1, pageSize: 1 });
            const { facets, pagination } = searchResult;
            const option = (item) => ({
                id: item.id,
                value: item.value,
                label: `${item.label} (${item.count})`,
                count: item.count,
            });
            const summary = {
                totalTours: pagination.totalItems,
                priceRange: facets.price,
                dayRange: { min: facets.duration.minDays, max: facets.duration.maxDays },
            };
            const options = {
                originCityOptions: facets.origins.map(option),
                destinationCityOptions: facets.destinations.map(option),
                countryOptions: facets.countries.map(option),
                agencyOptions: facets.agencies.map(option),
                tags: facets.tags.map(option),
                featured: await masterDataService.getOptionSet("trevista.tourFeaturedOptions"),
                priceRange: facets.price,
                dayRange: summary.dayRange,
            };

            const resBody = {
                status: "success",
                component: {
                    data: { summary },
                    dataScope: { options },
                    elements: widget.component.elements,
                    structure: widget.component.structure,
                },
            };

            return res.status(200).json(ensurePageContract(resBody));
        }

        // Quick-filter chips are part of this widget's data contract. Keep them in
        // the widget response even for metadata requests so clients do not need to
        // fetch and merge a second discovery payload.
        if (fileName === "quick-filters.json") {
            const discovery = await getTourDiscovery();
            widget.component.data.filters = discovery.chips;
        }

        // The grid response owns its initial DB result set and facets. Returning an
        // empty data object for metadata requests made the public widget contract
        // misleading and forced the client to assemble it from another endpoint.
        if (fileName === "tour-grid.json") {
            const result = await searchToursFromRawRequest({
                page: req.query.page,
                pageSize: req.query.limit,
                sort: req.query.sort,
            });
            widget.component.data.tours = result.items;
            widget.component.data.items = result.items;
            widget.component.data.facets = result.facets;
            widget.component.data.sort = result.search.sort;
            widget.component.data.pagination = result.pagination;
        }

        if (fileName === "featured-holiday-packages.json") {
            const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 8);
            const featuredResult = await searchToursFromRawRequest({
                filters: { featured: true },
                sort: "RECOMMENDED",
                page: 1,
                pageSize: limit,
            });
            widget.component.data.packages = featuredResult.items;
        }

        if (pageKey === "tours-remote/details") {
            const tourRef = req.query.tourRef;
            if (tourRef) {
                // Similar recommendations may still use an unpublished tour
                // as their private scoring source, but no unpublished tour
                // fields are returned to the browser.
                const tourRaw = await findTourByRef(tourRef, {
                    includeUnpublishedSource: fileName === "similar-tours.json",
                });
                if (tourRaw) {
                    const tourObj = tourRaw.toObject ? tourRaw.toObject() : tourRaw;
                    const priceInfo = buildPriceInfo(tourRaw);
                    const normalized = normalizeTourForResponse(tourObj, priceInfo);
                    switch (fileName) {
                        case "tour-overview.json":
                            widget.component.data.tour =
                                normalizeTourOverviewForResponse(normalized);
                            // Non-blocking, daily-deduplicated intelligence signal.
                            recordTourView(tourObj._id, req).catch((error) =>
                                console.error(
                                    "[TourIntelligence] view signal failed:",
                                    error.message,
                                ),
                            );
                            break;
                        case "tour-facts.json":
                            widget.component.data.tour = normalizeTourFactsForResponse(normalized);
                            break;
                        case "tour-gallery.json":
                            widget.component.data.photos = Array.isArray(normalized.photos)
                                ? normalized.photos
                                : [];
                            widget.component.data.title = normalized.title;
                            widget.component.data.city = normalized.city;
                            break;
                        case "pricing-card.json":
                            widget.component.data.tour =
                                normalizePricingCardForResponse(normalized);
                            break;
                        case "tour-highlights.json":
                            widget.component.data.highlights = Array.isArray(normalized.highlights)
                                ? normalized.highlights
                                : [];
                            break;
                        case "itinerary-timeline.json":
                            widget.component.data.itinerary = Array.isArray(normalized.itinerary)
                                ? [...normalized.itinerary].sort(
                                      (a, b) => Number(a.day) - Number(b.day),
                                  )
                                : [];
                            break;
                        case "inclusions-exclusions.json":
                            widget.component.data.inclusions = Array.isArray(normalized.inclusions)
                                ? normalized.inclusions
                                : [];
                            widget.component.data.exclusions = Array.isArray(normalized.exclusions)
                                ? normalized.exclusions
                                : [];
                            break;
                        case "included-stays.json":
                            widget.component.data.selectedPackageKey = selectedPackageFor(
                                tourObj,
                                req.query.packageKey,
                            );
                            widget.component.data.selectedPackageName = String(
                                (tourObj.commercial?.packages || []).find(
                                    (item) =>
                                        String(item.packageKey) ===
                                        widget.component.data.selectedPackageKey,
                                )?.name || "",
                            );
                            widget.component.data.stays = resolvePackageStays(
                                tourObj,
                                widget.component.data.selectedPackageKey,
                            );
                            widget.component.data.hotelOptions = normalizeHotelOptionsForResponse(
                                tourObj,
                                widget.component.data.selectedPackageKey,
                            );
                            widget.component.data.customizable =
                                tourObj.packageType === "custom" &&
                                tourObj.customConfig?.allowCustomerCustomization === true;
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
                            widget.component.data.reviews = Array.isArray(normalized.reviews)
                                ? normalized.reviews
                                : [];
                            widget.component.data.avgRating = normalized.avgRating || 0;
                            break;
                        case "similar-tours.json": {
                            const similarTours = await findIntelligentSimilarTours(tourRaw, {
                                limit: 3,
                            });
                            widget.component.data.tours = similarTours.map((doc) => {
                                const tourObj = doc.toObject ? doc.toObject() : doc;
                                return normalizeTourCardForResponse(tourObj, buildPriceInfo(doc));
                            });
                            break;
                        }
                        default:
                            break;
                    }
                } else {
                    return res.status(404).json({
                        status: "error",
                        message: "Tour not found",
                    });
                }
            }
        }

        widget.component = await masterDataService.hydrateDataScope(widget.component);
        const hiddenKeys = await getHiddenProductKeys();
        if (hiddenKeys.length) {
            widget.component = hideProductItems(widget.component, hiddenKeys);
        }
        return res.status(200).json(ensurePageContract(widget));
    } catch (error) {
        console.error("getWidget error:", error);
        return res.status(404).json({
            status: "error",
            message: "Widget not found",
        });
    }
};

export const getTourDetailsWidget = (req, res) => {
    req.query.pageKey = "tours-remote/details";
    req.query.tourRef = req.params.tourRef;
    return getWidget(req, res);
};
