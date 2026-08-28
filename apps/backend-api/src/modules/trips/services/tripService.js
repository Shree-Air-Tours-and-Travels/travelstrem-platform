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
        rating: avgRating,
        avgRating,
        reviewCount: reviews.length,
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
                      reference: trip.ownerAgent.agentRef || "",
                  }
                : null,
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
    if (filters.category && filters.category !== "all") {
        query.$and = [
            {
                $or: [{ category: filters.category }, { tags: filters.category }],
            },
        ];
    }

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
        const limit = Math.max(1, Number(params.limit) || 20);
        const category = String(params.category || params.tag || "all")
            .trim()
            .toLowerCase();
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
        const [docs, total] = await Promise.all([
            TripRepository.find(query)
                .sort({ featured: -1, sortOrder: 1, startDate: 1 })
                .skip(skip)
                .limit(limit),
            TripRepository.countDocuments(query),
        ]);

        const trips = docs.map(normalizeTrip);
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

        const docs = await TripRepository.find(query)
            .sort({ sortOrder: 1, startDate: 1 })
            .limit(limit);
        const total = await TripRepository.countDocuments(query);
        const trips = docs.map(normalizeTrip);

        return { trips, total };
    }
}

export default new TripService();
