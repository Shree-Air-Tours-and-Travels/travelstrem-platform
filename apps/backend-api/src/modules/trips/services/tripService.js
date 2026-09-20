import mongoose from "mongoose";
import TripRepository from "../repositories/TripRepository.js";

const asPlainObject = (doc) => (doc?.toObject ? doc.toObject({ virtuals: true }) : doc);

const formatDate = (date) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeItinerary = (items = []) =>
    (Array.isArray(items) ? items : []).map((item) => [
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

const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const routeParts = (value = "") => {
    const [from, to] = String(value || "")
        .split(/\s+to\s+/i)
        .map((item) => item.trim());
    return { from: to ? from : "", to: to || from || "" };
};

const optionValue = (value = "") =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const matchTextFilter = (value = "") => new RegExp(escapeRegex(value), "i");
const matchDestinationFilter = (value = "") => {
    const escaped = escapeRegex(String(value).trim());
    return new RegExp(`^(?:${escaped}(?:\\s*,.*)?|.*\\bto\\s+${escaped}(?:\\s*,.*)?)$`, "i");
};

const daysUntil = (date) => {
    if (!date) return null;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return Math.ceil((parsed.getTime() - today.getTime()) / 86400000);
};

const recentSignalScore = (metrics = {}) => {
    const dates = [
        metrics.lastViewedAt,
        metrics.lastEnquiredAt,
        metrics.lastBookedAt,
        metrics.lastWishlistedAt,
    ]
        .map((value) => (value ? new Date(value) : null))
        .filter((date) => date && !Number.isNaN(date.getTime()));
    if (!dates.length) return 0;
    const latest = Math.max(...dates.map((date) => date.getTime()));
    const ageDays = Math.max(0, (Date.now() - latest) / 86400000);
    return Math.max(0, 12 - ageDays / 2);
};

export const tripIntelligenceScore = (trip = {}) => {
    const metrics = trip.metrics || {};
    const upcomingDays = daysUntil(trip.startDateISO || trip.startDate);
    const upcomingScore =
        upcomingDays == null || upcomingDays < 0
            ? 0
            : upcomingDays <= 7
              ? 28
              : upcomingDays <= 30
                ? 22
                : upcomingDays <= 90
                  ? 14
                  : 6;
    const engagementScore =
        Math.min(18, number(metrics.views) / 12) +
        Math.min(24, number(metrics.enquiries) * 3) +
        Math.min(26, number(metrics.bookings) * 5) +
        Math.min(10, number(metrics.wishlists) * 2) +
        Math.min(16, number(metrics.popularityScore) / 6) +
        Math.min(14, number(metrics.trendScore) / 5);
    const ratingValue = number(trip.avgRating || trip.rating);
    const ratingScore =
        ratingValue > 0 ? ratingValue * 5 + Math.min(10, number(trip.reviewCount) * 1.5) : 0;
    const availabilityScore = trip.availability?.isSoldOut === true ? -20 : 6;

    return (
        upcomingScore +
        engagementScore +
        ratingScore +
        availabilityScore +
        recentSignalScore(metrics) +
        (trip.featured ? 10 : 0) +
        (trip.trending ? 8 : 0) +
        (trip.tremVerified ? 6 : 0) +
        Math.min(16, number(trip.intelligence?.qualityScore) / 5)
    );
};

const sortTrips = (trips = [], sort = "recommended") => {
    const ranked = [...trips];
    switch (sort) {
        case "upcoming":
            ranked.sort((a, b) => (daysUntil(a.startDateISO) ?? 9999) - (daysUntil(b.startDateISO) ?? 9999));
            break;
        case "rating":
            ranked.sort(
                (a, b) =>
                    number(b.avgRating || b.rating) - number(a.avgRating || a.rating) ||
                    number(b.reviewCount) - number(a.reviewCount),
            );
            break;
        case "price_low":
            ranked.sort((a, b) => number(a.price) - number(b.price));
            break;
        case "price_high":
            ranked.sort((a, b) => number(b.price) - number(a.price));
            break;
        case "popular":
        case "recommended":
        default:
            ranked.sort((a, b) => tripIntelligenceScore(b) - tripIntelligenceScore(a));
            break;
    }
    return ranked;
};

export const normalizeTrip = (doc = {}) => {
    const trip = asPlainObject(doc) || {};
    const price = trip.price || {};
    const photos = Array.isArray(trip.photos) ? trip.photos : [];
    const reviews = (Array.isArray(trip.reviews) ? trip.reviews : []).filter(
        (review) => Number(review?.rating) > 0,
    );
    const rawAvgRating = reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
        : 0;
    const avgRating = Math.round(rawAvgRating * 10) / 10;
    const availability = trip.availability || { totalSeats: null, seatsAvailable: null };
    const seatsAvailable =
        availability.seatsAvailable == null ? null : Number(availability.seatsAvailable);
    const lowSeatThreshold = Math.max(0, Number(process.env.TREVIO_LOW_SEAT_THRESHOLD || 3));
    const agency = trip.agencyId && typeof trip.agencyId === "object" ? trip.agencyId : null;
    const parsedRoute = routeParts(trip.location);
    const routeFrom = trip.routeFrom || parsedRoute.from || "";
    const routeTo = trip.routeTo || parsedRoute.to || trip.location || "";
    const tripPackages = (Array.isArray(trip.preferences?.packageTypes)
        ? trip.preferences.packageTypes
        : []
    ).map((item, index) => ({
        packageKey: item.value,
        tier: item.value,
        name: item.label,
        description: item.description || "",
        includesFlights: Boolean(item.includesFlights),
        sellingTotalMinor: Math.round(
            Math.max(0, Number(price.amount || 0) + Number(item.extraPrice || 0)) * 100,
        ),
        included: [
            item.includesFlights ? "Flights included" : "Flights not included",
            ...(trip.inclusions || []).slice(0, 4),
        ],
        optional: (trip.extras || [])
            .filter((extra) => !extra.included)
            .slice(0, 4)
            .map((extra) => extra.title),
        sortOrder: index,
    }));

    return {
        _id: trip._id || null,
        sourceTourId: trip.sourceTourId || null,
        id: trip.slug || trip.id || trip._id,
        slug: trip.slug || trip.id || "",
        productKey: trip.productKey || "trevio",
        productType: "trip",
        title: trip.title || "",
        category: trip.category || "adventure",
        routeFrom,
        routeTo,
        location: trip.location || "India",
        country: trip.country || "India",
        duration: trip.duration || "",
        price: price.amount || 0,
        token: price.tokenAmount || 1999,
        cancellationPolicy: trip.cancellationPolicy || "",
        tag: trip.tag || trip.category || "Curated trip",
        rating: avgRating,
        avgRating,
        reviewCount: reviews.length,
        metrics: trip.metrics || {},
        intelligence: trip.intelligence || {},
        image: trip.image || photos[0] || "",
        photo: trip.image || photos[0] || "",
        photos,
        desc: trip.description || "",
        description: trip.description || "",
        chips: Array.isArray(trip.chips) ? trip.chips : [],
        tags: Array.isArray(trip.tags) ? trip.tags : [],
        featured: Boolean(trip.featured),
        trending: Boolean(trip.trending),
        status: trip.status || "listed",
        isListed: Boolean(trip.isListed),
        tremVerified: Boolean(trip.tremVerified),
        tremVerifiedAt: trip.tremVerifiedAt || null,
        agency: agency
            ? {
                  id: agency._id || agency.id || null,
                  name: agency.agencyName || "",
                  reference: agency.partnerAgencyRef || "",
                  logo: agency.logo || "",
                  website: agency.website || "",
                  location: [agency.address?.city, agency.address?.state, agency.address?.country]
                      .filter(Boolean)
                      .join(", "),
              }
            : null,
        operator:
            trip.ownerAgent && typeof trip.ownerAgent === "object"
                ? {
                      name: trip.ownerAgent.name || "",
                      email: trip.ownerAgent.email || "",
                      reference: trip.ownerAgent.agentRef || "",
                  }
                : null,
        ownerAgentName:
            trip.ownerAgent && typeof trip.ownerAgent === "object" ? trip.ownerAgent.name || "" : "",
        ownerAgentEmail:
            trip.ownerAgent && typeof trip.ownerAgent === "object"
                ? trip.ownerAgent.email || ""
                : "",
        ownerAgentRef:
            trip.ownerAgent && typeof trip.ownerAgent === "object"
                ? trip.ownerAgent.agentRef || ""
                : "",
        startDate: formatDate(trip.startDate),
        endDate: formatDate(trip.endDate),
        startDateISO: toISODate(trip.startDate),
        endDateISO: toISODate(trip.endDate),
        dates:
            Array.isArray(trip.dates) && trip.dates.length
                ? trip.dates
                : [formatDate(trip.startDate)].filter(Boolean),
        itinerary: normalizeItinerary(trip.itinerary),
        availability: {
            ...availability,
            isSoldOut: seatsAvailable === 0,
            isLowSeats:
                seatsAvailable != null && seatsAvailable > 0 && seatsAvailable <= lowSeatThreshold,
            availabilityMessage:
                seatsAvailable === 0
                    ? "This trip is currently sold out."
                    : seatsAvailable != null &&
                        seatsAvailable > 0 &&
                        seatsAvailable <= lowSeatThreshold
                      ? `Only ${seatsAvailable} spot${seatsAvailable === 1 ? "" : "s"} left!`
                      : seatsAvailable == null
                        ? ""
                        : `${seatsAvailable} seats available`,
        },
        preferences: {
            roomTypes: Array.isArray(trip.preferences?.roomTypes) ? trip.preferences.roomTypes : [],
            mealPreferences: Array.isArray(trip.preferences?.mealPreferences)
                ? trip.preferences.mealPreferences
                : [],
            packageTypes: Array.isArray(trip.preferences?.packageTypes)
                ? trip.preferences.packageTypes
                : [],
            drinkTypes: Array.isArray(trip.preferences?.drinkTypes)
                ? trip.preferences.drinkTypes
                : [],
        },
        commercialPricing: {
            currency: price.currency || "INR",
            packages: tripPackages,
        },
        reviews,
        includedStays: Array.isArray(trip.includedStays) ? trip.includedStays : [],
        hotelOptions: Array.isArray(trip.hotelOptions) ? trip.hotelOptions : [],
        cancellation: trip.cancellation || null,
        extras: Array.isArray(trip.extras) ? trip.extras : [],
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
    const and = [];

    if (filters.category && filters.category !== "all") {
        and.push(
            {
                $or: [{ category: filters.category }, { tags: filters.category }],
            },
        );
    }

    if (filters.search) {
        const search = new RegExp(escapeRegex(filters.search), "i");
        const destination = matchDestinationFilter(filters.search);
        and.push({
            $or: [
                { title: search },
                { routeTo: search },
                { location: destination },
                { country: search },
                { category: search },
                { tags: search },
            ],
        });
    }

    if (filters.destination) {
        const destination = matchTextFilter(filters.destination);
        const location = matchDestinationFilter(filters.destination);
        and.push({
            $or: [
                { routeTo: destination },
                { location },
                { country: destination },
                { title: destination },
            ],
        });
    }

    if (filters.from && filters.from !== "all") {
        const from = matchTextFilter(filters.from);
        and.push({ $or: [{ routeFrom: from }, { location: from }, { title: from }] });
    }

    if (filters.to && filters.to !== "all") {
        const to = matchTextFilter(filters.to);
        and.push({ $or: [{ routeTo: to }, { location: to }, { title: to }] });
    }

    if (filters.maxBudget) {
        and.push({ "price.amount": { $lte: number(filters.maxBudget) } });
    }

    if (filters.startDate) and.push({ startDate: { $gte: filters.startDate } });
    if (filters.endDate) and.push({ endDate: { $lte: filters.endDate } });
    if (filters.travellers) {
        and.push({
            $or: [
                { "availability.seatsAvailable": null },
                { "availability.seatsAvailable": { $gte: filters.travellers } },
            ],
        });
    }

    if (filters.flights === "with") {
        and.push({ "preferences.packageTypes.includesFlights": true });
    } else if (filters.flights === "without") {
        and.push({ "preferences.packageTypes.includesFlights": false });
    }

    if (and.length) query.$and = and;

    return query;
};

class TripService {
    findBySlug(slug) {
        return TripRepository.findBySlug(
            String(slug || "")
                .trim()
                .toLowerCase(),
        );
    }

    normalize(trip) {
        return normalizeTrip(trip);
    }

    async listTrips(params = {}) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(Number(params.limit) || 20, 60));
        const category = String(params.category || params.tag || "all")
            .trim()
            .toLowerCase();
        const featuredOnly = params.featured === "true" || params.featured === true;
        const search = String(params.search || params.query || params.q || "").trim();
        const destination = String(params.destination || "").trim();
        const sort = String(params.sort || "recommended").trim() || "recommended";
        const from = String(params.from || "").trim();
        const to = String(params.to || "").trim();
        const maxBudget = Number(params.maxBudget || params.budget || 0);
        const flights = String(params.flights || "").trim();
        const startDate = /^\d{4}-\d{2}-\d{2}$/.test(params.startDate || "")
            ? new Date(`${params.startDate}T00:00:00.000Z`)
            : null;
        const endDate = /^\d{4}-\d{2}-\d{2}$/.test(params.endDate || "")
            ? new Date(`${params.endDate}T23:59:59.999Z`)
            : null;
        const travellers = Math.max(0, Number(params.travellers) || 0);

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

        const query = listedQuery({
            category,
            featuredOnly,
            search,
            destination,
            from,
            to,
            maxBudget: Number.isFinite(maxBudget) && maxBudget > 0 ? maxBudget : null,
            flights,
            startDate: startDate && !Number.isNaN(startDate.getTime()) ? startDate : null,
            endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
            travellers: Number.isFinite(travellers) ? travellers : 0,
        });
        const skip = (page - 1) * limit;
        const docs = await TripRepository.find(query)
            .sort({ featured: -1, trending: -1, sortOrder: 1, startDate: 1 })
            .limit(300);

        const rankedTrips = sortTrips(docs.map(normalizeTrip), sort);
        const total = rankedTrips.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const trips = rankedTrips.slice(skip, skip + limit);

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

    async listFeaturedTrips(params = {}) {
        const limit = Math.max(1, Math.min(Number(params.limit) || 4, 12));

        if (!isDbReady()) {
            return { trips: [], total: 0 };
        }

        const docs = await TripRepository.find(listedQuery())
            .sort({ featured: -1, trending: -1, sortOrder: 1, startDate: 1 })
            .limit(120);
        const trips = sortTrips(docs.map(normalizeTrip), "recommended").slice(0, limit);

        return { trips, total: trips.length };
    }

    async getTripFilterOptions() {
        if (!isDbReady()) {
            return { origins: [], destinations: [] };
        }

        const docs = await TripRepository.find(listedQuery())
            .sort({ sortOrder: 1, startDate: 1 })
            .limit(300);
        const trips = docs.map(normalizeTrip);
        const toOptions = (values = []) =>
            [...new Map(
                values
                    .map((label) => String(label || "").trim())
                    .filter(Boolean)
                    .map((label) => [optionValue(label), label]),
            )]
                .map(([, label], index) => ({ value: label, label, sortOrder: index * 10 }))
                .sort((a, b) => a.label.localeCompare(b.label));

        return {
            origins: toOptions(trips.map((trip) => trip.routeFrom)),
            destinations: toOptions(trips.map((trip) => trip.routeTo || trip.location)),
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

        const docs = await TripRepository.find(query)
            .sort({ sortOrder: 1, startDate: 1 })
            .limit(limit);
        const total = await TripRepository.countDocuments(query);
        const trips = docs.map(normalizeTrip);

        return { trips, total };
    }
}

export default new TripService();
