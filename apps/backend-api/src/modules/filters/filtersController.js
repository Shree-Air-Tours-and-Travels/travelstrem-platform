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

/* ============================================================
   GET /api/filters → auto-extract options from tours
   (kept largely as you already had it)
============================================================ */
export const getFilters = async (req, res) => {
  try {
    const tours = await Tour.find().lean();

    const cities = new Set();
    const tags = new Set();
    const languages = new Set();

    tours.forEach((t) => {
      if (t.address?.city) cities.add(String(t.address.city).trim());
      // if you sometimes store city as { from, to }, include those too
      if (t.city?.from) cities.add(String(t.city.from).trim());
      if (t.city?.to) cities.add(String(t.city.to).trim());
      if (Array.isArray(t.tags)) t.tags.forEach((tag) => tag && tags.add(tag));
      if (Array.isArray(t.languages)) t.languages.forEach((lng) => lng && languages.add(lng));
    });

    const componentData = {
      title: "Filters",
      description: "Refine your search",
      structure: {
        fields: [
          { name: "search", label: "Search", type: "text", value: "" },
          { name: "city", label: "City", type: "select", value: "" },
          { name: "minPrice", label: "Min Price", type: "number", value: "" },
          { name: "maxPrice", label: "Max Price", type: "number", value: "" },
          { name: "minDays", label: "Min Days", type: "number", value: "" },
          { name: "maxDays", label: "Max Days", type: "number", value: "" },
          { name: "featured", label: "Featured", type: "select", value: "" },
          { name: "rating", label: "Rating", type: "select", value: "" },
          { name: "tags", label: "Tags", type: "multiselect", value: [] },
          { name: "languages", label: "Languages", type: "multiselect", value: [] },
          { name: "groupSize", label: "Max Group Size", type: "number", value: "" }
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
            ["search", "city"],
            ["minPrice", "maxPrice"],
            ["minDays", "maxDays"],
            ["featured", "rating"],
            ["tags", "languages"],
            ["groupSize"]
          ]
        }
      },

      config: {
        defaults: {
          search: "",
          city: "",
          minPrice: "",
          maxPrice: "",
          minDays: "",
          maxDays: "",
          featured: "",
          rating: "",
          tags: [],
          languages: [],
          groupSize: ""
        },

        options: {
          cities: [...cities].sort(),
          tags: [...tags].sort(),
          languages: [...languages].sort(),
          featured: [
            { label: "Any", value: "" },
            { label: "Featured", value: "true" },
            { label: "Not Featured", value: "false" }
          ],
          ratings: [
            { label: "Any", value: "" },
            { label: "4+ Stars", value: "4" },
            { label: "3+ Stars", value: "3" },
            { label: "2+ Stars", value: "2" }
          ]
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
    const f = req.body || {};

    // Build base mongo query for things expressible directly in Mongo
    const q = {};

    // Search (title or desc) — escape user input
    if (f.search) {
      const s = escapeRegExp(String(f.search));
      q.$or = [{ title: new RegExp(s, "i") }, { desc: new RegExp(s, "i") }];
    }

    // City — check address.city OR city.to OR city.from
    if (f.city) {
      const c = String(f.city).trim();
      // We'll query address.city case-insensitive OR city.to/from case-insensitive
      q.$or = q.$or || [];
      q.$or.push({ "address.city": new RegExp(`^${escapeRegExp(c)}$`, "i") });
      q.$or.push({ "city.to": new RegExp(`^${escapeRegExp(c)}$`, "i") });
      q.$or.push({ "city.from": new RegExp(`^${escapeRegExp(c)}$`, "i") });
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

    if (DEBUG) {
      console.debug("applyFilters base mongo query:", JSON.stringify(q, null, 2));
    }

    // Fetch candidate docs (lean for speed)
    let candidates = await Tour.find(q).sort({ createdAt: -1 }).lean();

    // For each candidate, compute derived fields used by UI: priceInfo & avgRating
    const processed = candidates.map((doc) => {
      // compute avgRating from reviews (virtuals missing when using .lean())
      let avgRating = 0;
      if (Array.isArray(doc.reviews) && doc.reviews.length > 0) {
        const sum = doc.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        avgRating = +(sum / doc.reviews.length).toFixed(1);
      }

      // compute priceInfo using model helper if available — hydrate to access methods
      let priceInfo = null;
      try {
        const hydrated = Tour.hydrate(doc);
        if (typeof hydrated.getCurrentPrice === "function") {
          // if user passed arrivalDate we could use it; fallback to now
          const arrivalDate = f.arrivalDate ? new Date(f.arrivalDate) : new Date();
          priceInfo = hydrated.getCurrentPrice(arrivalDate);
        }
      } catch (e) {
        // fallback to raw price
        if (doc.price) {
          priceInfo = {
            min: doc.price.min,
            max: doc.price.max,
            currency: doc.price.currency,
            isFinal: !!doc.price.isFinal,
            source: doc.price.source || "manual",
            matchedSeason: null,
            note: ""
          };
        }
      }

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
      componentData: {
        state: { data: { tours: filtered } }
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
