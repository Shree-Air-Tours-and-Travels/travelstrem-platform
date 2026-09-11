import FlightProvider from "../flight-provider.interface.js";
import { PROVIDER_ERRORS, REVALIDATION_STATUS } from "../../types/flight.types.js";
import { generateFlightOffers } from "./mock-flight-generator.js";
import { generateSeatMap } from "./mock-seat-generator.js";
import { reserveBookingInventory } from "./mock-inventory-engine.js";
import { hashNumber } from "./mock-random.js";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const reference = (prefix, seed, length) => `${prefix}${hashNumber(seed, prefix).toString().padStart(length, "0").slice(-length)}`;

export default class MockFlightProvider extends FlightProvider {
    constructor(options = {}) {
        super();
        this.name = "mock";
        this.minLatency = Number(options.minLatency ?? process.env.MOCK_FLIGHT_MIN_LATENCY_MS ?? 300);
        this.maxLatency = Number(options.maxLatency ?? process.env.MOCK_FLIGHT_MAX_LATENCY_MS ?? 1200);
        this.forceError = options.forceError ?? (process.env.NODE_ENV === "production" ? "" : process.env.MOCK_FLIGHT_FORCE_ERROR || "");
        this.offers = new Map();
        this.bookings = new Map();
    }

    async latency(seed) {
        const range = Math.max(0, this.maxLatency - this.minLatency);
        const duration = Math.max(0, this.minLatency + (range ? hashNumber(seed, "latency") % (range + 1) : 0));
        if (duration) await wait(duration);
        return duration;
    }

    failIf(code) {
        if (this.forceError === code) {
            const error = new Error(code.replaceAll("_", " ").toLowerCase());
            error.code = code;
            throw error;
        }
    }

    async search(input, financialContext = {}) {
        this.failIf(PROVIDER_ERRORS.PROVIDER_TIMEOUT);
        await this.latency(input.journeys.map((item) => `${item.origin}-${item.destination}-${item.departureDate}`).join("|"));
        const offers = await generateFlightOffers(input, financialContext);
        offers.forEach((offer) => this.offers.set(offer.offerId, offer));
        return { provider: "MOCK", currency: input.currency, offers };
    }

    async getOffer(offerId) { return this.offers.get(offerId) || null; }

    async revalidate({ offer }) {
        this.failIf(PROVIDER_ERRORS.PROVIDER_TIMEOUT);
        this.failIf(PROVIDER_ERRORS.FARE_UNAVAILABLE);
        this.failIf(PROVIDER_ERRORS.FLIGHT_UNAVAILABLE);
        await this.latency(offer.offerId);
        const forcedPriceChange = this.forceError === PROVIDER_ERRORS.PRICE_CHANGED;
        const roll = hashNumber(offer.offerId, "revalidation") % 1000;
        if (forcedPriceChange || roll < 18) {
            const increase = 1.03 + (hashNumber(offer.offerId, "increase") % 10) / 100;
            const flightSubtotal = Math.round((offer.price.flightSubtotal * increase) / 100) * 100;
            const currentPrice = { ...offer.price, flightSubtotal, total: flightSubtotal };
            return { status: REVALIDATION_STATUS.PRICE_CHANGED, offerId: offer.offerId, previousPrice: offer.price, currentPrice, difference: currentPrice.total - offer.price.total, requiresAcceptance: true };
        }
        if (roll < 23) return { status: REVALIDATION_STATUS.FARE_UNAVAILABLE, offerId: offer.offerId };
        if (roll < 27) return { status: REVALIDATION_STATUS.FLIGHT_UNAVAILABLE, offerId: offer.offerId };
        return { status: REVALIDATION_STATUS.CONFIRMED, offerId: offer.offerId, currentPrice: offer.price, requiresAcceptance: false };
    }

    async getSeatMap(offerId, storedOffer) {
        const offer = storedOffer || await this.getOffer(offerId);
        return offer ? generateSeatMap(offer) : null;
    }

    async createBooking({ offer, fareId, passengers, seats = [], requestId }) {
        this.failIf(PROVIDER_ERRORS.PROVIDER_TIMEOUT);
        this.failIf(PROVIDER_ERRORS.BOOKING_FAILED);
        this.failIf(PROVIDER_ERRORS.SEAT_UNAVAILABLE);
        await this.latency(requestId || offer.offerId);
        const bookingRoll = hashNumber(requestId || offer.offerId, "booking-failure") % 1000;
        if (!this.forceError && bookingRoll < 2) {
            const error = new Error("Mock provider timed out");
            error.code = PROVIDER_ERRORS.PROVIDER_TIMEOUT;
            throw error;
        }
        if (!this.forceError && bookingRoll >= 2 && bookingRoll < 8) {
            const error = new Error("Mock provider could not create the booking");
            error.code = PROVIDER_ERRORS.BOOKING_FAILED;
            throw error;
        }
        const fare = offer.fares.find((item) => item.fareId === fareId);
        if (!fare) {
            const error = new Error("Fare is no longer available");
            error.code = PROVIDER_ERRORS.FARE_UNAVAILABLE;
            throw error;
        }
        const reservation = reserveBookingInventory({
            inventoryKey: offer.inventoryKey,
            quantity: passengers.length,
            offerId: offer.offerId,
            seatNumbers: seats.map((seat) => `${seat.segmentId}:${seat.seatNumber}`),
        });
        if (reservation !== "RESERVED") {
            const error = new Error(reservation === "SEAT_UNAVAILABLE" ? "A selected seat is no longer available" : "Fare is no longer available");
            error.code = PROVIDER_ERRORS[reservation];
            throw error;
        }
        const seed = requestId || `${offer.offerId}:${passengers.map((item) => item.lastName).join("-")}`;
        const providerReference = `MOCK-${reference("", seed, 6)}`;
        const booking = {
            provider: "MOCK",
            providerReference,
            pnr: reference("", `${seed}:pnr`, 6).replace(/0/g, "A"),
            status: "CONFIRMED",
            ticketingStatus: "TICKETED",
            tickets: passengers.map((passenger, index) => ({ passengerIndex: index, ticketNumber: `098${reference("", `${seed}:${index}`, 10)}` })),
            offer: { ...offer, fare, price: fare.pricing },
            seats,
            createdAt: new Date().toISOString(),
        };
        this.bookings.set(providerReference, booking);
        return booking;
    }

    async getBooking(providerReference) { return this.bookings.get(providerReference) || null; }

    async cancelBooking(booking) {
        const refundable = Boolean(booking.fareSnapshot?.refundable ?? booking.offer?.fare?.refundable);
        const response = { status: "CANCELLED", providerReference: booking.providerReference, refundable, refundStatus: refundable ? "REFUND_PENDING" : "NOT_APPLICABLE" };
        this.bookings.set(booking.providerReference, { ...booking, ...response });
        return response;
    }
}
