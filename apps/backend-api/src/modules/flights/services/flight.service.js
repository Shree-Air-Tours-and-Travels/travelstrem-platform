import crypto from "crypto";
import logger from "../../../shared/logger/index.js";
import ApiError from "../../../shared/errors/ApiError.js";
import { airports } from "../data/catalog.js";
import { createFlightProvider } from "../providers/flight-provider.factory.js";
import FlightOfferStore from "./flight-offer.store.js";
import FlightBookingRepository from "./flight-booking.repository.js";
import ContactLead from "../../forms/models/ContactLead.js";
import User from "../../auth/models/User.js";
import { createReadableReference } from "../../../utils/readableReference.js";
import { enquiryDto, publishToUser, REALTIME_EVENTS } from "../../../realtime/index.js";
import { FLIGHT_BOOKING_STATUS, FLIGHT_SEARCH_TTL_SECONDS, REVALIDATION_STATUS } from "../types/flight.types.js";

const domainError = (status, code, message, details) => {
    const error = new ApiError(status, message, details);
    error.code = code;
    return error;
};
const actorId = (actor) => String(actor?.sub || actor?.id || actor?._id || "");
const sameId = (left, right) => String(left || "") === String(right || "");

const publicBooking = (booking) => ({
    bookingId: booking.bookingRef,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    ticketingStatus: booking.ticketingStatus,
    pnr: booking.pnr,
    provider: booking.provider,
    providerReference: booking.providerReference,
    passengers: (booking.passengers || []).map((passenger) => ({
        type: passenger.type,
        title: passenger.title,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        gender: passenger.gender,
        dateOfBirth: passenger.dateOfBirth,
        nationality: passenger.nationality,
        ...(passenger.passport ? { passport: { expiryDate: passenger.passport.expiryDate, issuingCountry: passenger.passport.issuingCountry, nationality: passenger.passport.nationality, numberMasked: "••••••" } } : {}),
    })),
    segments: booking.segmentSnapshot,
    fare: booking.fareSnapshot,
    price: booking.priceSnapshot,
    baggage: booking.baggageSnapshot,
    seats: booking.seatSnapshot,
    extras: booking.extrasSnapshot,
    tickets: booking.tickets,
    cancellation: booking.cancellation,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
});

export default class FlightService {
    constructor({ provider = createFlightProvider(), store = new FlightOfferStore(), bookings = new FlightBookingRepository(), now = () => Date.now() } = {}) {
        this.provider = provider;
        this.store = store;
        this.bookings = bookings;
        this.now = now;
    }

    async search(input, actor = {}) {
        const searchId = crypto.randomUUID();
        const startedAt = this.now();
        logger.info("[Flights] search started", { provider: this.provider.name, searchId });
        try {
            const response = await this.provider.search(input, {
                agencyId: actor?.agencyId || null,
                customerType: actor?.agencyRole || null,
                paymentProvider: "razorpay",
            });
            const expiresAt = new Date(this.now() + FLIGHT_SEARCH_TTL_SECONDS * 1000).toISOString();
            const search = { searchId, expiresAt, currency: input.currency, provider: response.provider, input, offers: response.offers };
            await this.store.saveSearch(search);
            logger.info("[Flights] search completed", { provider: this.provider.name, searchId, offers: response.offers.length, latencyMs: this.now() - startedAt });
            return search;
        } catch (error) {
            logger.error("[Flights] provider search failed", { provider: this.provider.name, searchId, code: error.code || "PROVIDER_ERROR", latencyMs: this.now() - startedAt });
            throw domainError(error.code === "PROVIDER_TIMEOUT" ? 504 : 502, error.code || "FLIGHT_PROVIDER_ERROR", "Flight search is temporarily unavailable");
        }
    }

    async requireSearch(searchId) {
        const search = await this.store.getSearch(searchId);
        if (!search || new Date(search.expiresAt).getTime() <= this.now()) throw domainError(410, "SEARCH_EXPIRED", "This flight search has expired. Please search again.");
        return search;
    }

    async requireOffer(searchId, offerId) {
        await this.requireSearch(searchId);
        const offer = await this.store.getOffer(offerId);
        if (!offer || offer.searchId !== searchId) throw domainError(404, "OFFER_NOT_FOUND", "Flight offer was not found");
        return offer;
    }

