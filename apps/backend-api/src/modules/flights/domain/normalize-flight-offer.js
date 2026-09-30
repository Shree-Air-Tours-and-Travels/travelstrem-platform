import ApiError from "../../../shared/errors/ApiError.js";

const validDateTime = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const airport = (value = {}) => ({
    ...value,
    iataCode: String(value.iataCode || value.code || "").toUpperCase(),
    name: String(value.name || ""),
    city: String(value.city || ""),
    country: String(value.country || ""),
    timezone: value.timezone ? String(value.timezone) : "UTC",
});

export const normalizeFlightOffer = (offer, providerName = "") => {
    if (!offer?.offerId || !Array.isArray(offer.segments) || !offer.segments.length)
        throw new ApiError(502, "The flight supplier returned an invalid offer.");
    const segments = offer.segments.map((segment) => {
        const origin = airport(segment.origin);
        const destination = airport(segment.destination);
        if (!segment?.segmentId || !/^[A-Z]{3}$/.test(origin.iataCode)
            || !/^[A-Z]{3}$/.test(destination.iataCode)
            || !validDateTime(segment.departureDateTime)
            || !validDateTime(segment.arrivalDateTime)
            || Date.parse(segment.arrivalDateTime) <= Date.parse(segment.departureDateTime))
            throw new ApiError(502, "The flight supplier returned an invalid itinerary.");
        return {
            ...segment,
            segmentId: String(segment.segmentId),
            journeyIndex: Number.isInteger(segment.journeyIndex) ? segment.journeyIndex : undefined,
            origin,
            destination,
            durationMinutes: Number.isFinite(Number(segment.durationMinutes))
                ? Math.max(0, Number(segment.durationMinutes))
                : Math.round((Date.parse(segment.arrivalDateTime) - Date.parse(segment.departureDateTime)) / 60000),
            stops: Number.isFinite(Number(segment.stops)) ? Math.max(0, Number(segment.stops)) : 0,
            airline: segment.airline || segment.marketingAirline || {},
            operatingAirline: segment.operatingAirline || segment.airline || segment.marketingAirline || {},
        };
    });
    const fares = (Array.isArray(offer.fares) ? offer.fares : offer.fare ? [offer.fare] : [])
        .filter((fare) => fare?.fareId && fare?.pricing)
        .map((fare) => ({
            ...fare,
            fareId: String(fare.fareId),
            brand: String(fare.brand || fare.name || "Standard"),
            cabin: String(fare.cabin || "ECONOMY").toUpperCase(),
            baggage: fare.baggage || {},
            availability: fare.availability || { status: "UNKNOWN" },
        }));
    if (!fares.length) throw new ApiError(502, "The flight supplier returned no usable fares.");
    const selectedFareId = offer.fare?.fareId;
    const fare = fares.find((item) => item.fareId === selectedFareId) || fares[0];
    return {
        ...offer,
        offerId: String(offer.offerId),
        provider: String(offer.provider || providerName || "UNKNOWN").toUpperCase(),
        segments,
        fares,
        fare,
        price: fare.pricing,
        availability: offer.availability || fare.availability,
        requirements: offer.requirements || { passengerCounts: {} },
    };
};

export default normalizeFlightOffer;
