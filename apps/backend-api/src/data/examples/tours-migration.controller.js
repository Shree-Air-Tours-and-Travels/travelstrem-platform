/**
 * Tours Controller - Page Definition Pattern
 * 
 * BEFORE:
 *   readStaticPayload() → buildComponentData() → sendJson()
 *   Component data manually assembled with hardcoded strings
 * 
 * AFTER:
 *   pageDefinitionService builds the envelope from page definition
 *   Controller provides only dynamic tour data via injectData
 *   Labels come from page definition, not from controller
 */

import pageDefinitionService from "../../services/pageDefinitionService.js";
import Tour from "../modules/tours/models/Tour.js";
import config from "../config/index.js";

const NODE_ENV = (config.nodeEnv || "development").toString().trim();
const IS_DEVELOPMENT = NODE_ENV === "development";

const sendJson = (res, statusCode, body, req) => {
  if (!IS_DEVELOPMENT) return res.status(statusCode).json(body);
  const delayMs = Number(req?.query?.delayMs) || 3000;
  if (!delayMs) return res.status(statusCode).json(body);
  return setTimeout(() => res.status(statusCode).json(body), delayMs);
};

const buildPriceInfo = (doc, date = new Date()) => {
  try {
    if (doc && typeof doc.getCurrentPrice === "function") {
      return doc.getCurrentPrice(date);
    }
  } catch {}
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

const normalizeTourForResponse = (tourObj = {}, priceInfo = null) => ({
  _id: tourObj._id || tourObj.id || null,
  title: tourObj.title || "",
  city: tourObj.city || null,
  address: tourObj.address || null,
  distance: typeof tourObj.distance === "number" ? tourObj.distance : null,
  period: tourObj.period || null,
  startDate: tourObj.startDate || null,
  endDate: tourObj.endDate || null,
  photo: tourObj.photo || "",
  photos: Array.isArray(tourObj.photos) ? tourObj.photos : [],
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
  maxGroupSize: tourObj.maxGroupSize || null,
  reviews: Array.isArray(tourObj.reviews) ? tourObj.reviews : [],
  featured: !!tourObj.featured,
  tags: Array.isArray(tourObj.tags) ? tourObj.tags : [],
  isPublished: typeof tourObj.isPublished === "boolean" ? tourObj.isPublished : true,
  status: tourObj.status || "published",
  createdAt: tourObj.createdAt || null,
  updatedAt: tourObj.updatedAt || null,
  avgRating:
    tourObj.avgRating != null
      ? tourObj.avgRating
      : Array.isArray(tourObj.reviews) && tourObj.reviews.length
        ? (tourObj.reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / tourObj.reviews.length).toFixed(1)
        : 0,
  priceInfo: priceInfo || null,
});

/**
 * @example
 * GET /api/tours.json
 * 
 * Response shape (preserves existing contract shape via wrapper):
 * {
 *   "status": "success",
 *   "message": "Tours fetched successfully",
 *   "handler": "user",
 *   "componentData": {
 *     "state": { "data": { "title": "...", "tours": [...] } },
 *     "structure": null,
 *     "config": { "header": { "title": "Back to Tours" } },
 *     "actions": {}
 *   }
 * }
 * 
 * MIGRATED response shape:
 * {
 *   "status": "success",
 *   "component": {
 *     "data": { "title": "...", "description": "", "itemIds": [] },
 *     "elements": { "labels": { ... }, "urls": { ... } },
 *     "structure": { "widgets": [...] }
 *   },
 *   "handler": "user",
 *   "tours": [...]  ← dynamic data appended at top level
 * }
 */
export const getTours = async (req, res) => {
  const handler = req.query?.handler || "user";
  const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();
  const limit = Math.max(0, Math.min(Number(req.query?.limit) || 0, 50));
  const featuredOnly = req.query?.featured === "true";

  try {
    const query = featuredOnly ? { featured: true } : {};
    let toursQuery = Tour.find(query).sort({ createdAt: -1 });
    if (limit) toursQuery = toursQuery.limit(limit);
    const toursRaw = await toursQuery;

    const tours = (Array.isArray(toursRaw) ? toursRaw : []).map((doc) => {
      const tourObj = doc.toObject ? doc.toObject() : doc;
      const priceInfo = buildPriceInfo(doc, dateQuery);
      return normalizeTourForResponse(tourObj, priceInfo);
    });

    const pageKey = "customer-shell/tours";
    const response = pageDefinitionService.buildPageResponse(pageKey, {
      injectData: { title: "Our Popular Tour Packages", description: "" },
    });

    response.handler = handler;
    response.tours = tours;

    return sendJson(res, 200, response, req);
  } catch (error) {
    console.error("getTours error:", error);
    const pageKey = "customer-shell/tours";
    const response = pageDefinitionService.buildPageResponse(pageKey, {});
    response.handler = handler;
    response.tours = [];
    response.status = "error";
    response.message = "Failed to fetch tours";
    response.error = error.message;

    return sendJson(res, 500, response, req);
  }
};

/**
 * @example
 * GET /api/tours.json/:tourRef
 */
export const getTourByRef = async (req, res) => {
  const handler = req.query?.handler || "user";
  const { tourRef } = req.params;
  const dateQuery = req.query?.date ? new Date(req.query.date) : new Date();

  try {
    const ref = decodeURIComponent(String(tourRef || "")).trim();
    let tour = null;

    if (/^[0-9a-fA-F]{24}$/.test(ref)) {
      tour = await Tour.findById(ref);
    }

    if (!tour) {
      const response = pageDefinitionService.buildPageResponse("tours-remote/details", {});
      response.handler = handler;
      response.tour = null;
      return sendJson(res, 404, response, req);
    }

    const tourObj = tour.toObject ? tour.toObject() : tour;
    const priceInfo = buildPriceInfo(tour, dateQuery);
    const normalized = normalizeTourForResponse(tourObj, priceInfo);

    const response = pageDefinitionService.buildPageResponse("tours-remote/details", {
      injectData: {
        title: normalized.title || "Tour Details",
        itemIds: [normalized._id],
      },
    });

    response.handler = handler;
    response.tour = normalized;

    return sendJson(res, 200, response, req);
  } catch (error) {
    console.error("getTourByRef error:", error);
    const response = pageDefinitionService.buildPageResponse("tours-remote/details", {});
    response.handler = handler;
    response.tour = null;
    response.status = "error";
    response.message = "Failed to fetch tour";
    response.error = error.message;
    return sendJson(res, 500, response, req);
  }
};
