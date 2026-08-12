import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeTourForResponse } from "./tourController.js";
import TourRepository from "../repositories/TourRepository.js";
import BookingRepository from "../../bookings/repositories/BookingRepository.js";
import TravellerService from "../../bookings/services/TravellerService.js";
import BookingTimelineService from "../../bookings/services/BookingTimelineService.js";
import StatusHistoryService from "../../bookings/services/StatusHistoryService.js";
import QuoteService from "../../bookings/services/QuoteService.js";
import { getTourDiscovery, searchToursFromRawRequest } from "../services/tourSearchService.js";
import masterDataService from "../../masterData/services/masterDataService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const PAGE_DIR_MAP = {
  "tours-remote/home": "tours-remote/home",
  "tours-remote/listing": "tours-remote/listing",
  "tours-remote/details": "tours-remote/details",
  "tours-remote/booking": "tours-remote/booking",
  "tours-remote/booking-summary": "tours-remote/booking-summary",
  "tours-remote/booking-checkout": "tours-remote/booking-checkout",
};

const escapeRegExp = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugifyTourTitle = (value = "") =>
  String(value).trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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
  const tours = await TourRepository.find({});
  return tours.find((tour) => slugifyTourTitle(tour.title) === slugifyTourTitle(ref)) || null;
};

const buildPriceInfo = (doc, date = new Date()) => {
  try {
    if (doc && typeof doc.getCurrentPrice === "function") {
      return doc.getCurrentPrice(date);
    }
  } catch (e) { /* fallthrough */ }
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

  return {
    _id: tourObj._id || tourObj.id || null,
    title: tourObj.title || "",
    city: tourObj.city ? { from: tourObj.city.from, to: tourObj.city.to } : null,
    address: tourObj.address ? { city: tourObj.address.city, country: tourObj.address.country } : null,
    period: tourObj.period || null,
    photo: tourObj.photo || "",
    photos: Array.isArray(tourObj.photos) && tourObj.photos.length > 0 ? [tourObj.photos[0]] : [],
    desc: tourObj.desc ? tourObj.desc.slice(0, 120) : "",
    avgRating: tourObj.avgRating != null ? tourObj.avgRating : 0,
    maxGroupSize: tourObj.maxGroupSize || null,
    reviewCount,
    reviews: [],
    featured: !!tourObj.featured,
    tremVerified: Boolean(tourObj.tremVerified),
    tremVerifiedAt: tourObj.tremVerifiedAt || null,
    tags: Array.isArray(tourObj.tags) ? tourObj.tags.slice(0, 4) : [],
    priceInfo: priceInfo || null,
  };
};

// Keep the Tour Facts endpoint deliberately narrow. The UI only renders these
// fields, so returning the full tour leaks unrelated commercial and operational
// data to a public detail-page request.
const normalizeTourFactsForResponse = (tour = {}) => ({
  city: tour.city && typeof tour.city === "object"
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
  // _id is required only for favourites, booking, and enquiry actions.
  _id: tour._id || null,
  title: String(tour.title || ""),
  city: tour.city && typeof tour.city === "object"
    ? { from: String(tour.city.from || ""), to: String(tour.city.to || "") }
    : String(tour.city || ""),
  desc: String(tour.desc || ""),
  period: tour.period ? {
    days: Number(tour.period.days || 0),
    nights: Number(tour.period.nights || 0),
  } : null,
  avgRating: Number(tour.avgRating || 0),
  maxGroupSize: Number(tour.maxGroupSize || 0) || null,
  availability: { totalSeats: tour.availability?.totalSeats ?? null },
  tags: Array.isArray(tour.tags) ? tour.tags.map(String).slice(0, 8) : [],
});

const normalizePricingCardForResponse = (tour = {}) => ({
  // _id and title are action inputs; the remaining fields are displayed.
  _id: tour._id || null,
  title: String(tour.title || ""),
  city: tour.city && typeof tour.city === "object"
    ? { from: String(tour.city.from || ""), to: String(tour.city.to || "") }
    : String(tour.city || ""),
  distance: Number(tour.distance) > 0 ? Number(tour.distance) : null,
  availability: { seatsAvailable: tour.availability?.seatsAvailable ?? null },
  priceInfo: tour.priceInfo ? {
    min: Number(tour.priceInfo.min || 0),
    max: Number(tour.priceInfo.max || 0),
    currency: String(tour.priceInfo.currency || "INR"),
    isFinal: Boolean(tour.priceInfo.isFinal),
  } : null,
});