    async results(searchId, filters = {}) {
        const search = await this.requireSearch(searchId);
        const airlines = String(filters.airlines || "").split(",").filter(Boolean);
        const maxPrice = Number(filters.maxPrice);
        let offers = search.offers.filter((offer) => {
            if (airlines.length && !offer.segments.some((segment) => airlines.includes(segment.airline.code) || airlines.includes(segment.airline.name))) return false;
            const cabin = String(filters.cabin || "").replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
            if (cabin && offer.fare.cabin !== cabin) return false;
            if (filters.stops !== undefined && filters.stops !== "" && Math.max(...offer.segments.map((segment) => segment.stops), offer.segments.length - search.input.journeys.length) > Number(filters.stops)) return false;
            if (filters.refundable !== undefined && filters.refundable !== "" && offer.fare.refundable !== (String(filters.refundable) === "true")) return false;
            if (Number.isFinite(maxPrice) && maxPrice > 0 && offer.price.total > maxPrice * 100) return false;
            if (filters.maxDuration && offer.segments.reduce((total, segment) => total + segment.durationMinutes, 0) > Number(filters.maxDuration)) return false;
            if (filters.departureAfter && offer.segments[0].departureDateTime.slice(11, 16) < filters.departureAfter) return false;
            if (filters.arrivalBefore && offer.segments.at(-1).arrivalDateTime.slice(11, 16) > filters.arrivalBefore) return false;
            if (filters.baggage && offer.fare.baggage.checked.weightKg < Number(filters.baggage)) return false;
            return true;
        });
        const duration = (offer) => offer.segments.reduce((total, segment) => total + segment.durationMinutes, 0);
        const requestedSort = String(filters.sort || "RECOMMENDED").replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
        const sort = { PRICE_ASC: "CHEAPEST", DEPARTURE_ASC: "EARLIEST_DEPARTURE" }[requestedSort] || requestedSort;
        offers = [...offers].sort((left, right) => sort === "CHEAPEST" ? left.price.total - right.price.total : sort === "FASTEST" ? duration(left) - duration(right) : sort === "EARLIEST_DEPARTURE" ? left.segments[0].departureDateTime.localeCompare(right.segments[0].departureDateTime) : sort === "LATEST_DEPARTURE" ? right.segments[0].departureDateTime.localeCompare(left.segments[0].departureDateTime) : right.score - left.score);
        const perPage = Math.min(20, Math.max(1, Number(filters.perPage) || 10));
        const totalPages = Math.max(1, Math.ceil(offers.length / perPage));
        const page = Math.min(totalPages, Math.max(1, Number(filters.page) || 1));
        const airlineMap = new Map();
        search.offers.flatMap((offer) => offer.segments).forEach((segment) => {
            const current = airlineMap.get(segment.airline.code) || { id: segment.airline.code, value: segment.airline.code, label: segment.airline.name, icon: segment.airline.icon, initial: segment.airline.code, count: 0 };
            current.count += 1;
            airlineMap.set(segment.airline.code, current);
        });
        return { searchId, expiresAt: search.expiresAt, currency: search.currency, offers: offers.slice((page - 1) * perPage, page * perPage), pagination: { page, perPage, total: offers.length, totalPages }, facets: { airlines: [...airlineMap.values()] } };
    }

    async authoritativeSeatPrice(offer, seats = []) {
        if (!seats.length) return { seatFees: 0, seatMap: null };
        const seatMap = await this.provider.getSeatMap(offer.offerId, offer);
        const seatsByKey = new Map(seatMap.segments.flatMap((segment) => segment.seats.map((seat) => [`${segment.segmentId}:${seat.seatNumber}`, seat])));
        const selected = seats.map((seat) => seatsByKey.get(`${seat.segmentId}:${seat.seatNumber}`));
        if (selected.some((seat) => seat?.status !== "AVAILABLE")) throw domainError(409, "SEAT_UNAVAILABLE", "A selected seat is no longer available");
        return { seatMap, seatFees: selected.reduce((total, seat) => total + Number(seat.price?.total || 0), 0) };
    }

