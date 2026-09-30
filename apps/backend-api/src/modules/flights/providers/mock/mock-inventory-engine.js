import { AVAILABILITY_STATUS } from "../../types/flight.types.js";
import { hashNumber } from "./mock-random.js";

const fareReservations = new Map();
const seatReservations = new Map();

export const inventoryFor = (key, capacity = 186) => {
    const physicalAvailable = Math.max(0, capacity - (hashNumber(key, "load") % Math.floor(capacity * 0.88)));
    const fareBucketAvailable = Math.max(0, Math.min(9, (hashNumber(key, "bucket") % 12) - (fareReservations.get(key) || 0)));
    return {
        status: fareBucketAvailable === 0
            ? AVAILABILITY_STATUS.SOLD_OUT
            : fareBucketAvailable <= 3
              ? AVAILABILITY_STATUS.LIMITED
              : AVAILABILITY_STATUS.AVAILABLE,
        physicalAvailable,
        fareBucketAvailable,
        message: fareBucketAvailable > 0 && fareBucketAvailable <= 3
            ? `Only ${fareBucketAvailable} seats left at this price`
            : `${fareBucketAvailable} seats available at this price`,
    };
};

export const reserveFareInventory = (key, quantity, capacity) => {
    const availability = inventoryFor(key, capacity);
    if (availability.fareBucketAvailable < quantity || availability.physicalAvailable < quantity) return false;
    fareReservations.set(key, (fareReservations.get(key) || 0) + quantity);
    return true;
};

export const reserveSeats = (offerId, seatNumbers = []) => {
    const reserved = seatReservations.get(offerId) || new Set();
    if (seatNumbers.some((seat) => reserved.has(seat))) return false;
    seatNumbers.forEach((seat) => reserved.add(seat));
    seatReservations.set(offerId, reserved);
    return true;
};

export const reserveBookingInventory = ({ inventoryKey, quantity, offerId, seatNumbers = [], capacity }) => {
    const availability = inventoryFor(inventoryKey, capacity);
    const reservedSeats = seatReservations.get(offerId) || new Set();
    if (availability.fareBucketAvailable < quantity || availability.physicalAvailable < quantity) return "FARE_UNAVAILABLE";
    if (seatNumbers.some((seat) => reservedSeats.has(seat))) return "SEAT_UNAVAILABLE";
    fareReservations.set(inventoryKey, (fareReservations.get(inventoryKey) || 0) + quantity);
    seatNumbers.forEach((seat) => reservedSeats.add(seat));
    seatReservations.set(offerId, reservedSeats);
    return "RESERVED";
};

export const getReservedSeats = (offerId) => seatReservations.get(offerId) || new Set();
export const resetMockInventory = () => {
    fareReservations.clear();
    seatReservations.clear();
};
