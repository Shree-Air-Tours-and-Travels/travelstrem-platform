import BookingQuote from "../bookings/models/BookingQuote.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import Tour from "../tours/models/Tour.js";
import Trip from "../trips/models/Trip.js";

const FEATURE_LIMIT = 4;
const SNAPSHOT_LIMIT = 500;

const formatPrice = (amount, currency = "INR") => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return "";
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            maximumFractionDigits: 0,
        }).format(numericAmount);
    } catch {
        return `${currency || "INR"} ${numericAmount.toLocaleString("en-IN")}`;
    }
};

const compactText = (value, maximumLength = 150) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > maximumLength ? `${text.slice(0, maximumLength - 1).trim()}…` : text;
};

const firstText = (...values) =>
    values.map((value) => String(value || "").trim()).find(Boolean) || "";

const tourDestination = (tour) =>
    firstText(
        tour?.primaryDestination?.cityName,
        tour?.primaryDestination?.regionName,
        tour?.primaryDestination?.countryName,
        tour?.city?.to,
        tour?.address?.city,
    );

const mapTour = (tour) => {
    const destination = tourDestination(tour);
    const days = Number(tour?.period?.days || 0);
    const rating = Number(tour?.rating?.average || 0);
    return {
        id: String(tour?._id || tour?.slug),
        title: tour?.title || "",
        description: compactText(tour?.shortDescription || tour?.desc),
        image: firstText(tour?.photo, ...(tour?.photos || [])),
        imageAlt: tour?.title || destination,
        badgeRef: tour?.featured ? "featuredBadge" : tour?.trending ? "trendingBadge" : "",
        meta: [
            days > 0 ? { icon: "calendarDays", label: `${days} day${days === 1 ? "" : "s"}` } : null,
            destination ? { icon: "mapPin", label: destination } : null,
            rating > 0 ? { icon: "star", label: rating.toFixed(1) } : null,
        ].filter(Boolean),
        priceLabelRef: "tourPriceLabel",
        price: formatPrice(tour?.price?.min, tour?.price?.currency),
        actionLabelRef: "viewTourAction",
        href: `/trevista/tours/${encodeURIComponent(tour?.slug || tour?._id)}`,
    };
};

const mapTrip = (trip) => {
    const destination = firstText(trip?.routeTo, trip?.location, trip?.country);
    const rating = Number(trip?.rating || 0);
    return {
        id: String(trip?._id || trip?.slug),
        title: trip?.title || "",
        description: compactText(trip?.description),
        image: firstText(trip?.image, ...(trip?.photos || [])),
        imageAlt: trip?.title || destination,
        badgeRef: trip?.featured ? "featuredBadge" : trip?.trending ? "trendingBadge" : "",
        meta: [
            trip?.duration ? { icon: "calendarDays", label: trip.duration } : null,
            destination ? { icon: "mapPin", label: destination } : null,
            rating > 0 ? { icon: "star", label: rating.toFixed(1) } : null,
        ].filter(Boolean),
        priceLabelRef: "tripPriceLabel",
        price: formatPrice(trip?.price?.amount, trip?.price?.currency),
        actionLabelRef: "viewTripAction",
        href: `/trip/${encodeURIComponent(trip?.slug || trip?._id)}`,
    };
};

const locationFromEndpoint = (value) => {
    if (!value || typeof value !== "object") return { label: "", code: "" };
    return {
        label: firstText(value.city, value.name, value.airportName, value.iataCode),
        code: firstText(value.iataCode, value.code),
    };
};

const aggregateFlightDestinations = (bookings) => {
    const destinations = new Map();
    bookings.forEach((booking) => {
        const segments = Array.isArray(booking?.segmentSnapshot) ? booking.segmentSnapshot : [];
        const first = segments[0];
        const last = segments.at(-1);
        const origin = locationFromEndpoint(first?.origin);
        const destination = locationFromEndpoint(last?.destination);
        const key = firstText(destination.code, destination.label).toUpperCase();
        if (!key || !destination.label) return;
        const current = destinations.get(key) || {
            id: `flight-${key.toLowerCase()}`,
            title: destination.label,
            code: destination.code,
            origin: origin.label,
            count: 0,
        };
        current.count += 1;
        destinations.set(key, current);
    });
    return [...destinations.values()]
        .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))
        .slice(0, FEATURE_LIMIT)
        .map((destination) => ({
            ...destination,
            visualIcon: "plane",
            description: destination.origin ? `${destination.origin} → ${destination.title}` : "",
            meta: [{ icon: "navigation", label: destination.code || destination.title }],
            actionLabelRef: "searchFlightsAction",
            href: `/trehub/flights?to=${encodeURIComponent(destination.code || destination.title)}`,
        }));
};

const asHotelStays = (snapshot) => {
    if (Array.isArray(snapshot)) return snapshot;
    if (snapshot && typeof snapshot === "object") {
        if (Array.isArray(snapshot.hotels)) return snapshot.hotels;
        if (Array.isArray(snapshot.stays)) return snapshot.stays;
        return [snapshot];
    }
    return [];
};

