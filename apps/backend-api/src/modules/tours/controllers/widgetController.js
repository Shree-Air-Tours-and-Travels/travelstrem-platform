import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TourRepository from "../repositories/TourRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const PAGE_DIR_MAP = {
  "tours-remote/listing": "tours-remote/listing",
  "tours-remote/details": "tours-remote/details",
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

const normalizeTourForResponse = (tourObj = {}, priceInfo = null) => {
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
    avgRating: tourObj.avgRating != null ? tourObj.avgRating : 0,
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
        groupSizeRange: numberRange(groupSizes),
        dateRange: {
          earliest: dateValues.length ? new Date(Math.min(...dateValues)).toISOString().slice(0, 10) : "",
          latest: "",
        },
      };

      const widgetFields = widget.component.structure.widgets?.[0]?.props?.fields || [];
      const resBody = {
        status: "success",
        component: {
          data: { summary },
          dataScope: { options },
          elements: widget.component.elements,
          structure: {
            ...widget.component.structure,
            fields: widgetFields,
          },
          config: {
            options,
            defaults: widget.component.structure.config?.defaults || {},
            summary,
          },
        },
      };

      return res.status(200).json(resBody);
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
      widget.component.structure.widgets[0].props.filters = filters;
    }

    if (fileName === "tour-grid.json") {
      const paging = normalizePaging(req.query);
      const sort = normalizeSort(req.query?.sort);
      const toursRaw = await TourRepository.find({}).sort({ createdAt: -1 });
      const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();
      const allTours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
        const tourObj = doc.toObject ? doc.toObject() : doc;
        const priceInfo = buildPriceInfo(doc, dateQuery);
        return normalizeTourForResponse(tourObj, priceInfo);
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
                  return normalizeTourForResponse(tourObj, buildPriceInfo(doc));
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

    return res.status(200).json(widget);
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
