const validMinutes = (value) => Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value) : 0;

export const flightJourneys = (offer = {}) => {
    const grouped = new Map();
    for (const segment of offer.segments || []) {
        const key = Number.isInteger(segment.journeyIndex)
            ? `index:${segment.journeyIndex}`
            : `direction:${segment.direction || "OUTBOUND"}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(segment);
    }
    return [...grouped.values()].map((segments, index) => {
        const first = segments[0];
        const last = segments.at(-1);
        const elapsed = new Date(last.arrivalDateTime).getTime()
            - new Date(first.departureDateTime).getTime();
        const flyingMinutes = segments.reduce((total, segment) =>
            total + validMinutes(segment.durationMinutes), 0);
        return {
            index,
            direction: first.direction || `JOURNEY_${index + 1}`,
            segments,
            first,
            last,
            durationMinutes: Number.isFinite(elapsed) && elapsed >= 0
                ? Math.round(elapsed / 60000) : flyingMinutes,
            stops: Math.max(0, segments.length - 1)
                + segments.reduce((total, segment) => total + validMinutes(segment.stops), 0),
        };
    });
};

export const flightFareSelectable = (fare = {}, passengerCounts = {}) => {
    if (["SOLD_OUT", "UNAVAILABLE"].includes(fare.availability?.status)) return false;
    const needed = Number(passengerCounts.ADULT || 0) + Number(passengerCounts.CHILD || 0);
    const available = fare.availability?.fareBucketAvailable;
    return available == null || !Number.isFinite(Number(available))
        || Number(available) >= Math.max(1, needed);
};

export const localFlightTime = (value, timeZone) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: timeZone || "UTC",
        }).format(date);
    } catch {
        return "";
    }
};