const hotelLocation = (stay) => {
    if (!stay || typeof stay !== "object") return "";
    if (stay.location && typeof stay.location === "object") {
        return firstText(stay.location.city, stay.location.name, stay.location.destination);
    }
    return firstText(
        stay.location,
        stay.destinationName,
        stay.destination,
        stay.city,
        stay.address?.city,
    );
};

const aggregateHotelDestinations = (quotes) => {
    const destinations = new Map();
    quotes.forEach((quote) => {
        const seenInQuote = new Set();
        asHotelStays(quote?.hotelSnapshot).forEach((stay) => {
            const location = hotelLocation(stay);
            const key = location.toLocaleLowerCase();
            if (!key || seenInQuote.has(key)) return;
            seenInQuote.add(key);
            const current = destinations.get(key) || {
                id: `hotel-${key.replace(/[^a-z0-9]+/g, "-")}`,
                title: location,
                propertyName: firstText(stay?.propertyName, stay?.hotelName, stay?.name),
                image: firstText(stay?.photo, stay?.image, ...(stay?.photos || [])),
                count: 0,
            };
            current.count += 1;
            destinations.set(key, current);
        });
    });
    return [...destinations.values()]
        .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))
        .slice(0, FEATURE_LIMIT)
        .map((destination) => ({
            ...destination,
            visualIcon: "hotel",
            description: destination.propertyName || "",
            imageAlt: destination.propertyName || destination.title,
            meta: [{ icon: "mapPin", label: destination.title }],
            actionLabelRef: "searchHotelsAction",
            href: `/trehub/hotels?destination=${encodeURIComponent(destination.title)}`,
        }));
};

const category = (id, items) => ({
    id,
    labelRef: `featured${id[0].toUpperCase()}${id.slice(1)}`,
    viewAllLabelRef: `viewAll${id[0].toUpperCase()}${id.slice(1)}`,
    viewAllHrefRef: `${id}Url`,
    emptyState: {
        icon: id === "flights" ? "plane" : id === "hotels" ? "hotel" : "compass",
        titleRef: `${id}EmptyTitle`,
        descriptionRef: `${id}EmptyDescription`,
        actionLabelRef: `viewAll${id[0].toUpperCase()}${id.slice(1)}`,
        actionHrefRef: `${id}Url`,
    },
    items,
});

const emptyHomeFeatures = () => ({
    homeFeatures: {
        ariaLabelRef: "featuredAriaLabel",
        eyebrowRef: "featuredEyebrow",
        titleRef: "featuredTitle",
        descriptionRef: "featuredDescription",
        defaultCategory: "tours",
        categories: [
            category("tours", []),
            category("trips", []),
            category("flights", []),
            category("hotels", []),
        ],
    },
});

export const buildHomeFeatureSnapshot = async () => {
    try {
        const [tours, trips, flightBookings, hotelQuotes] = await Promise.all([
            Tour.find({ status: "published", visibility: "public", archivedAt: null })
                .select("slug title shortDescription desc photo photos period city address price rating primaryDestination featured trending tremVerified metrics intelligence createdAt")
                .sort({ featured: -1, trending: -1, tremVerified: -1, "metrics.popularityScore": -1, "metrics.bookings": -1, "rating.average": -1, "rating.count": -1, "intelligence.qualityScore": -1, createdAt: -1 })
                .limit(FEATURE_LIMIT)
                .lean(),
            Trip.find({ status: "listed", isListed: true, visibility: "public", archivedAt: null })
                .select("slug title description image photos duration routeTo location country price rating featured trending tremVerified metrics intelligence sortOrder createdAt")
                .sort({ featured: -1, trending: -1, tremVerified: -1, "metrics.popularityScore": -1, "metrics.bookings": -1, rating: -1, "intelligence.qualityScore": -1, sortOrder: 1, createdAt: -1 })
                .limit(FEATURE_LIMIT)
                .lean(),
            FlightBooking.find({ segmentSnapshot: { $exists: true, $ne: [] }, status: { $nin: ["FAILED", "CANCELLED"] } })
                .select("segmentSnapshot createdAt")
                .sort({ createdAt: -1 })
                .limit(SNAPSHOT_LIMIT)
                .lean(),
            BookingQuote.find({ hotelSnapshot: { $exists: true, $ne: null } })
                .select("hotelSnapshot createdAt")
                .sort({ createdAt: -1 })
                .limit(SNAPSHOT_LIMIT)
                .lean(),
        ]);

        return {
            homeFeatures: {
                ...emptyHomeFeatures().homeFeatures,
                categories: [
                    category("tours", tours.map(mapTour)),
                    category("trips", trips.map(mapTrip)),
                    category("flights", aggregateFlightDestinations(flightBookings)),
                    category("hotels", aggregateHotelDestinations(hotelQuotes)),
                ],
            },
        };
    } catch (error) {
        console.error("[HomeFeatures] snapshot build failed:", error?.message || error);
        return emptyHomeFeatures();
    }
};

export default { buildHomeFeatureSnapshot };
