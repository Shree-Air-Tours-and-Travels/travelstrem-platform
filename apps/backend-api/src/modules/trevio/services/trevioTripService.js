import mongoose from "mongoose";
import TrevioTripRepository from "../repositories/TrevioTripRepository.js";
import { TREVIO_SEED_TRIPS } from "../data/seedTrips.js";

const asPlainObject = (doc) => (doc?.toObject ? doc.toObject({ virtuals: true }) : doc);

const formatDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeItinerary = (items = []) => (Array.isArray(items) ? items : []).map((item) => [
  `Day ${item.day || 1}`,
  item.title || item.location || "Experience day",
  item.summary || (Array.isArray(item.activities) ? item.activities.join(", ") : ""),
]);

const toISODate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const normalizeTrevioTrip = (doc = {}) => {
  const trip = asPlainObject(doc) || {};
  const price = trip.price || {};
  const photos = Array.isArray(trip.photos) ? trip.photos : [];

  return {
    _id: trip._id || null,
    id: trip.slug || trip.id || trip._id,
    slug: trip.slug || trip.id || "",
    title: trip.title || "",
    category: trip.category || "adventure",
    location: trip.location || "India",
    country: trip.country || "India",
    duration: trip.duration || "",
    price: price.amount || 0,
    token: price.tokenAmount || 1999,
    cancellationPolicy: trip.cancellationPolicy || "",
    tag: trip.tag || trip.category || "Curated trip",
    rating: trip.rating || 0,
    image: trip.image || photos[0] || "",
    photo: trip.image || photos[0] || "",
    photos,
    desc: trip.description || "",
    description: trip.description || "",
    chips: Array.isArray(trip.chips) ? trip.chips : [],
    tags: Array.isArray(trip.tags) ? trip.tags : [],
    featured: Boolean(trip.featured),
    status: trip.status || "listed",
    isListed: Boolean(trip.isListed),
    startDate: formatDate(trip.startDate),
    endDate: formatDate(trip.endDate),
    startDateISO: toISODate(trip.startDate),
    endDateISO: toISODate(trip.endDate),
    dates: Array.isArray(trip.dates) && trip.dates.length ? trip.dates : [formatDate(trip.startDate)].filter(Boolean),
    itinerary: normalizeItinerary(trip.itinerary),
    availability: trip.availability || { totalSeats: null, seatsAvailable: null },
    preferences: {
      roomTypes: Array.isArray(trip.preferences?.roomTypes) ? trip.preferences.roomTypes : [],
      mealPreferences: Array.isArray(trip.preferences?.mealPreferences) ? trip.preferences.mealPreferences : [],
      packageTypes: Array.isArray(trip.preferences?.packageTypes) ? trip.preferences.packageTypes : [],
      drinkTypes: Array.isArray(trip.preferences?.drinkTypes) ? trip.preferences.drinkTypes : [],
    },
    reviews: Array.isArray(trip.reviews) ? trip.reviews : [],
    priceInfo: {
      min: price.amount || 0,
      max: price.amount || 0,
      currency: price.currency || "INR",
      isFinal: price.isFinal !== false,
      source: "trevio",
      matchedSeason: null,
      note: "",
    },
  };
};

const isDbReady = () => mongoose.connection.readyState === 1;

const listedQuery = (filters = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query = {
    status: "listed",
    isListed: true,
    $or: [{ endDate: null }, { endDate: { $gte: today } }],
  };

  if (filters.featuredOnly) query.featured = true;
  if (filters.category && filters.category !== "all") {
    query.$and = [{
      $or: [
        { category: filters.category },
        { tags: filters.category },
      ],
    }];
  }

  return query;
};

class TrevioTripService {
  findBySlug(slug) {
    return TrevioTripRepository.findBySlug(String(slug || "").trim().toLowerCase());
  }

  normalize(trip) {
    return normalizeTrevioTrip(trip);
  }

  reserveSeats(slug, count) {
    return TrevioTripRepository.findOneAndUpdate(
      { slug: String(slug || "").trim().toLowerCase(), status: "listed", isListed: true, "availability.seatsAvailable": { $gte: count } },
      { $inc: { "availability.seatsAvailable": -count } },
      { new: true },
    );
  }

  async checkAvailability(slug, count) {
    const trip = await TrevioTripRepository.findOne({
      slug: String(slug || "").trim().toLowerCase(),
      status: "listed",
      isListed: true,
    });
    if (!trip) return null;
    const available = trip.availability?.seatsAvailable ?? null;
    if (available === null) return trip;
    return available >= count ? trip : null;
  }

  releaseSeats(slug, count) {
    return TrevioTripRepository.findOneAndUpdate(
      { slug: String(slug || "").trim().toLowerCase() },
      { $inc: { "availability.seatsAvailable": count } },
      { new: true },
    );
  }

  async listTrips(params = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);
    const category = String(params.category || params.tag || "all").trim().toLowerCase();
    const featuredOnly = params.featured === "true" || params.featured === true;

    if (!isDbReady()) {
      return {
        trips: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasMore: false,
        },
      };
    }

    const query = listedQuery({ category, featuredOnly });
    const skip = (page - 1) * limit;
    let [docs, total] = await Promise.all([
      TrevioTripRepository.find(query).sort({ featured: -1, sortOrder: 1, startDate: 1 }).skip(skip).limit(limit),
      TrevioTripRepository.countDocuments(query),
    ]);

    if (!total) {
      await this.seedTrips();
      [docs, total] = await Promise.all([
        TrevioTripRepository.find(query).sort({ featured: -1, sortOrder: 1, startDate: 1 }).skip(skip).limit(limit),
        TrevioTripRepository.countDocuments(query),
      ]);
    }
    const trips = docs.map(normalizeTrevioTrip);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      trips,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async listInternationalTrips(params = {}) {
    const limit = Math.max(1, Math.min(Number(params.limit) || 3, 10));

    if (!isDbReady()) {
      return { trips: [], total: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
      status: "listed",
      isListed: true,
      tags: "international",
      $or: [{ endDate: null }, { endDate: { $gte: today } }],
    };

    let docs = await TrevioTripRepository.find(query).sort({ sortOrder: 1, startDate: 1 }).limit(limit);

    if (!docs.length) {
      await this.seedTrips();
      docs = await TrevioTripRepository.find(query).sort({ sortOrder: 1, startDate: 1 }).limit(limit);
    }
    const total = await TrevioTripRepository.countDocuments(query);
    const trips = docs.map(normalizeTrevioTrip);

    return { trips, total };
  }

  async seedTrips() {
    if (!isDbReady()) return { seeded: 0, skipped: true };
    for (const trip of TREVIO_SEED_TRIPS) {
      await TrevioTripRepository.upsertBySlug(trip.slug, trip);
    }
    return { seeded: TREVIO_SEED_TRIPS.length, skipped: false };
  }
}

export default new TrevioTripService();
