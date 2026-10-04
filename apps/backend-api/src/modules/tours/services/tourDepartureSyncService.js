import TourDeparture from "../models/TourDeparture.js";

const slugify = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const departureStatus = (tour = {}) => {
    if (["cancelled", "archived"].includes(tour.status)) return "cancelled";
    if (Number(tour.availability?.seatsAvailable) === 0) return "sold_out";
    return tour.status === "published" ? "active" : "scheduled";
};

export const buildDerivedTourDeparture = (tour = {}) => {
    if (!tour._id || !tour.startDate || !tour.endDate) return null;
    const originName = String(tour.city?.from || "").trim();
    const countryName = String(tour.origin?.countryName || tour.address?.country || "").trim();
    return {
        tourId: tour._id,
        origin: {
            cityId: slugify(originName),
            cityName: originName,
            countryId: slugify(countryName),
            countryName,
        },
        departureDate: tour.startDate,
        returnDate: tour.endDate,
        status: departureStatus(tour),
        capacity: tour.availability?.totalSeats ?? null,
        availableSeats: tour.availability?.seatsAvailable ?? null,
        pricing: {
            currency: tour.price?.currency || "INR",
            min: Number(tour.price?.min || 0),
            max: Number(tour.price?.max ?? tour.price?.min ?? 0),
            isFinal: Boolean(tour.price?.isFinal),
            source: tour.price?.source || "manual",
        },
        legacyDerived: true,
    };
};

export const syncDerivedTourDeparture = async (tour = {}) => {
    const derived = buildDerivedTourDeparture(tour);
    if (!derived) {
        if (tour._id) await TourDeparture.deleteMany({ tourId: tour._id, legacyDerived: true });
        return null;
    }
    return TourDeparture.findOneAndUpdate(
        { tourId: tour._id, legacyDerived: true },
        { $set: derived },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
};
