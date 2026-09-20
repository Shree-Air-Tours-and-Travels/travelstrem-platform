import { flightFareSelectable, flightJourneys } from "../services/flight-offer.utils.js";

const titleCase = (value) => String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const durationLabel = (minutes) => {
    const total = Math.max(0, Number(minutes) || 0);
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
};

const dateTime = (value, timeZone) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { date: "", time: "", iso: value };
    try {
        return {
            iso: date.toISOString(),
            date: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: timeZone || "UTC" }).format(date),
            time: new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timeZone || "UTC" }).format(date),
        };
    } catch { return { date: "", time: "", iso: value }; }
};

const airportPoint = (airport = {}, value) => ({
    ...dateTime(value, airport.timezone),
    code: airport.iataCode,
    name: airport.name,
    city: airport.city,
    country: airport.country,
    terminal: airport.terminal,
});

const allowance = (value) => {
    if (!value) return "Confirm with airline";
    const parts = [];
    if (value.pieces != null) parts.push(`${value.pieces} piece${value.pieces === 1 ? "" : "s"}`);
    if (value.weightKg != null) parts.push(`${value.weightKg} kg`);
    return parts.length ? parts.join(" · ") : "Confirm with airline";
};

const condition = (value, yes, no) => value === true ? yes : value === false ? no : "Check fare rules";

const presentFare = (fare = {}, passengerCounts = {}) => ({
    fareId: fare.fareId,
    selectable: flightFareSelectable(fare, passengerCounts),
    brand: titleCase(fare.brand),
    cabin: titleCase(fare.cabin),
    bookingClass: fare.bookingClass,
    availability: fare.availability,
    pricing: fare.pricing,
    benefits: [
        { id: "cabin-baggage", icon: "luggage", label: "Cabin baggage", value: allowance(fare.baggage?.cabin) },
        { id: "checked-baggage", icon: "luggage", label: "Checked baggage", value: allowance(fare.baggage?.checked) },
        { id: "meal", icon: "food", label: "Meal", value: condition(fare.mealIncluded, "Included", "Not included") },
        { id: "seat", icon: "ticket", label: "Seat selection", value: condition(fare.extras?.seats, "Available", "Not available") },
    ],
    conditions: Array.isArray(fare.conditions) && fare.conditions.length
        ? fare.conditions
        : [
            { id: "refund", label: "Cancellation", value: condition(fare.refundable, "Refundable", "Non-refundable"), tone: fare.refundable === true ? "success" : fare.refundable === false ? "warning" : "info" },
            { id: "change", label: "Date or flight changes", value: condition(fare.changeable, "Changes permitted", "Changes not permitted"), tone: fare.changeable === true ? "success" : fare.changeable === false ? "warning" : "info" },
            ...(fare.noShowPolicy ? [{ id: "no-show", label: "No-show", value: fare.noShowPolicy, tone: "info" }] : []),
        ],
});

export const presentFlightDetails = (offer = {}) => {
    const journeys = flightJourneys(offer);
    const nextBySegmentId = new Map(journeys.flatMap((journey) => journey.segments.slice(0, -1).map((segment, index) => [segment.segmentId, journey.segments[index + 1]])));
    const segments = (offer.segments || []).map((segment) => {
        const next = nextBySegmentId.get(segment.segmentId);
        const layoverMinutes = next
            ? Math.max(0, Math.round((new Date(next.departureDateTime) - new Date(segment.arrivalDateTime)) / 60000))
            : 0;
        return {
            id: segment.segmentId,
            direction: titleCase(segment.direction),
            airline: segment.airline,
            operatingAirline: segment.operatingAirline,
            flightNumber: segment.flightNumber,
            departure: airportPoint(segment.origin, segment.departureDateTime),
            arrival: airportPoint(segment.destination, segment.arrivalDateTime),
            duration: durationLabel(segment.durationMinutes),
            stopsLabel: segment.stops > 0
                ? `${segment.stops} technical stop${segment.stops === 1 ? "" : "s"}` : "Non-stop",
            aircraft: segment.aircraft?.name
                ? `${segment.aircraft.name}${segment.aircraft.code ? ` (${segment.aircraft.code})` : ""}`
                : segment.aircraft?.code || null,
            cabin: titleCase(segment.cabin),
            bookingClass: segment.bookingClass,
            layoverAfter: layoverMinutes ? `${durationLabel(layoverMinutes)} layover in ${segment.destination?.city}` : "",
        };
    });
    const totalDuration = journeys.reduce((total, journey) => total + journey.durationMinutes, 0);
    const passengerCount = Object.values(offer.requirements?.passengerCounts || {}).reduce((total, count) => total + Number(count || 0), 0);

    return {
        offerId: offer.offerId,
        provider: offer.provider,
        expiresAt: offer.expiresAt,
        overview: [
            { id: "trip", icon: "route", label: "Journey", value: titleCase(offer.tripType) },
            { id: "duration", icon: "clock", label: "Journey time", value: durationLabel(totalDuration) },
            { id: "travellers", icon: "usersRound", label: "Travellers", value: `${passengerCount} traveller${passengerCount === 1 ? "" : "s"}` },
            { id: "documents", icon: "passport", label: "Travel document", value: offer.requirements?.passportRequired ? "Passport required" : "Government ID required" },
        ],
        itinerary: {
            journeyCount: journeys.length,
            segmentCount: segments.length,
            journeys: offer.journeys || [],
            segments,
        },
        fares: (offer.fares || []).map((fare) => presentFare(fare, offer.requirements?.passengerCounts)),
        notices: [
            "Flight times are shown in each airport's local time.",
            "Terminal and aircraft information can change before departure.",
            "Final fare and seat availability are checked again before booking.",
        ],
    };
};

export default presentFlightDetails;
