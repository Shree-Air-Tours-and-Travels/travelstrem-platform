// modules/tours/filtersController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TourRepository from "../repositories/TourRepository.js";
import config from "../../../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const readWidgetJson = () => {
  const filePath = path.resolve(DATA_DIR, "tours-remote/listing/widgets/tour-filters.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

/* ============================================================
   DEV SETTINGS (same as your pattern)
============================================================ */
const NODE_ENV = (config.nodeEnv || "development").toString().trim();
const IS_DEVELOPMENT = NODE_ENV === "development";
const DEFAULT_DELAY_MS = Number(config.devDelayMs || 400);
const DEBUG = Boolean(config.enableDebugLogs);

/* ============================================================
   Utility: Send JSON with optional dev delay
============================================================ */
const sendJson = (res, statusCode, body, req) => {
  if (!IS_DEVELOPMENT) return res.status(statusCode).json(body);

  const q = Number(req?.query?.delayMs);
  const header = Number(req?.headers?.["x-dev-delay"]);
  const delay = Number.isFinite(q) ? q : Number.isFinite(header) ? header : DEFAULT_DELAY_MS;

  if (!delay) return res.status(statusCode).json(body);

  return setTimeout(() => res.status(statusCode).json(body), delay);
};

/* safe helpers */
const escapeRegExp = (s = "") =>
  String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const safeNum = (v) => {
  if (v === undefined || v === null || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const normalizeText = (value) => String(value || "").trim();

const toOption = (value) => {
  const normalized = normalizeText(value);
  return normalized ? { label: normalized, value: normalized } : null;
};

const uniqueOptions = (values = []) => {
  const map = new Map();
  values.forEach((value) => {
    const option = toOption(value);
    if (option) map.set(option.value.toLowerCase(), option);
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
};

const numberRange = (values = []) => {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return { min: 0, max: 0 };
  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
};

const isoDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildPriceInfo = (doc, date = new Date()) => {
  try {
    const hydrated = TourRepository.hydrate(doc);
    if (typeof hydrated.getCurrentPrice === "function") return hydrated.getCurrentPrice(date);
  } catch (e) {
    // fall back below
  }

  if (!doc?.price) return null;
  return {
    min: doc.price.min,
    max: doc.price.max,
    currency: doc.price.currency || "INR",
    isFinal: !!doc.price.isFinal,
    source: doc.price.source || "manual",
    matchedSeason: null,
    note: "",
  };
};

const computeAvgRating = (doc) => {
  if (!Array.isArray(doc?.reviews) || !doc.reviews.length) return 0;
  const sum = doc.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return +(sum / doc.reviews.length).toFixed(1);
};

const getFilterFacts = (tours = []) => {
  const originCities = [];
  const destinationCities = [];
  const allCities = [];
  const countries = [];
  const tags = [];
  const languages = [];
  const prices = [];
  const days = [];
  const groupSizes = [];
  const starts = [];
  const ends = [];

  tours.forEach((t) => {
    const origin = t.city?.from;
    const destination = t.city?.to || t.address?.city;
    originCities.push(origin);
    destinationCities.push(destination);
    allCities.push(origin, destination, t.address?.city);
    countries.push(t.address?.country);
    if (Array.isArray(t.tags)) tags.push(...t.tags);
    if (Array.isArray(t.languages)) languages.push(...t.languages);
    if (t.price?.min != null) prices.push(t.price.min);
    if (t.price?.max != null) prices.push(t.price.max);
    if (t.period?.days != null) days.push(t.period.days);
    if (t.maxGroupSize != null) groupSizes.push(t.maxGroupSize);
    if (t.startDate) starts.push(t.startDate);
    if (t.endDate) ends.push(t.endDate);
  });

  const priceRange = numberRange(prices);
  const dayRange = numberRange(days);
  const groupRange = numberRange(groupSizes);
  const dateStartValues = starts.map((date) => new Date(date).getTime()).filter(Number.isFinite);
  const dateEndValues = ends.map((date) => new Date(date).getTime()).filter(Number.isFinite);

  return {
    originCities: uniqueOptions(originCities),
    destinationCities: uniqueOptions(destinationCities),
    cities: uniqueOptions(allCities),
    countries: uniqueOptions(countries),
    tags: uniqueOptions(tags),
    languages: uniqueOptions(languages),
    featured: [
      { label: "Any status", value: "" },
      { label: "Featured only", value: "true" },
      { label: "Standard tours", value: "false" },
    ],
    ratings: [
      { label: "Any rating", value: "" },
      { label: "4+ stars", value: "4" },
      { label: "3+ stars", value: "3" },
      { label: "2+ stars", value: "2" },
    ],
    priceRange,
    dayRange,
    groupSizeRange: groupRange,
    maxGuests: {
      adults: Math.max(groupRange.max || 12, 12),
      children: Math.max(groupRange.max || 8, 8),
      infants: 4,
    },
    dateRange: {
      earliest: dateStartValues.length ? isoDate(Math.min(...dateStartValues)) : "",
      latest: dateEndValues.length ? isoDate(Math.max(...dateEndValues)) : "",
    },
    totalTours: tours.length,
  };
};

const getOptionValues = (options = []) => new Set(options.map((option) => String(option.value)));

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [normalizeText(value)].filter(Boolean);
};

const normalizePaging = (input = {}) => {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.max(1, Math.min(Number(input.limit) || 6, 30));
  return { page, limit, skip: (page - 1) * limit };
};

const normalizeSort = (value = "recommended") => {
  const normalized = normalizeText(value || "recommended");
  return ["recommended", "price_asc", "price_desc", "duration", "rating"].includes(normalized) ? normalized : "recommended";
};

const sortTours = (tours = [], sortId = "recommended") => {
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

const validateFiltersPayload = (input = {}, options = {}) => {
  const errors = {};
  const clean = {
    search: normalizeText(input.search).slice(0, 80),
    originCity: normalizeText(input.originCity || ""),
    destinationCity: normalizeText(input.destinationCity || input.city || ""),
    country: normalizeText(input.country || ""),
    minPrice: input.minPrice === "" || input.minPrice == null ? "" : Number(input.minPrice),
    maxPrice: input.maxPrice === "" || input.maxPrice == null ? "" : Number(input.maxPrice),
    minDays: input.minDays === "" || input.minDays == null ? "" : Number(input.minDays),
    maxDays: input.maxDays === "" || input.maxDays == null ? "" : Number(input.maxDays),
    arrivalDate: normalizeText(input.arrivalDate || ""),
    returnDate: normalizeText(input.returnDate || ""),
    featured: normalizeText(input.featured || ""),
    rating: input.rating === "" || input.rating == null ? "" : Number(input.rating),
    tags: normalizeArray(input.tags),
    languages: normalizeArray(input.languages),
    groupSize: input.groupSize === "" || input.groupSize == null ? "" : Number(input.groupSize),
  };

  const assertKnown = (name, value, optionList) => {
    if (!value) return;
    const allowed = getOptionValues(optionList);
    if (allowed.size && !allowed.has(String(value))) errors[name] = "Choose a valid option";
  };

  assertKnown("originCity", clean.originCity, options.originCities);
  assertKnown("destinationCity", clean.destinationCity, options.destinationCities);
  assertKnown("country", clean.country, options.countries);
  assertKnown("featured", clean.featured, options.featured);

  const tagValues = getOptionValues(options.tags);
  clean.tags.forEach((tag) => {
    if (tagValues.size && !tagValues.has(tag)) errors.tags = "Choose valid tags";
  });

  const languageValues = getOptionValues(options.languages);
  clean.languages.forEach((language) => {
    if (languageValues.size && !languageValues.has(language)) errors.languages = "Choose valid languages";
  });

  const numericRules = [
    ["minPrice", 0, options.priceRange?.max ?? Number.MAX_SAFE_INTEGER],
    ["maxPrice", 0, options.priceRange?.max ?? Number.MAX_SAFE_INTEGER],
    ["minDays", 1, options.dayRange?.max || 365],
    ["maxDays", 1, options.dayRange?.max || 365],
    ["groupSize", 1, options.groupSizeRange?.max || 99],
    ["rating", 0, 5],
  ];

  const fieldLabels = {
    minPrice: "Min price",
    maxPrice: "Max price",
    minDays: "Min days",
    maxDays: "Max days",
    groupSize: "Group size",
    rating: "Rating",
  };

  numericRules.forEach(([name, min, max]) => {
    const value = clean[name];
    if (value === "") return;
    if (!Number.isFinite(value)) {
      errors[name] = `${fieldLabels[name] || name} must be a valid number`;
      return;
    }
    if (value < 0) {
      errors[name] = `${fieldLabels[name] || name} cannot be negative`;
      return;
    }
    if (value < min) {
      errors[name] = `${fieldLabels[name] || name} minimum is ${min}`;
      return;
    }
    if (value > max) {
      errors[name] = `${fieldLabels[name] || name} maximum is ${max}`;
    }
  });

  if (clean.minPrice !== "" && clean.maxPrice !== "" && clean.minPrice > clean.maxPrice) {
    errors.minPrice = "Min price must be less than or equal to max price";
    errors.maxPrice = "Max price must be greater than or equal to min price";
  }

  if (clean.minDays !== "" && clean.maxDays !== "" && clean.minDays > clean.maxDays) {
    errors.minDays = "Min days must be less than or equal to max days";
    errors.maxDays = "Max days must be greater than or equal to min days";
  }

  const parseFilterDate = (name) => {
    if (!clean[name]) return null;
    const date = new Date(clean[name]);
    if (Number.isNaN(date.getTime())) {
      errors[name] = "Enter a valid date";
      return null;
    }
    return date;
  };

  const arrival = parseFilterDate("arrivalDate");
  const returnDate = parseFilterDate("returnDate");
  if (arrival && returnDate && arrival > returnDate) {
    errors.arrivalDate = "Arrival must be before return";
    errors.returnDate = "Return must be after arrival";
  }

  if (options.dateRange?.earliest && arrival && arrival < new Date(options.dateRange.earliest)) {
    errors.arrivalDate = `Earliest available arrival date is ${options.dateRange.earliest}`;
  }

  if (options.dateRange?.latest && returnDate && returnDate > new Date(options.dateRange.latest)) {
    errors.returnDate = `Latest available return date is ${options.dateRange.latest}`;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    clean,
  };
};

/* ============================================================
   GET /api/filters → auto-extract options from tours
============================================================ */
export const getFilters = async (req, res) => {
  try {
    const tours = await TourRepository.findLean();
    const options = getFilterFacts(tours);
    const widget = readWidgetJson();

    return sendJson(res, 200, {
      status: "success",
      component: {
        data: {
          summary: {
            totalTours: options.totalTours,
            priceRange: options.priceRange,
            dayRange: options.dayRange,
          },
        },
        dataScope: {
          options: {
            originCityOptions: options.originCities,
            destinationCityOptions: options.destinationCities,
            countryOptions: options.countries,
            tags: options.tags,
            featured: options.featured,
          },
        },
        elements: widget.component.elements,
        structure: widget.component.structure,
      },
      message: "Filters fetched successfully",
    }, req);

  } catch (error) {
    console.error("getFilters error:", error);
    return sendJson(res, 500, {
      status: "error",
      message: "Failed to load filters",
    }, req);
  }
};

/* ============================================================
   POST /api/filters/apply
============================================================ */
export const applyFilters = async (req, res) => {
  try {
    const body = req.body || {};
    const filtersInput = body.filters && typeof body.filters === "object" ? body.filters : body;
    const paging = normalizePaging(body);
    const sort = normalizeSort(body.sort);
    const inventory = await TourRepository.findLean();
    const options = getFilterFacts(inventory);
    const validation = validateFiltersPayload(filtersInput, options);

    if (!validation.ok) {
      return sendJson(res, 400, {
        status: "error",
        message: "Invalid filter values",
        component: {
          data: { tours: [], errors: validation.errors, filters: validation.clean },
          dataScope: { options: {} },
          elements: { labels: {}, urls: {} },
          structure: { header: {}, widgets: [], config: {}, actions: [] },
        },
      }, req);
    }

    const f = validation.clean;

    const q = {};
    const and = [];

    if (f.search) {
      const s = escapeRegExp(String(f.search));
      and.push({ $or: [{ title: new RegExp(s, "i") }, { desc: new RegExp(s, "i") }, { tags: new RegExp(s, "i") }] });
    }

    if (f.originCity) {
      and.push({ "city.from": new RegExp(`^${escapeRegExp(f.originCity)}$`, "i") });
    }

    if (f.destinationCity) {
      and.push({
        $or: [
          { "city.to": new RegExp(`^${escapeRegExp(f.destinationCity)}$`, "i") },
          { "address.city": new RegExp(`^${escapeRegExp(f.destinationCity)}$`, "i") },
        ],
      });
    }

    if (f.country) {
      and.push({ "address.country": new RegExp(`^${escapeRegExp(f.country)}$`, "i") });
    }

    if (f.featured !== undefined && f.featured !== "") {
      q.featured = String(f.featured).toLowerCase() === "true";
    }

    const minDays = safeNum(f.minDays);
    const maxDays = safeNum(f.maxDays);
    if (!Number.isNaN(minDays) || !Number.isNaN(maxDays)) {
      q["period.days"] = {};
      if (!Number.isNaN(minDays)) q["period.days"].$gte = minDays;
      if (!Number.isNaN(maxDays)) q["period.days"].$lte = maxDays;
    }

    if (Array.isArray(f.tags) && f.tags.length > 0) {
      q.tags = { $in: f.tags };
    }
    if (Array.isArray(f.languages) && f.languages.length > 0) {
      q.languages = { $in: f.languages };
    }

    const groupSize = safeNum(f.groupSize);
    if (!Number.isNaN(groupSize)) {
      q.maxGroupSize = { $gte: groupSize };
    }

    if (f.arrivalDate || f.returnDate) {
      const arrival = f.arrivalDate ? new Date(f.arrivalDate) : null;
      const ret = f.returnDate ? new Date(f.returnDate) : null;

      if (arrival && ret) {
        and.push({
          $or: [
            { startDate: { $lte: ret }, endDate: { $gte: arrival } },
            { startDate: null, endDate: null },
          ],
        });
      } else if (arrival) {
        and.push({
          $or: [
            { startDate: { $lte: arrival }, endDate: { $gte: arrival } },
            { startDate: { $gte: arrival } },
            { startDate: null },
          ],
        });
      }
    }

    if (and.length) q.$and = and;

    if (DEBUG) {
      console.debug("applyFilters base mongo query:", JSON.stringify(q, null, 2));
    }

    let candidates = await TourRepository.find(q).sort({ createdAt: -1 }).lean();

    const processed = candidates.map((doc) => {
      const avgRating = computeAvgRating(doc);
      const priceInfo = buildPriceInfo(doc, f.arrivalDate ? new Date(f.arrivalDate) : new Date());
      return { ...doc, avgRating, priceInfo };
    });

    const minP = safeNum(f.minPrice);
    const maxP = safeNum(f.maxPrice);
    const ratingThreshold = safeNum(f.rating);

    const filtered = processed.filter((t) => {
      if (!Number.isNaN(ratingThreshold) && ratingThreshold !== 0) {
        if (!(t.avgRating >= ratingThreshold)) return false;
      }

      if (!Number.isNaN(minP) || !Number.isNaN(maxP)) {
        const p = t.priceInfo || t.price;
        if (!p) return false;
        const tourMin = Number.isFinite(Number(p.min)) ? Number(p.min) : Number.NEGATIVE_INFINITY;
        const tourMax = Number.isFinite(Number(p.max)) ? Number(p.max) : Number.POSITIVE_INFINITY;
        if (!Number.isNaN(minP) && tourMin < minP) return false;
        if (!Number.isNaN(maxP) && tourMax > maxP) return false;
      }

      return true;
    });
    const sorted = sortTours(filtered, sort);
    const total = sorted.length;
    const tours = sorted.slice(paging.skip, paging.skip + paging.limit);
    const totalPages = Math.max(1, Math.ceil(total / paging.limit));

    return sendJson(res, 200, {
      status: "success",
      component: {
        data: {
          tours,
          filters: f,
          sort,
          pagination: {
            page: paging.page,
            limit: paging.limit,
            total,
            totalPages,
            hasMore: paging.page < totalPages,
          },
        },
        dataScope: { options: {} },
        elements: { labels: {}, urls: {} },
        structure: { header: {}, widgets: [], config: {}, actions: [] },
      },
      message: `${total} tours matched`,
    }, req);

  } catch (error) {
    console.error("applyFilters error:", error);
    return sendJson(res, 500, {
      status: "error",
      message: "Failed to apply filters",
      component: {
        data: { tours: [] },
        dataScope: { options: {} },
        elements: { labels: {}, urls: {} },
        structure: { header: {}, widgets: [], config: {}, actions: [] },
      },
    }, req);
  }
};

export default {
  getFilters,
  applyFilters
};
