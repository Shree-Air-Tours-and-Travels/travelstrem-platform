// server/controllers/filtersController.js
import Tour from "../../models/Tour.js";
import config from "../../config/index.js";

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
    const hydrated = Tour.hydrate(doc);
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
    ["minPrice", options.priceRange?.min ?? 0, options.priceRange?.max ?? Number.MAX_SAFE_INTEGER],
    ["maxPrice", options.priceRange?.min ?? 0, options.priceRange?.max ?? Number.MAX_SAFE_INTEGER],
    ["minDays", options.dayRange?.min || 1, options.dayRange?.max || 365],
    ["maxDays", options.dayRange?.min || 1, options.dayRange?.max || 365],
    ["groupSize", 1, options.groupSizeRange?.max || 99],
    ["rating", 0, 5],
  ];

  numericRules.forEach(([name, min, max]) => {
    const value = clean[name];
    if (value === "") return;
    if (!Number.isFinite(value)) {
      errors[name] = "Enter a valid number";
      return;
    }
    if (value < min) errors[name] = `Minimum ${min}`;
    if (value > max) errors[name] = `Maximum ${max}`;
  });

  if (clean.minPrice !== "" && clean.maxPrice !== "" && clean.minPrice > clean.maxPrice) {
    errors.minPrice = "Min price must be below max";
    errors.maxPrice = "Max price must be above min";
  }

  if (clean.minDays !== "" && clean.maxDays !== "" && clean.minDays > clean.maxDays) {
    errors.minDays = "Min days must be below max";
    errors.maxDays = "Max days must be above min";
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
    errors.arrivalDate = `Earliest ${options.dateRange.earliest}`;
  }

  if (options.dateRange?.latest && returnDate && returnDate > new Date(options.dateRange.latest)) {
    errors.returnDate = `Latest ${options.dateRange.latest}`;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    clean,
  };
};

/* ============================================================
   GET /api/filters → auto-extract options from tours
   (kept largely as you already had it)
============================================================ */
export const getFilters = async (req, res) => {
  try {
    const tours = await Tour.find().lean();
    const options = getFilterFacts(tours);

    const componentData = {
      title: "Find your next route",
      description: "Exact options from live tour inventory",
      structure: {
        fields: [
          { name: "search", label: "Search tours", type: "text", value: "", maxLength: 80, placeholder: "Jaipur, island, palace..." },
          { name: "originCity", label: "From", type: "select", value: "", optionsSource: "originCities" },
          { name: "destinationCity", label: "To", type: "select", value: "", optionsSource: "destinationCities" },
          { name: "country", label: "Country", type: "select", value: "", optionsSource: "countries" },
          { name: "minPrice", label: "Min price", type: "number", value: "", min: options.priceRange.min, max: options.priceRange.max },
          { name: "maxPrice", label: "Max price", type: "number", value: "", min: options.priceRange.min, max: options.priceRange.max },
          { name: "minDays", label: "Min days", type: "number", value: "", min: options.dayRange.min || 1, max: options.dayRange.max || 365 },
          { name: "maxDays", label: "Max days", type: "number", value: "", min: options.dayRange.min || 1, max: options.dayRange.max || 365 },
          { name: "arrivalDate", label: "Arrival", type: "date", value: "" },
          { name: "returnDate", label: "Return", type: "date", value: "" },
          { name: "featured", label: "Feature status", type: "select", value: "", optionsSource: "featured" },
          { name: "rating", label: "Rating", type: "select", value: "", optionsSource: "ratings" },
          { name: "tags", label: "Interests", type: "multiselect", value: [], optionsSource: "tags" },
          { name: "languages", label: "Languages", type: "multiselect", value: [], optionsSource: "languages" },
          { name: "groupSize", label: "Travelers", type: "number", value: "", min: 1, max: options.groupSizeRange.max || 99 }
        ],
        actions: [
          {
            name: "apply",
            label: "Apply Filters",
            method: "POST",
            endpoint: "/filters.json/apply",
          },
          {
            name: "reset",
            label: "Reset",
            method: "GET",
            endpoint: "/tours.json",
          }
        ],
        layout: {
          rows: [
            ["search"],
            ["originCity", "destinationCity"],
            ["country", "featured"],
            ["minPrice", "maxPrice"],
            ["minDays", "maxDays"],
            ["arrivalDate", "returnDate"],
            ["rating", "groupSize"],
            ["tags", "languages"],
          ]
        }
      },

      config: {
        defaults: {
          search: "",
          originCity: "",
          destinationCity: "",
          country: "",
          minPrice: "",
          maxPrice: "",
          minDays: "",
          maxDays: "",
          arrivalDate: "",
          returnDate: "",
          featured: "",
          rating: "",
          tags: [],
          languages: [],
          groupSize: ""
        },
        options,
        validation: {
          priceRange: options.priceRange,
          dayRange: options.dayRange,
          groupSizeRange: options.groupSizeRange,
          dateRange: options.dateRange,
          exactOptions: ["originCity", "destinationCity", "country", "featured", "rating", "tags", "languages"]
        },
        summary: {
          totalTours: options.totalTours,
          priceRange: options.priceRange,
          dayRange: options.dayRange,
        }
      }
    };

    return sendJson(res, 200, {
      status: "success",
      componentData
    }, req);

  } catch (error) {
    console.error("getFilters error:", error);
    return sendJson(res, 500, {
      status: "error",
      message: "Failed to load filters",
      componentData: {}
    }, req);
  }
};

