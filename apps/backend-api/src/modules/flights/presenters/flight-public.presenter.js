import { flightJourneys, localFlightTime } from "../services/flight-offer.utils.js";

const point = (airport = {}, value) => {
    const date = new Date(value);
    let localDate = "";
    if (!Number.isNaN(date.getTime())) {
        try {
            localDate = new Intl.DateTimeFormat("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                timeZone: airport.timezone || "UTC",
            }).format(date);
        } catch { /* Provider must supply a valid airport timezone. */ }
    }
    return {
        code: airport.iataCode,
        city: airport.city,
        time: localFlightTime(value, airport.timezone),
        date: localDate,
        iso: value,
        timeZone: airport.timezone || null,
    };
};

const journeySummary = (offer) => flightJourneys(offer).map((journey) => ({
    index: journey.index,
    label: journey.direction === "OUTBOUND" ? "Outbound"
        : journey.direction === "RETURN" ? "Return" : `Journey ${journey.index + 1}`,
    origin: point(journey.first.origin, journey.first.departureDateTime),
    destination: point(journey.last.destination, journey.last.arrivalDateTime),
    durationMinutes: journey.durationMinutes,
    stops: journey.stops,
    stopsLabel: journey.stops ? `${journey.stops} stop${journey.stops === 1 ? "" : "s"}` : "Non-stop",
    flightNumbers: journey.segments.map((segment) => segment.flightNumber),
}));

export const publicFlightPrice = (price) => price && Object.fromEntries([
    "currency", "unit", "baseFare", "taxes", "providerFees", "flightSubtotal", "travellerCount",
    "perTravellerTotal", "convenienceFee", "seatFees", "finalAmount", "total", "passengers",
].filter((key) => price[key] !== undefined).map((key) => [key, price[key]]));

export const publicFlightOffer = (offer) => ({
    ...offer,
    journeys: journeySummary(offer),
    price: publicFlightPrice(offer.price),
    fare: { ...offer.fare, pricing: publicFlightPrice(offer.fare?.pricing) },
    fares: offer.fares.map((fare) => ({ ...fare, pricing: publicFlightPrice(fare.pricing) })),
});

export const publicRevalidation = (result) => ({
    ...result,
    currentPrice: publicFlightPrice(result.currentPrice),
    previousPrice: publicFlightPrice(result.previousPrice),
});
