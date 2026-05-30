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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const PAGE_DIR_MAP = {
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
  const titleCandidate = ref.replace(/-/g, " ").trim();
  const directTitle = await TourRepository.findOne({
    title: new RegExp(`^${escapeRegExp(titleCandidate)}$`, "i"),
  });
  if (directTitle) return directTitle;
  const tours = await TourRepository.find({});
  return tours.find((tour) => slugifyTourTitle(tour.title) === slugifyTourTitle(ref)) || null;
};

const numberRange = (values = []) => {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return { min: 0, max: 0 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
};

const normalizePaging = (input = {}) => {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.max(1, Math.min(Number(input.limit) || 6, 30));
  return { page, limit, skip: (page - 1) * limit };
};

const normalizeSort = (value = "recommended") => {
  const normalized = String(value || "recommended").trim();
  return ["recommended", "price_asc", "price_desc", "duration", "rating"].includes(normalized) ? normalized : "recommended";
};

const sortToursForResponse = (tours = [], sortId = "recommended") => {
  if (sortId === "recommended") return tours;
  const priceValue = (tour = {}) => {
    const price = tour.priceInfo || tour.price || {};
    const value = price.min ?? price.max;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : Number.MAX_SAFE_INTEGER;
  };

  return [...tours].sort((a, b) => {
    if (sortId === "price_asc") return priceValue(a) - priceValue(b);
    if (sortId === "price_desc") return priceValue(b) - priceValue(a);
    if (sortId === "duration") return Number(a?.period?.days || 0) - Number(b?.period?.days || 0);
    if (sortId === "rating") return Number(b?.avgRating || 0) - Number(a?.avgRating || 0);
    return 0;
  });
};

const uniqueOptions = (values = []) => {
  const map = new Map();
  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (normalized) map.set(normalized.toLowerCase(), { label: normalized, value: normalized });
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
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
    tags: Array.isArray(tourObj.tags) ? tourObj.tags.slice(0, 4) : [],
    priceInfo: priceInfo || null,
  };
};

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

    if (fileName === "tour-filters.json") {
      const tours = await TourRepository.findLean();
      const prices = [];
      const days = [];
      const originCities = [];
      const destinationCities = [];
      const countries = [];
      const tags = [];
      const languages = [];
      const groupSizes = [];
      const starts = [];

      tours.forEach((t) => {
        if (t.price?.min != null) prices.push(t.price.min);
        if (t.price?.max != null) prices.push(t.price.max);
        if (t.period?.days != null) days.push(t.period.days);
        if (t.maxGroupSize != null) groupSizes.push(t.maxGroupSize);
        if (t.city?.from) originCities.push(t.city.from);
        if (t.city?.to || t.address?.city) destinationCities.push(t.city?.to || t.address?.city);
        if (t.address?.country) countries.push(t.address.country);
        if (Array.isArray(t.tags)) tags.push(...t.tags);
        if (Array.isArray(t.languages)) languages.push(...t.languages);
        if (t.startDate) starts.push(t.startDate);
      });

      const dateValues = starts.map((d) => new Date(d).getTime()).filter(Number.isFinite);
      const summary = {
        totalTours: tours.length,
        priceRange: numberRange(prices),
        dayRange: numberRange(days),
      };
      const options = {
        originCityOptions: uniqueOptions(originCities),
        destinationCityOptions: uniqueOptions(destinationCities),
        countryOptions: uniqueOptions(countries),
        tags: uniqueOptions(tags),
        languages: uniqueOptions(languages),
        featured: [
          { label: "Any status", value: "" },
          { label: "Featured only", value: "true" },
          { label: "Standard tours", value: "false" },
        ],
        groupSizeRange: numberRange(groupSizes),
        dateRange: {
          earliest: dateValues.length ? new Date(Math.min(...dateValues)).toISOString().slice(0, 10) : "",
          latest: "",
        },
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

    if (fileName === "quick-filters.json") {
      const tours = await TourRepository.findLean();
      const tagSet = new Set();
      tours.forEach((t) => {
        if (Array.isArray(t.tags)) t.tags.forEach((tag) => { const t = String(tag).trim().toLowerCase(); if (t) tagSet.add(t); });
      });
      const labels = widget.component.elements?.labels || {};
      const filters = Array.from(tagSet).sort().map((tag) => {
        const labelRef = `qkf_${tag}`;
        labels[labelRef] = tag.charAt(0).toUpperCase() + tag.slice(1);
        return { id: tag, tag, labelRef };
      });
      labels.qkf_all = "All Tours";
      filters.unshift({ id: "all", tag: "", labelRef: "qkf_all" });

      widget.component.data.filters = filters;
      widget.component.elements.labels = labels;
    }

    if (fileName === "tour-grid.json") {
      const paging = normalizePaging(req.query);
      const sort = normalizeSort(req.query?.sort);
      const toursRaw = await TourRepository.find({}).sort({ createdAt: -1 });
      const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();
       const allTours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
         const tourObj = doc.toObject ? doc.toObject() : doc;
         const priceInfo = buildPriceInfo(doc, dateQuery);
         return normalizeTourCardForResponse(tourObj, priceInfo);
       });
      const sorted = sortToursForResponse(allTours, sort);
      const total = sorted.length;
      const totalPages = Math.max(1, Math.ceil(total / paging.limit));
      const tours = sorted.slice(paging.skip, paging.skip + paging.limit);
      widget.component.data.tours = tours;
      widget.component.data.sort = sort;
      widget.component.data.pagination = {
        page: paging.page,
        limit: paging.limit,
        total,
        totalPages,
        hasMore: paging.page < totalPages,
      };
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
              widget.component.data.tour = normalized;
              break;
            case "tour-facts.json":
              widget.component.data.tour = normalized;
              break;
            case "tour-gallery.json":
              widget.component.data.photos = Array.isArray(normalized.photos) ? normalized.photos : [];
              widget.component.data.title = normalized.title;
              widget.component.data.city = normalized.city;
              break;
            case "pricing-card.json":
              widget.component.data.tour = normalized;
              widget.component.data.priceInfo = normalized.priceInfo;
              widget.component.data.availability = normalized.availability;
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
            case "cancellation-policy.json":
              widget.component.data.cancellationPolicy = normalized.cancellationPolicy || "";
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