    async revalidate({ searchId, offerId, fareId, seats = [] }) {
        const offer = await this.requireOffer(searchId, offerId);
        const fare = fareId ? offer.fares.find((item) => item.fareId === fareId) : offer.fare;
        if (!fare) return { status: REVALIDATION_STATUS.FARE_UNAVAILABLE, offerId };
        const selectedOffer = fare ? { ...offer, fare, price: fare.pricing } : offer;
        logger.info("[Flights] revalidation", { provider: this.provider.name, searchId, offerId });
        try {
            const result = await this.provider.revalidate({ searchId, offerId, offer: selectedOffer });
            if (![REVALIDATION_STATUS.CONFIRMED, REVALIDATION_STATUS.PRICE_CHANGED].includes(result.status)) return result;
            const { seatFees } = await this.authoritativeSeatPrice(offer, seats);
            const addSeats = (price) => {
                const finalAmount = Number(price?.finalAmount ?? price?.total ?? 0) + seatFees;
                return { ...price, seatFees, finalAmount, total: finalAmount };
            };
            return {
                ...result,
                previousPrice: result.previousPrice ? addSeats(result.previousPrice) : result.previousPrice,
                currentPrice: addSeats(result.currentPrice || fare.pricing),
                difference: Number(result.difference || 0),
            };
        }
        catch (error) {
            if (["FARE_UNAVAILABLE", "FLIGHT_UNAVAILABLE"].includes(error.code)) return { status: error.code, offerId };
            if (error.code === "SEAT_UNAVAILABLE") throw error;
            throw domainError(error.code === "PROVIDER_TIMEOUT" ? 504 : 502, error.code || "REVALIDATION_FAILED", "Flight revalidation failed");
        }
    }

    async getOffer(searchId, offerId) {
        return this.requireOffer(searchId, offerId);
    }