export const getWidget = async (req, res) => {
  try {
    const pageKey = req.query.pageKey;
    const widgetRef = req.query.ref || (req.params.widgetFile ? `./widgets/${req.params.widgetFile}.json` : null);

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

    // Filter choices are part of the widget contract. Resolve them for every
    // request, including metadata requests, so consumers receive a complete
    // DB-backed filter definition instead of reconstructing it client-side.
    if (fileName === "tour-filters.json") {
      const searchResult = await searchToursFromRawRequest({ page: 1, pageSize: 1 });
      const { facets, pagination } = searchResult;
      const option = (item) => ({ id: item.id, value: item.value, label: `${item.label} (${item.count})`, count: item.count });
      const summary = { totalTours: pagination.totalItems, priceRange: facets.price, dayRange: { min: facets.duration.minDays, max: facets.duration.maxDays } };
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
      const result = await searchToursFromRawRequest({ page: req.query.page, pageSize: req.query.limit, sort: req.query.sort });
      widget.component.data.tours = result.items;
      widget.component.data.items = result.items;
      widget.component.data.facets = result.facets;
      widget.component.data.sort = result.search.sort;
      widget.component.data.pagination = result.pagination;
    }

    if (fileName === "featured-holiday-packages.json") {
      const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 8);
      const toursRaw = await TourRepository.find({}).sort({ createdAt: -1 });
      const packages = (Array.isArray(toursRaw) ? toursRaw : [])
        .map((doc) => {
          const tourObj = doc.toObject ? doc.toObject() : doc;
          return normalizeTourCardForResponse(tourObj, buildPriceInfo(doc));
        })
        .filter((tour) => tour.title && tour.photo)
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            Number(b.avgRating || 0) - Number(a.avgRating || 0)
        )
        .slice(0, limit);
      widget.component.data.packages = packages;
    }

    if (pageKey === "tours-remote/details") {
      const tourRef = req.query.tourRef;
      if (tourRef) {
        const tourRaw = await findTourByRef(tourRef);
        if (tourRaw) {
          const tourObj = tourRaw.toObject ? tourRaw.toObject() : tourRaw;
          const priceInfo = buildPriceInfo(tourRaw);
          const normalized = normalizeTourForResponse(tourObj, priceInfo);
          switch (fileName) {
            case "tour-overview.json":
              widget.component.data.tour = normalizeTourOverviewForResponse(normalized);
              break;
            case "tour-facts.json":
              widget.component.data.tour = normalizeTourFactsForResponse(normalized);
              break;
            case "tour-gallery.json":
              widget.component.data.photos = Array.isArray(normalized.photos) ? normalized.photos : [];
              widget.component.data.title = normalized.title;
              widget.component.data.city = normalized.city;
              break;
            case "pricing-card.json":
              widget.component.data.tour = normalizePricingCardForResponse(normalized);
              break;
            case "tour-highlights.json":
              widget.component.data.highlights = Array.isArray(normalized.highlights) ? normalized.highlights : [];
              break;
            case "itinerary-timeline.json":
              widget.component.data.itinerary = Array.isArray(normalized.itinerary) ? [...normalized.itinerary].sort((a, b) => Number(a.day) - Number(b.day)) : [];
              break;
            case "inclusions-exclusions.json":
              widget.component.data.inclusions = Array.isArray(normalized.inclusions) ? normalized.inclusions : [];
              widget.component.data.exclusions = Array.isArray(normalized.exclusions) ? normalized.exclusions : [];
              break;
            case "included-stays.json":
              widget.component.data.stays = Array.isArray(normalized.includedStays) ? normalized.includedStays : [];
              widget.component.data.hotelOptions = Array.isArray(normalized.hotelOptions) ? normalized.hotelOptions : [];
              break;
            case "cancellation-policy.json":
              widget.component.data.cancellationPolicy = normalized.cancellationPolicy || "";
              widget.component.data.cancellation = normalized.cancellation || null;
              widget.component.data.extras = Array.isArray(normalized.extras) ? normalized.extras : [];
              break;
            case "reviews-section.json":
              widget.component.data.reviews = Array.isArray(normalized.reviews) ? normalized.reviews : [];
              widget.component.data.avgRating = normalized.avgRating || 0;
              break;
             case "similar-tours.json": {
               const allTours = await TourRepository.find({}).sort({ createdAt: -1 });
               const currentTags = new Set((normalized.tags || []).map((tag) => String(tag).toLowerCase()));
               widget.component.data.tours = (Array.isArray(allTours) ? allTours : [])
                 .map((doc) => {
                   const tourObj = doc.toObject ? doc.toObject() : doc;
                   return normalizeTourCardForResponse(tourObj, buildPriceInfo(doc));
                 })
                .filter((candidate) => String(candidate._id) !== String(normalized._id))
                .sort((a, b) => {
                  const aScore = (a.tags || []).filter((tag) => currentTags.has(String(tag).toLowerCase())).length;
                  const bScore = (b.tags || []).filter((tag) => currentTags.has(String(tag).toLowerCase())).length;
                  return bScore - aScore;
                })
                .slice(0, 3);
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

    const isBookingPage = pageKey?.startsWith("tours-remote/booking");
    if (isBookingPage) {
      const bookingId = req.params.bookingId || req.query.bookingId;
      if (bookingId) {
        const bookingDoc = await BookingRepository.findById(bookingId).populate("tour").populate("assignedAgent", "name email role");
        if (bookingDoc) {
          const raw = typeof bookingDoc.toJSON === "function" ? bookingDoc.toJSON() : bookingDoc;
          const tourRaw = raw.tour || {};
          const tour = {
            id: tourRaw.id || tourRaw._id,
            title: tourRaw.title,
            photo: tourRaw.photo,
            photos: Array.isArray(tourRaw.photos) ? tourRaw.photos : [],
            desc: tourRaw.desc,
            city: tourRaw.city,
            meetingPoint: tourRaw.meetingPoint,
            cancellationPolicy: tourRaw.cancellationPolicy,
            highlights: tourRaw.highlights,
            period: tourRaw.period,
            address: tourRaw.address,
          };

          const agentRaw = raw.assignedAgent || null;
          const assignedAgent = agentRaw ? {
            name: agentRaw.name,
            email: agentRaw.email,
            role: agentRaw.role,
          } : null;

          const BOOKING_PROCEED_HIDE_STATUSES = new Set(["CANCELLED", "COMPLETED", "REFUNDED"]);
          const isProceedHide = BOOKING_PROCEED_HIDE_STATUSES.has(raw.status);

          switch (fileName) {
            case "booking-hero.json":
            case "checkout-hero.json":
              widget.component.data.booking = {
                id: raw.id,
                bookingRef: raw.bookingRef,
                status: raw.status,
                guestsCount: raw.guestsCount,
                startDate: raw.startDate || raw.travelWindow?.startDate,
                endDate: raw.endDate || raw.travelWindow?.endDate,
                tour,
                assignedAgent,
                responseDueAt: raw.responseDueAt,
                quoteDueAt: raw.quoteDueAt,
                isProceedHide,
              };
              break;
            case "booking-tour-details.json": {
              const quotes = await QuoteService.list(bookingId);
              const currentQuote = quotes?.[0] || null;
              widget.component.data.booking = {
                id: raw.id,
                bookingRef: raw.bookingRef,
                status: raw.status,
                guestsCount: raw.guestsCount,
                tour,
                priceSnapshot: raw.priceSnapshot || {},
                paymentSummary: raw.paymentSummary || {},
                currentQuote,
                currentQuoteVersion: raw.currentQuoteVersion || 0,
                viewTourUrl: `/tours/${tour.id}`,
                isProceedHide,
              };
              break;
            }
            case "booking-travel-details.json":
              widget.component.data.booking = {
                id: raw.id,
                status: raw.status,
                travelWindow: raw.travelWindow || { startDate: null, endDate: null },
                primaryContact: raw.primaryContact || {},
                tripPreferences: raw.tripPreferences || {},
                tripSelection: raw.tripSelection || {},
                isProceedHide,
              };
              break;
            case "booking-travelers.json": {
              const travelers = await TravellerService.list(bookingId);
              widget.component.data.booking = {
                id: raw.id,
                status: raw.status,
                guestsCount: raw.guestsCount,
                travelers: (travelers || []).map((t) => ({
                  id: t.id || t._id,
                  travellerType: t.travellerType || "adult",
                  firstName: t.firstName || "",
                  lastName: t.lastName || "",
                  email: t.email || "",
                  phone: t.phone || "",
                  age: t.age || "",
                  nationality: t.nationality || "",
                  passportNumber: t.passportNumber || "",
                  emergencyContactName: t.emergencyContactName || "",
                  emergencyContactNumber: t.emergencyContactNumber || "",
                })),
                isProceedHide,
              };
              break;
            }
            case "booking-timeline.json": {
              const [timeline, statusHistory] = await Promise.all([
                BookingTimelineService.list(bookingId, 8),
                StatusHistoryService.list(bookingId, 8),
              ]);
              widget.component.data.booking = {
                id: raw.id,
                timeline: (timeline || []).map((item) => ({
                  id: item.id || item._id,
                  action: item.action,
                  createdAt: item.createdAt,
                  metadata: item.metadata,
                })),
                statusHistory: (statusHistory || []).map((item) => ({
                  id: item.id || item._id,
                  from: item.from,
                  to: item.to,
                  createdAt: item.createdAt,
                })),
                isProceedHide,
              };
              break;
            }
            case "checkout-payment-summary.json":
            case "checkout-sidebar.json":
              widget.component.data.booking = {
                id: raw.id,
                bookingRef: raw.bookingRef,
                status: raw.status,
                guestsCount: raw.guestsCount,
                tour,
                priceSnapshot: raw.priceSnapshot || {},
                paymentSummary: raw.paymentSummary || {},
                isProceedHide,
              };
              break;
            default:
              break;
          }
        }
      }
    }

    widget.component = await masterDataService.hydrateDataScope(widget.component);
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

export const getBookingWidget = (req, res) => {
  req.query.bookingId = req.params.id || req.params.bookingId;
  return getWidget(req, res);
};
