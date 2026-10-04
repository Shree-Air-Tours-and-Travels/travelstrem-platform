import { airportByCode, airports } from "../data/catalog.js";
import { CABIN, CABINS, TRIP_TYPE, TRIP_TYPES } from "../types/flight.types.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IATA_PATTERN = /^[A-Z]{3}$/;
const cleanCode = (value) => String(value || "").trim().toUpperCase();
const cleanDate = (value) => String(value || "").trim();
const AIRPORT_ALIASES = new Map([
    ["delhi", "DEL"], ["new delhi", "DEL"], ["bombay", "BOM"], ["bangalore", "BLR"],
    ["calcutta", "CCU"], ["madras", "MAA"], ["new york", "JFK"], ["vegas", "LAS"],
]);
const resolveAirportCode = (value) => {
    const source = String(value || "").trim();
    const code = cleanCode(source);
    if (airportByCode.has(code)) return code;
    const term = source.toLowerCase();
    if (AIRPORT_ALIASES.has(term)) return AIRPORT_ALIASES.get(term);
    const matches = airports.filter((airport) => {
        const city = airport.city.toLowerCase();
        const name = airport.name.toLowerCase();
        return city === term || name === term || term.includes(name) || term.includes(`${city},`);
    });
    return matches.length === 1 ? matches[0].iataCode : code;
};

const normalizeTripType = (value) => {
    const key = String(value || "ONE_WAY").trim().replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
    return { ONEWAY: TRIP_TYPE.ONE_WAY, ROUNDTRIP: TRIP_TYPE.ROUND_TRIP, MULTITRIP: TRIP_TYPE.MULTI_CITY, MULTI_TRIP: TRIP_TYPE.MULTI_CITY }[key] || key;
};