/* ============================================================
   POST /api/filters/apply
   - Build a Mongo query for direct-matchable fields
   - Fetch candidates via .find(q).lean()
   - Hydrate each doc to compute priceInfo via getCurrentPrice (if defined)
   - Compute avgRating from reviews (virtuals absent in lean)
   - Apply the remaining filters in-memory (price overlap, rating)
   - Return componentData.state.data.tours = [..]
============================================================ */
export const applyFilters = async (req, res) => {
  try {
    const inventory = await Tour.find().lean();
    const options = getFilterFacts(inventory);
    const validation = validateFiltersPayload(req.body || {}, options);

    if (!validation.ok) {
      return sendJson(res, 400, {
        status: "error",
        message: "Invalid filter values",
        componentData: {
          state: {
            data: {
              tours: [],
              errors: validation.errors,
              filters: validation.clean,
            },
          },
          config: { options, validation: { errors: validation.errors } },
        },
      }, req);
    }

    const f = validation.clean;

    // Build base mongo query for things expressible directly in Mongo
    const q = {};
    const and = [];

    // Search (title or desc) — escape user input
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

    // Featured
    if (f.featured !== undefined && f.featured !== "") {
      q.featured = String(f.featured).toLowerCase() === "true";
    }

    // Days (period.days)
    const minDays = safeNum(f.minDays);
    const maxDays = safeNum(f.maxDays);
    if (!Number.isNaN(minDays) || !Number.isNaN(maxDays)) {
      q["period.days"] = {};
      if (!Number.isNaN(minDays)) q["period.days"].$gte = minDays;
      if (!Number.isNaN(maxDays)) q["period.days"].$lte = maxDays;
    }

    // Tags & languages — Mongo $in
    if (Array.isArray(f.tags) && f.tags.length > 0) {
      q.tags = { $in: f.tags };
    }
    if (Array.isArray(f.languages) && f.languages.length > 0) {
      q.languages = { $in: f.languages };
    }

    // groupSize (maxGroupSize >= groupSize)
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

    // Fetch candidate docs (lean for speed)
    let candidates = await Tour.find(q).sort({ createdAt: -1 }).lean();

    // For each candidate, compute derived fields used by UI: priceInfo & avgRating
    const processed = candidates.map((doc) => {
      const avgRating = computeAvgRating(doc);
      const priceInfo = buildPriceInfo(doc, f.arrivalDate ? new Date(f.arrivalDate) : new Date());

      return { ...doc, avgRating, priceInfo };
    });

    // Now apply in-memory filters (price overlap, rating)
    const minP = safeNum(f.minPrice);
    const maxP = safeNum(f.maxPrice);
    const ratingThreshold = safeNum(f.rating);

    const filtered = processed.filter((t) => {
      // rating
      if (!Number.isNaN(ratingThreshold) && ratingThreshold !== 0) {
        if (!(t.avgRating >= ratingThreshold)) return false;
      }

      // price (range overlap)
      if (!Number.isNaN(minP) || !Number.isNaN(maxP)) {
        const p = t.priceInfo || t.price;
        if (!p) return false;
        const tourMin = Number.isFinite(Number(p.min)) ? Number(p.min) : Number.NEGATIVE_INFINITY;
        const tourMax = Number.isFinite(Number(p.max)) ? Number(p.max) : Number.POSITIVE_INFINITY;
        if (!Number.isNaN(minP) && tourMax < minP) return false;
        if (!Number.isNaN(maxP) && tourMin > maxP) return false;
      }

      return true;
    });

    // Return in the same shape your frontend expects
    return sendJson(res, 200, {
      status: "success",
      message: `${filtered.length} tours matched`,
      componentData: {
        state: {
          data: {
            tours: filtered,
            total: filtered.length,
            filters: f,
          },
        },
        config: {
          options,
          validation: {
            errors: {},
          },
        },
      }
    }, req);

  } catch (error) {
    console.error("applyFilters error:", error);
    return sendJson(res, 500, {
      status: "error",
      message: "Failed to apply filters",
      componentData: { state: { data: { tours: [] } } }
    }, req);
  }
};

export default {
  getFilters,
  applyFilters
};
