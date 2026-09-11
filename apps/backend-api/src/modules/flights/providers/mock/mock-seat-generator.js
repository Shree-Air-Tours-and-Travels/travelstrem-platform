import { aircraftByCode } from "../../data/catalog.js";
import { SEAT_STATUS } from "../../types/flight.types.js";
import { getReservedSeats } from "./mock-inventory-engine.js";
import { seededRandom } from "./mock-random.js";

const seatType = (column, columns, aislesAfter) => {
    if (column === columns[0] || column === columns.at(-1)) return "WINDOW";
    if (aislesAfter.includes(column) || aislesAfter.some((aisleColumn) => columns[columns.indexOf(aisleColumn) + 1] === column)) return "AISLE";
    return "MIDDLE";
};

const seatPrice = (type, features, cabin, currency) => {
    let amount = type === "MIDDLE" ? 25000 : type === "AISLE" ? 45000 : 55000;
    if (features.includes("EXTRA_LEGROOM")) amount += 70000;
    if (features.includes("EXIT_ROW")) amount += 45000;
    if (cabin === "BUSINESS") amount *= 3;
    if (cabin === "FIRST") amount *= 5;
    const currencyRate = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094, AED: 0.044, SGD: 0.016, QAR: 0.044, THB: 0.43 }[currency] || 1;
    return { currency, unit: "MINOR", total: Math.round((amount * currencyRate) / 100) * 100 };
};

export const generateSeatMap = (offer) => ({
    offerId: offer.offerId,
    currency: offer.currency,
    segments: offer.segments.map((segment) => {
        const layout = aircraftByCode.get(segment.aircraft.code) || aircraftByCode.get("A320");
        const random = seededRandom(offer.offerId, segment.segmentId, "seats");
        const reserved = getReservedSeats(offer.offerId);
        const seats = [];
        for (let row = 1; row <= layout.rows; row += 1) {
            for (const column of layout.columns) {
                const seatNumber = `${row}${column}`;
                const type = seatType(column, layout.columns, layout.aislesAfter);
                const features = [type];
                if (layout.extraLegroomRows.includes(row)) features.push("EXTRA_LEGROOM");
                if (layout.exitRows.includes(row)) features.push("EXIT_ROW");
                if (row === layout.rows) features.push("NEAR_LAVATORY", "RECLINE_RESTRICTED");
                if (row === 1) features.push("BASSINET");
                const value = random();
                const status = reserved.has(`${segment.segmentId}:${seatNumber}`)
                    ? SEAT_STATUS.RESERVED
                    : value < 0.34
                      ? SEAT_STATUS.OCCUPIED
                      : value < 0.39
                        ? SEAT_STATUS.BLOCKED
                        : SEAT_STATUS.AVAILABLE;
                seats.push({ seatNumber, row, column, cabin: segment.cabin, type, status, features, price: seatPrice(type, features, segment.cabin, offer.currency) });
            }
        }
        return { segmentId: segment.segmentId, aircraft: segment.aircraft, layout: { columns: layout.columns, aislesAfter: layout.aislesAfter }, seats };
    }),
});