const validDate = (value) => {
    if (!DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validateJourney = (journey, path, errors) => {
    const origin = resolveAirportCode(journey?.origin);
    const destination = resolveAirportCode(journey?.destination);
    const departureDate = cleanDate(journey?.departureDate);
    if (!IATA_PATTERN.test(origin) || !airportByCode.has(origin)) errors[`${path}.origin`] = "Choose a supported IATA airport code";
    if (!IATA_PATTERN.test(destination) || !airportByCode.has(destination)) errors[`${path}.destination`] = "Choose a supported IATA airport code";
    if (origin && origin === destination) errors[`${path}.destination`] = "Origin and destination must differ";
    if (!validDate(departureDate)) errors[`${path}.departureDate`] = "Use a valid YYYY-MM-DD date";
    else if (departureDate < new Date().toISOString().slice(0, 10)) errors[`${path}.departureDate`] = "Departure date cannot be in the past";
    return { origin, destination, departureDate };
};

export const validateFlightSearch = (body = {}) => {
    const errors = {};
    const tripType = normalizeTripType(body.tripType || body.choice);
    if (!TRIP_TYPES.includes(tripType)) errors.tripType = `Use one of: ${TRIP_TYPES.join(", ")}`;
    let journeys = [];
    if (tripType === TRIP_TYPE.MULTI_CITY) {
        let sourceJourneys = body.journeys ?? body.segments;
        if (typeof sourceJourneys === "string") {
            try { sourceJourneys = JSON.parse(sourceJourneys); } catch { sourceJourneys = []; }
        }
        if (!Array.isArray(sourceJourneys) || sourceJourneys.length < 2 || sourceJourneys.length > 6) {
            errors.journeys = "Multi-city searches require 2 to 6 journeys";
        } else journeys = sourceJourneys.map((journey, index) => validateJourney({ origin: journey.origin ?? journey.from, destination: journey.destination ?? journey.to, departureDate: journey.departureDate ?? journey.departDate }, `journeys.${index}`, errors));
    } else {
        const outbound = validateJourney({ origin: body.origin ?? body.from, destination: body.destination ?? body.to, departureDate: body.departureDate ?? body.departDate }, "journey", errors);
        journeys = [outbound];
        if (tripType === TRIP_TYPE.ROUND_TRIP) {
            const returnDate = cleanDate(body.returnDate);
            if (!validDate(returnDate)) errors.returnDate = "Round trips require a valid return date";
            if (returnDate && outbound.departureDate && returnDate < outbound.departureDate) errors.returnDate = "Return date cannot precede departure";
            journeys.push({ origin: outbound.destination, destination: outbound.origin, departureDate: returnDate });
        }
    }
    for (let index = 1; index < journeys.length; index += 1) {
        if (journeys[index].departureDate < journeys[index - 1].departureDate) errors[`journeys.${index}.departureDate`] = "Journey dates must be chronological";
    }
    const adults = Number(body.adults ?? body.travellers ?? 1);
    const children = Number(body.children ?? 0);
    const infants = Number(body.infants ?? 0);
    for (const [key, value, min] of [["adults", adults, 1], ["children", children, 0], ["infants", infants, 0]]) {
        if (!Number.isInteger(value) || value < min) errors[key] = `${key} must be a whole number of at least ${min}`;
    }
    if (adults + children + infants > 9) errors.passengers = "A search can contain at most 9 passengers";
    if (infants > adults) errors.infants = "Each infant must travel with an adult";
    const cabin = String(body.cabin || CABIN.ECONOMY).replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
    if (!CABINS.includes(cabin)) errors.cabin = `Use one of: ${CABINS.join(", ")}`;
    const currency = String(body.currency || "INR").trim().toUpperCase();
    if (!["INR", "USD", "EUR", "GBP", "AED", "SGD", "QAR", "THB"].includes(currency)) errors.currency = "Currency is not supported";
    return {
        ok: !Object.keys(errors).length,
        errors,
        value: { tripType, journeys, adults, children, infants, cabin, currency, directOnly: body.directOnly === true || String(body.directOnly).toLowerCase() === "true" },
    };
};

export const validateRevalidation = (body = {}) => {
    const searchId = String(body.searchId || "").trim();
    const offerId = String(body.offerId || "").trim();
    const fareId = String(body.fareId || "").trim();
    const seats = Array.isArray(body.seats) ? body.seats.map((seat) => ({
        segmentId: String(seat?.segmentId || "").trim(),
        seatNumber: String(seat?.seatNumber || "").trim().toUpperCase(),
    })).filter((seat) => seat.segmentId && /^[1-9][0-9]?[A-J]$/.test(seat.seatNumber)) : [];
    const errors = {};
    if (!searchId) errors.searchId = "searchId is required";
    if (!offerId) errors.offerId = "offerId is required";
    const expectedTotal = Number.isSafeInteger(body.expectedTotal) && body.expectedTotal >= 0 ? body.expectedTotal : undefined;
    return { ok: !Object.keys(errors).length, errors, value: { searchId, offerId, fareId, seats, expectedTotal } };
};

export const validateBookingInput = (body = {}) => {
    const errors = {};
    const searchId = String(body.searchId || "").trim();
    const offerId = String(body.offerId || "").trim();
    const fareId = String(body.fareId || "").trim();
    if (!searchId) errors.searchId = "searchId is required";
    if (!offerId) errors.offerId = "offerId is required";
    if (!fareId) errors.fareId = "fareId is required";
    const passengers = Array.isArray(body.passengers) ? body.passengers : [];
    if (!passengers.length || passengers.length > 9) errors.passengers = "Provide 1 to 9 passengers";
    const normalizedPassengers = passengers.map((passenger, index) => {
        const value = {
            type: String(passenger?.type || "ADULT").toUpperCase(),
            title: String(passenger?.title || "").trim().slice(0, 12),
            firstName: String(passenger?.firstName || "").trim().slice(0, 80),
            lastName: String(passenger?.lastName || "").trim().slice(0, 80),
            gender: String(passenger?.gender || "").trim().toUpperCase(),
            dateOfBirth: cleanDate(passenger?.dateOfBirth),
            nationality: cleanCode(passenger?.nationality).slice(0, 2),
            passport: passenger?.passport ? {
                number: String(passenger.passport.number || "").trim().slice(0, 30),
                expiryDate: cleanDate(passenger.passport.expiryDate),
                issuingCountry: cleanCode(passenger.passport.issuingCountry).slice(0, 2),
                nationality: cleanCode(passenger.passport.nationality).slice(0, 2),
            } : undefined,
        };
        if (!["ADULT", "CHILD", "INFANT"].includes(value.type)) errors[`passengers.${index}.type`] = "Invalid passenger type";
        if (!value.firstName) errors[`passengers.${index}.firstName`] = "First name is required";
        if (!value.lastName) errors[`passengers.${index}.lastName`] = "Last name is required";
        if (!value.title) errors[`passengers.${index}.title`] = "Title is required";
        if (!value.gender) errors[`passengers.${index}.gender`] = "Gender is required";
        if (!/^[A-Z]{2}$/.test(value.nationality)) errors[`passengers.${index}.nationality`] = "Use a two-letter nationality code";
        if (!validDate(value.dateOfBirth)) errors[`passengers.${index}.dateOfBirth`] = "Valid date of birth is required";
        if (value.passport?.expiryDate && (!validDate(value.passport.expiryDate) || new Date(`${value.passport.expiryDate}T00:00:00Z`).getTime() <= Date.now())) errors[`passengers.${index}.passport.expiryDate`] = "Passport expiry must be a future date";
        return value;
    });
    const seats = Array.isArray(body.seats) ? body.seats.map((seat) => ({
        segmentId: String(seat?.segmentId || "").trim(),
        seatNumber: String(seat?.seatNumber || "").trim().toUpperCase(),
    })).filter((seat) => seat.segmentId && /^[1-9][0-9]?[A-J]$/.test(seat.seatNumber)) : [];
    const allowedExtraTypes = new Set(["MEAL", "ADDITIONAL_BAGGAGE", "SPECIAL_ASSISTANCE"]);
    const extras = Array.isArray(body.extras) ? body.extras.slice(0, 20).map((extra) => ({
        type: String(extra?.type || "").trim().toUpperCase(),
        code: String(extra?.code || "").trim().slice(0, 40),
        segmentId: String(extra?.segmentId || "").trim().slice(0, 80),
        passengerIndex: Number.isInteger(Number(extra?.passengerIndex)) ? Number(extra.passengerIndex) : undefined,
    })).filter((extra) => allowedExtraTypes.has(extra.type) && extra.code) : [];
    return { ok: !Object.keys(errors).length, errors, value: { searchId, offerId, fareId, passengers: normalizedPassengers, seats, extras, acceptPriceChange: body.acceptPriceChange === true } };
};
