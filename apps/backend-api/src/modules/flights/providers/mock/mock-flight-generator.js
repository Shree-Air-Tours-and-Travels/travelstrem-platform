import { aircraft, airlines, airportByCode } from "../../data/catalog.js";
import { CABIN, FARE_BRAND, PASSENGER_TYPE } from "../../types/flight.types.js";
import { calculateOfferPrice, fareRules } from "./mock-price-engine.js";
import { inventoryFor } from "./mock-inventory-engine.js";
import { deterministicId, hashNumber, seededItem } from "./mock-random.js";

const HUBS = ["DEL", "BOM", "DXB", "DOH", "SIN", "FRA"];
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);
const durationText = (minutes) => `PT${Math.floor(minutes / 60)}H${minutes % 60}M`;

const distanceKm = (origin, destination) => {
    const radians = (value) => (value * Math.PI) / 180;
    const lat = radians(destination.latitude - origin.latitude);
    const lon = radians(destination.longitude - origin.longitude);
    const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(lon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const airlinePool = (origin, destination) => {
    const domestic = airportByCode.get(origin).countryCode === airportByCode.get(destination).countryCode;
    return airlines.filter((airline) => domestic ? airline.domestic : airline.international);
};

const connectionFor = (origin, destination, index) => {
    const candidates = HUBS.filter((code) => code !== origin && code !== destination);
    return candidates[hashNumber(origin, destination, index, "connection") % candidates.length];
};

const createSegment = ({ originCode, destinationCode, departureDate, optionIndex, legIndex, direction, cabin }) => {
    const origin = airportByCode.get(originCode);
    const destination = airportByCode.get(destinationCode);
    const airline = seededItem(airlinePool(originCode, destinationCode), originCode, destinationCode, departureDate, optionIndex, legIndex);
    const isLongHaul = distanceKm(origin, destination) > 4800;
    const plane = seededItem(isLongHaul ? aircraft.filter((item) => item.code === "B787") : aircraft.filter((item) => item.code !== "B787"), originCode, destinationCode, optionIndex);
    const departureMinutes = 330 + ((hashNumber(originCode, destinationCode, departureDate, optionIndex, legIndex) % 900));
    const departure = new Date(`${departureDate}T00:00:00.000Z`);
    departure.setUTCMinutes(departureMinutes + legIndex * 125);
    const durationMinutes = Math.max(65, Math.round(distanceKm(origin, destination) / 12.5 + 40));
    const arrival = addMinutes(departure, durationMinutes);
    const flightNumber = `${airline.code} ${100 + (hashNumber(originCode, destinationCode, departureDate, optionIndex, legIndex, "number") % 8900)}`;
    return {
        segmentId: deterministicId("SEG", flightNumber, departure.toISOString()),
        direction,
        airline: { code: airline.code, name: airline.name, icon: airline.icon },
        operatingAirline: { code: airline.code, name: airline.name },
        flightNumber,
        origin: { ...origin, terminal: String(1 + (hashNumber(originCode, airline.code) % 3)) },
        destination: { ...destination, terminal: String(1 + (hashNumber(destinationCode, airline.code) % 3)) },
        departureDateTime: departure.toISOString(),
        arrivalDateTime: arrival.toISOString(),
        duration: durationText(durationMinutes),
        durationMinutes,
        aircraft: { code: plane.code, name: plane.name },
        terminal: { departure: String(1 + (hashNumber(originCode, airline.code) % 3)), arrival: String(1 + (hashNumber(destinationCode, airline.code) % 3)) },
        stops: 0,
        cabin,
        bookingClass: cabin === CABIN.ECONOMY ? "Y" : cabin === CABIN.PREMIUM_ECONOMY ? "W" : cabin === CABIN.BUSINESS ? "J" : "F",
    };
};

const buildSegments = (journey, journeyIndex, optionIndex, cabin, directOnly) => {
    const connecting = !directOnly && optionIndex >= 4;
    const direction = journeyIndex === 0 ? "OUTBOUND" : journeyIndex === 1 ? "RETURN" : `JOURNEY_${journeyIndex + 1}`;
    if (!connecting) return [createSegment({ originCode: journey.origin, destinationCode: journey.destination, departureDate: journey.departureDate, optionIndex, legIndex: 0, direction, cabin })];
    const connection = connectionFor(journey.origin, journey.destination, optionIndex);
    return [
        createSegment({ originCode: journey.origin, destinationCode: connection, departureDate: journey.departureDate, optionIndex, legIndex: 0, direction, cabin }),
        createSegment({ originCode: connection, destinationCode: journey.destination, departureDate: journey.departureDate, optionIndex, legIndex: 1, direction, cabin }),
    ];
};

export const generateFlightOffers = async (input, financialContext = {}) => {
    const passengerCounts = { [PASSENGER_TYPE.ADULT]: input.adults, [PASSENGER_TYPE.CHILD]: input.children, [PASSENGER_TYPE.INFANT]: input.infants };
    return Promise.all(Array.from({ length: input.directOnly ? 4 : 6 }, async (_, optionIndex) => {
        const segments = input.journeys.flatMap((journey, journeyIndex) => buildSegments(journey, journeyIndex, optionIndex, input.cabin, input.directOnly));
        const inventoryKey = segments.map((segment) => `${segment.flightNumber}:${segment.departureDateTime}`).join("+");
        const capacity = Math.min(...segments.map((segment) => aircraft.find((item) => item.code === segment.aircraft.code)?.capacity || 180));
        const availability = inventoryFor(inventoryKey, capacity);
        const availableCabins = [...new Set([input.cabin, CABIN.BUSINESS, CABIN.FIRST])];
        const fares = (await Promise.all(availableCabins.flatMap((cabin) => Object.values(FARE_BRAND).map(async (brand) => {
            const pricing = await calculateOfferPrice({ journeys: input.journeys, departureDate: input.journeys[0].departureDate, cabin, brand, passengers: passengerCounts, inventoryKey, currency: input.currency, financialContext });
            return {
                fareId: deterministicId("FARE", inventoryKey, brand, cabin),
                brand,
                cabin,
                bookingClass: cabin === CABIN.ECONOMY ? "Y" : cabin === CABIN.PREMIUM_ECONOMY ? "W" : cabin === CABIN.BUSINESS ? "J" : "F",
                ...fareRules(brand, cabin),
                availability: { ...availability, fareBucketAvailable: Math.max(0, availability.fareBucketAvailable - (brand === FARE_BRAND.SAVER ? 2 : 0)) },
                pricing,
                extras: { seats: true, meals: [], additionalBaggage: [], specialAssistance: [] },
            };
        }))));
        const fare = fares.find((item) => item.cabin === input.cabin && item.brand === FARE_BRAND.VALUE);
        return {
            offerId: deterministicId("OFFER", input.tripType, inventoryKey, input.cabin),
            provider: "MOCK",
            tripType: input.tripType,
            segments,
            fare,
            fares,
            availability,
            price: fare.pricing,
            currency: input.currency,
            inventoryKey,
            score: 100 - optionIndex * 7 - Math.round(fare.pricing.total / 100000),
            requirements: {
                passportRequired: input.journeys.some((journey) => airportByCode.get(journey.origin).countryCode !== airportByCode.get(journey.destination).countryCode),
                passengerCounts,
            },
        };
    }));
};
