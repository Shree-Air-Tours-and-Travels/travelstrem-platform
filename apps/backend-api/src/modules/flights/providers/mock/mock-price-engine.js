import { airportByCode, routePrices } from "../../data/catalog.js";
import { CABIN, FARE_BRAND, PASSENGER_TYPE } from "../../types/flight.types.js";
import { hashNumber } from "./mock-random.js";

const CABIN_MULTIPLIER = { [CABIN.ECONOMY]: 1, [CABIN.PREMIUM_ECONOMY]: 1.65, [CABIN.BUSINESS]: 3.4, [CABIN.FIRST]: 5.8 };
const BRAND_MULTIPLIER = { [FARE_BRAND.SAVER]: 0.9, [FARE_BRAND.VALUE]: 1, [FARE_BRAND.FLEX]: 1.28 };
const PASSENGER_MULTIPLIER = { [PASSENGER_TYPE.ADULT]: 1, [PASSENGER_TYPE.CHILD]: 0.75, [PASSENGER_TYPE.INFANT]: 0.12 };
const CURRENCY_RATE_FROM_INR = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094, AED: 0.044, SGD: 0.016, QAR: 0.044, THB: 0.43 };

const radians = (value) => (value * Math.PI) / 180;
const distanceKm = (origin, destination) => {
    const lat = radians(destination.latitude - origin.latitude);
    const lon = radians(destination.longitude - origin.longitude);
    const value = Math.sin(lat / 2) ** 2 + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(lon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export const routeBasePrice = (originCode, destinationCode) => {
    const direct = routePrices[`${originCode}-${destinationCode}`] || routePrices[`${destinationCode}-${originCode}`];
    if (direct) return direct;
    const origin = airportByCode.get(originCode);
    const destination = airportByCode.get(destinationCode);
    return Math.round(Math.max(320000, distanceKm(origin, destination) * 520) / 100) * 100;
};


export const calculateOfferPrice = async ({ journeys, departureDate, cabin, brand, passengers, inventoryKey, currency = "INR", financialContext }) => {
    const routeBase = journeys.reduce((total, journey) => total + routeBasePrice(journey.origin, journey.destination), 0);
    const daysUntilDeparture = Math.max(0, Math.ceil((new Date(`${departureDate}T00:00:00Z`) - Date.now()) / 86400000));
    const advanceMultiplier = daysUntilDeparture <= 3 ? 1.55 : daysUntilDeparture <= 14 ? 1.28 : daysUntilDeparture <= 45 ? 1.08 : 0.94;
    const loadFactor = 0.45 + (hashNumber(inventoryKey, "demand") % 48) / 100;
    const demandMultiplier = 0.9 + loadFactor * 0.42;
    const currencyRate = CURRENCY_RATE_FROM_INR[currency] || 1;
    const unitBase = routeBase * currencyRate * CABIN_MULTIPLIER[cabin] * BRAND_MULTIPLIER[brand] * advanceMultiplier * demandMultiplier;
    const passengerPricing = Object.entries(passengers).filter(([, count]) => count > 0).map(([type, count]) => {
        const baseFare = Math.round(unitBase * PASSENGER_MULTIPLIER[type]);
        const taxes = Math.round(baseFare * (type === PASSENGER_TYPE.INFANT ? 0.05 : 0.12));
        const providerFees = Math.round(((type === PASSENGER_TYPE.INFANT ? 5000 : 25000) * currencyRate) / 100) * 100;
        const totalPerPassenger = baseFare + taxes + providerFees;
        return { passengerType: type, count, baseFare, taxes, providerFees, travelsTremFees: 0, totalPerPassenger, total: totalPerPassenger * count };
    });
    const sum = (key) => passengerPricing.reduce((total, item) => total + item[key] * (key === "total" ? 1 : item.count), 0);
    const flightSubtotal = sum("total");
    return {
        currency,
        unit: "MINOR",
        baseFare: sum("baseFare"),
        taxes: sum("taxes"),
        providerFees: sum("providerFees"),
        travelsTremFees: 0,
        flightSubtotal,
        total: flightSubtotal,
        passengers: passengerPricing,
        factors: { daysUntilDeparture, loadFactor: Number(loadFactor.toFixed(2)) },
    };
};

export const fareRules = (brand, cabin) => ({
    refundable: brand === FARE_BRAND.FLEX,
    changeable: brand !== FARE_BRAND.SAVER,
    mealIncluded: cabin !== CABIN.ECONOMY || brand !== FARE_BRAND.SAVER,
    baggage: {
        cabin: { pieces: 1, weightKg: cabin === CABIN.FIRST ? 12 : 7 },
        checked: { pieces: brand === FARE_BRAND.SAVER ? 1 : 2, weightKg: cabin === CABIN.ECONOMY ? (brand === FARE_BRAND.SAVER ? 15 : 20) : 30 },
    },
});