    async createEnquiry({ searchId, offerId, fareId }, actor) {
        const userId = actorId(actor);
        if (!userId) throw domainError(401, "AUTH_REQUIRED", "Please sign in to create a flight enquiry");
        const search = await this.requireSearch(searchId);
        const offer = await this.requireOffer(searchId, offerId);
        const fare = offer.fares.find((item) => item.fareId === fareId);
        if (!fare) throw domainError(409, "FARE_UNAVAILABLE", "Selected fare is unavailable");
        const revalidation = await this.revalidate({ searchId, offerId, fareId, seats: [] });
        if (![REVALIDATION_STATUS.CONFIRMED, REVALIDATION_STATUS.PRICE_CHANGED].includes(revalidation.status)) {
            throw domainError(409, revalidation.status, "The selected flight is no longer available");
        }
        const customer = await User.findById(userId).select("name email phone phoneNumber mobile").lean();
        const firstSegment = offer.segments[0];
        const lastSegment = offer.segments.at(-1);
        const counts = offer.requirements?.passengerCounts || {};
        const travellerCount = Object.values(counts).reduce((total, count) => total + Number(count || 0), 0);
        const price = revalidation.currentPrice || fare.pricing;
        const route = `${firstSegment.origin.iataCode} to ${lastSegment.destination.iataCode}`;
        const departure = new Date(firstSegment.departureDateTime);
        const priceSummary = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: price.currency || "INR",
            maximumFractionDigits: 0,
        }).format(Number(price.total || 0) / 100);
        const formatPrice = (amount) => new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: price.currency || "INR",
            maximumFractionDigits: 0,
        }).format(Number(amount || 0) / 100);
        const choice = { ONE_WAY: "oneway", ROUND_TRIP: "roundTrip", MULTI_CITY: "multiTrip" }[search.input.tripType] || "oneway";
        const searchParams = new URLSearchParams({
            choice,
            travellers: String(travellerCount),
            adults: String(search.input.adults),
            children: String(search.input.children),
            infants: String(search.input.infants),
            cabin: fare.cabin,
            currency: search.input.currency,
            directOnly: String(Boolean(search.input.directOnly)),
        });
        if (search.input.tripType === "MULTI_CITY") {
            searchParams.set("segments", JSON.stringify(search.input.journeys.map((journey) => ({
                from: journey.origin,
                to: journey.destination,
                departDate: journey.departureDate,
            }))));
        } else {
            searchParams.set("from", search.input.journeys[0].origin);
            searchParams.set("to", search.input.journeys[0].destination);
            searchParams.set("departDate", search.input.journeys[0].departureDate);
            if (search.input.tripType === "ROUND_TRIP") searchParams.set("returnDate", search.input.journeys[1].departureDate);
        }
        const searchUrl = `/trehub/flights?${searchParams.toString()}`;
        const lead = new ContactLead({
            form: "flight-booking",
            enquiryRef: createReadableReference("ENQ"),
            claimedBy: userId,
            product: "trehub",
            journeyType: "flight",
            tourTitle: `${route} flight`,
            url: `/trehub/flights/${encodeURIComponent(offerId)}?searchId=${encodeURIComponent(searchId)}`,
            fields: {
                name: customer?.name || actor?.name || "Traveller",
                email: customer?.email || actor?.email || "",
                phone: customer?.phone || customer?.phoneNumber || customer?.mobile || "",
                preferredContact: "email",
                adultCount: String(counts.ADULT || 0),
                childCount: String(counts.CHILD || 0),
                infantCount: String(counts.INFANT || 0),
                travellerCount: String(travellerCount),
                route,
                departureSummary: Number.isNaN(departure.getTime())
                    ? firstSegment.departureDateTime
                    : departure.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: firstSegment.origin.timezone }),
                preferredTravelDate: firstSegment.departureDateTime,
                airline: `${firstSegment.airline.name} · ${firstSegment.flightNumber}`,
                cabin: `${fare.cabin.replaceAll("_", " ")} · ${fare.brand}`,
                flightChargeSummary: `${formatPrice(price.flightSubtotal)} for ${travellerCount} traveller${travellerCount === 1 ? "" : "s"}`,
                convenienceFeeSummary: formatPrice(price.convenienceFee),
                priceSummary,
                message: "Flight selected in Trehub. Traveller details are pending.",
            },
            customizationSnapshot: {
                type: "FLIGHT",
                travellers: travellerCount,
                searchId,
                offerId,
                fareId,
                searchInput: search.input,
                searchUrl,
                requiresPassport: Boolean(offer.requirements?.passportRequired),
                segments: offer.segments,
                fare,
                price,
            },
        });
        for (let attempt = 0; attempt < 5; attempt += 1) {
            try {
                await lead.save();
                break;
            } catch (error) {
                if (error?.code !== 11000 || attempt === 4) throw error;
                lead.enquiryRef = createReadableReference("ENQ");
            }
        }
        publishToUser(userId, REALTIME_EVENTS.ENQUIRY_CREATED, enquiryDto(lead)).catch(() => {});
        return {
            enquiryId: String(lead._id),
            enquiryRef: lead.enquiryRef,
            targetPath: `/?tab=bookings&enquiry=${encodeURIComponent(lead.enquiryRef)}`,
        };
    }

    async seatMap(offerId) {
        const offer = await this.store.getOffer(offerId);
        if (!offer || new Date(offer.expiresAt).getTime() <= this.now()) throw domainError(410, "SEARCH_EXPIRED", "This flight offer has expired");
        const seatMap = await this.provider.getSeatMap(offerId, offer);
        if (!seatMap) throw domainError(404, "OFFER_NOT_FOUND", "Flight offer was not found");
        return seatMap;
    }

    async createBooking(input, actor) {
        const offer = await this.requireOffer(input.searchId, input.offerId);
        const fare = offer.fares.find((item) => item.fareId === input.fareId);
        if (!fare) throw domainError(409, "FARE_UNAVAILABLE", "Selected fare is unavailable");
        if (input.passengers.length !== offer.price.passengers.reduce((total, item) => total + item.count, 0)) throw domainError(400, "PASSENGER_COUNT_MISMATCH", "Passenger details do not match the searched passenger count");
        const international = offer.segments.some((segment) => segment.origin.countryCode !== segment.destination.countryCode);
        if (international && input.passengers.some((passenger) => !passenger.passport?.number || !passenger.passport?.expiryDate || !passenger.passport?.issuingCountry)) {
            throw domainError(400, "PASSPORT_REQUIRED", "Passport details are required for every passenger on international flights");
        }
        const seatKeys = input.seats.map((seat) => `${seat.segmentId}:${seat.seatNumber}`);
        if (new Set(seatKeys).size !== seatKeys.length) throw domainError(400, "DUPLICATE_SEAT", "A seat can only be selected once");
        for (const segment of offer.segments) {
            if (input.seats.filter((seat) => seat.segmentId === segment.segmentId).length > input.passengers.length) throw domainError(400, "TOO_MANY_SEATS", "Seat selections cannot exceed the passenger count for a flight segment");
        }
        const revalidation = await this.revalidate(input);
        if ([REVALIDATION_STATUS.FARE_UNAVAILABLE, REVALIDATION_STATUS.FLIGHT_UNAVAILABLE].includes(revalidation.status)) throw domainError(409, revalidation.status, "The selected flight is no longer available");
        if (revalidation.status === REVALIDATION_STATUS.PRICE_CHANGED && !input.acceptPriceChange) throw domainError(409, "PRICE_CHANGED", "The fare changed and requires acceptance", revalidation);
        const authoritativePrice = revalidation.currentPrice || fare.pricing;
        const requestId = crypto.randomUUID();
        logger.info("[Flights] booking attempt", { provider: this.provider.name, searchId: input.searchId, offerId: input.offerId, requestId, userId: actorId(actor) });
        try {
            const providerBooking = await this.provider.createBooking({ ...input, offer: { ...offer, price: authoritativePrice }, fareId: fare.fareId, requestId });
            const booking = await this.bookings.create({
                userId: actorId(actor), agencyId: actor?.agencyId || null, ownerAgent: actor?.agencyRole === "partner_agent" ? actorId(actor) : null,
                status: providerBooking.status === "CONFIRMED" ? FLIGHT_BOOKING_STATUS.CONFIRMED : FLIGHT_BOOKING_STATUS.PENDING,
                paymentStatus: "PENDING", ticketingStatus: providerBooking.ticketingStatus,
                searchId: input.searchId, offerId: input.offerId, provider: providerBooking.provider, providerReference: providerBooking.providerReference, pnr: providerBooking.pnr,
                passengers: input.passengers, segmentSnapshot: offer.segments, fareSnapshot: fare, priceSnapshot: authoritativePrice,
                baggageSnapshot: fare.baggage, seatSnapshot: input.seats, extrasSnapshot: input.extras, tickets: providerBooking.tickets,
            });
            return publicBooking(booking.toObject ? booking.toObject() : booking);
        } catch (error) {
            logger.error("[Flights] provider booking failed", { provider: this.provider.name, requestId, code: error.code || "BOOKING_FAILED" });
            throw domainError(error.code === "PROVIDER_TIMEOUT" ? 504 : 409, error.code || "BOOKING_FAILED", "Flight booking could not be completed");
        }
    }

    canAccess(booking, actor) {
        if (sameId(booking.userId, actorId(actor))) return true;
        if (actor?.role === "super_admin" || (actor?.role === "admin" && actor?.adminLevel === "master")) return true;
        if (!booking.agencyId || !sameId(booking.agencyId, actor?.agencyId)) return false;
        return actor?.agencyRole === "partner_admin" || (actor?.agencyRole === "partner_agent" && sameId(booking.ownerAgent, actorId(actor)));
    }

    async getBooking(identifier, actor, byPnr = false) {
        const booking = byPnr ? await this.bookings.findByPnr(identifier) : await this.bookings.findById(identifier);
        if (!booking) throw domainError(404, "BOOKING_NOT_FOUND", "Flight booking was not found");
        if (!this.canAccess(booking, actor)) throw domainError(403, "BOOKING_FORBIDDEN", "You cannot access this flight booking");
        return publicBooking(booking);
    }

    async cancelBooking(bookingId, actor) {
        const booking = await this.bookings.findById(bookingId);
        if (!booking) throw domainError(404, "BOOKING_NOT_FOUND", "Flight booking was not found");
        if (!this.canAccess(booking, actor)) throw domainError(403, "BOOKING_FORBIDDEN", "You cannot cancel this flight booking");
        if ([FLIGHT_BOOKING_STATUS.CANCELLED, FLIGHT_BOOKING_STATUS.REFUNDED].includes(booking.status)) return publicBooking(booking);
        const cancellation = await this.provider.cancelBooking(booking);
        const updated = await this.bookings.update(bookingId, { status: cancellation.refundable ? FLIGHT_BOOKING_STATUS.REFUND_PENDING : FLIGHT_BOOKING_STATUS.CANCELLED, paymentStatus: cancellation.refundable ? "REFUND_PENDING" : booking.paymentStatus, cancellation: { ...cancellation, cancelledAt: new Date().toISOString() } });
        return publicBooking(updated);
    }

    searchAirports(query) {
        const term = String(query || "").trim().toLowerCase();
        if (!term) return [];
        return airports.filter((airport) => [airport.iataCode, airport.name, airport.city, airport.country].some((value) => value.toLowerCase().includes(term))).slice(0, 12).map(({ latitude: _latitude, longitude: _longitude, ...airport }) => airport);
    }
}
