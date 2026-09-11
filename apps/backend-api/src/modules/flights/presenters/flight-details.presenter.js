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
    return {
        iso: date.toISOString(),
        date: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone }).format(date),
        time: new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(date),
    };
};

const airportPoint = (airport = {}, value) => ({
    ...dateTime(value, airport.timezone),
    code: airport.iataCode,
    name: airport.name,
    city: airport.city,
    country: airport.country,
    terminal: airport.terminal,
});

const presentFare = (fare = {}) => ({
    fareId: fare.fareId,
    selectable: fare.availability?.status !== "SOLD_OUT" && Number(fare.availability?.fareBucketAvailable || 0) >= Math.max(1, (fare.pricing?.passengers || []).filter((passenger) => passenger.type !== "INFANT").reduce((total, passenger) => total + Number(passenger.count || 0), 0)),
    brand: titleCase(fare.brand),
    cabin: titleCase(fare.cabin),
    bookingClass: fare.bookingClass,
    availability: fare.availability,
    pricing: fare.pricing,
    benefits: [
        { id: "cabin-baggage", icon: "luggage", label: "Cabin baggage", value: `${fare.baggage?.cabin?.pieces || 0} piece · ${fare.baggage?.cabin?.weightKg || 0} kg` },
        { id: "checked-baggage", icon: "luggage", label: "Checked baggage", value: `${fare.baggage?.checked?.pieces || 0} piece${fare.baggage?.checked?.pieces === 1 ? "" : "s"} · ${fare.baggage?.checked?.weightKg || 0} kg` },
        { id: "meal", icon: "food", label: "Meal", value: fare.mealIncluded ? "Included" : "Available for purchase" },
        { id: "seat", icon: "ticket", label: "Seat selection", value: fare.extras?.seats ? "Available before payment" : "Assigned at check-in" },
    ],
    conditions: [
        { id: "refund", label: "Cancellation", value: fare.refundable ? "Refundable with airline charges" : "Non-refundable", tone: fare.refundable ? "success" : "warning" },
        { id: "change", label: "Date or flight changes", value: fare.changeable ? "Allowed with fare difference" : "Not permitted", tone: fare.changeable ? "success" : "warning" },
        { id: "no-show", label: "No-show", value: fare.refundable ? "Airline charges apply" : "Fare will be forfeited", tone: "warning" },
    ],
});

export const presentFlightDetails = (offer = {}) => {
    const segments = (offer.segments || []).map((segment, index, allSegments) => {
        const next = allSegments[index + 1];
        const layoverMinutes = next && next.direction === segment.direction
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
            aircraft: `${segment.aircraft?.name || "Aircraft"} (${segment.aircraft?.code || "—"})`,
            cabin: titleCase(segment.cabin),
            bookingClass: segment.bookingClass,
            layoverAfter: layoverMinutes ? `${durationLabel(layoverMinutes)} layover in ${segment.destination?.city}` : "",
        };
    });
    const totalDuration = (offer.segments || []).reduce((total, segment) => total + Number(segment.durationMinutes || 0), 0);
    const passengerCount = Object.values(offer.requirements?.passengerCounts || {}).reduce((total, count) => total + Number(count || 0), 0);
    const directions = new Set((offer.segments || []).map((segment) => segment.direction));

    return {
        offerId: offer.offerId,
        provider: offer.provider,
        expiresAt: offer.expiresAt,
        overview: [
            { id: "trip", icon: "route", label: "Journey", value: titleCase(offer.tripType) },
            { id: "duration", icon: "clock", label: "Flying time", value: durationLabel(totalDuration) },
            { id: "travellers", icon: "usersRound", label: "Travellers", value: `${passengerCount} traveller${passengerCount === 1 ? "" : "s"}` },
            { id: "documents", icon: "passport", label: "Travel document", value: offer.requirements?.passportRequired ? "Passport required" : "Government ID required" },
        ],
        itinerary: {
            journeyCount: directions.size,
            segmentCount: segments.length,
            segments,
        },
        fares: (offer.fares || []).map(presentFare),
        notices: [
            "Flight times are shown in each airport's local time.",
            "Terminal and aircraft information can change before departure.",
            "Final fare and seat availability are checked again before booking.",
        ],
    };
};

export default presentFlightDetails;
