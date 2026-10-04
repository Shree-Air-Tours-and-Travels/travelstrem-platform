import { jest } from "@jest/globals";

jest.unstable_mockModule("../../shared/redis/client.js", () => ({ getRedis: () => null }));

const { validateFlightSearch } = await import("../../modules/flights/schemas/flight.validation.js");
const { generateFlightOffers } = await import("../../modules/flights/providers/mock/mock-flight-generator.js");
const { generateSeatMap } = await import("../../modules/flights/providers/mock/mock-seat-generator.js");
const { resetMockInventory } = await import("../../modules/flights/providers/mock/mock-inventory-engine.js");
const { default: MockFlightProvider } = await import("../../modules/flights/providers/mock/mock-flight.provider.js");
const { createFlightProvider, resetFlightProviderFactory } = await import("../../modules/flights/providers/flight-provider.factory.js");
const { default: FlightOfferStore, clearFlightOfferMemory } = await import("../../modules/flights/services/flight-offer.store.js");
const { default: FlightService } = await import("../../modules/flights/services/flight.service.js");
const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const searchInput = (overrides = {}) => validateFlightSearch({
    tripType: "ONE_WAY",
    origin: "DEL",
    destination: "BOM",
    departureDate: futureDate(60),
    adults: 1,
    children: 0,
    infants: 0,
    cabin: "ECONOMY",
    currency: "INR",
    ...overrides,
}).value;

beforeEach(() => {
    resetMockInventory();
    clearFlightOfferMemory();
    resetFlightProviderFactory();
});

test("generates deterministic direct and connecting offers with three fare brands", () => {
    const input = searchInput();
    const first = generateFlightOffers(input);
    const second = generateFlightOffers(input);
    expect(second).toEqual(first);
    expect(first).toHaveLength(6);
    expect(first.some((offer) => offer.segments.length === 1)).toBe(true);
    expect(first.some((offer) => offer.segments.length > 1)).toBe(true);
    expect(first[0].fares.map((fare) => fare.brand)).toEqual(["SAVER", "VALUE", "FLEX"]);
});

test("pricing is deterministic and responds to cabin, fare brand and passenger type", () => {
    const economy = generateFlightOffers(searchInput({ adults: 1 }))[0];
    const business = generateFlightOffers(searchInput({ adults: 1, children: 1, infants: 1, cabin: "BUSINESS" }))[0];
    expect(generateFlightOffers(searchInput({ adults: 1 }))[0].price).toEqual(economy.price);
    expect(business.price.total).toBeGreaterThan(economy.price.total);
    expect(economy.fares.find((fare) => fare.brand === "FLEX").pricing.total).toBeGreaterThan(economy.fares.find((fare) => fare.brand === "VALUE").pricing.total);
    expect(business.price.passengers.map((item) => item.passengerType)).toEqual(["ADULT", "CHILD", "INFANT"]);
});

test("supports round-trip and multi-city journey arrays", () => {
    const roundTrip = generateFlightOffers(searchInput({ tripType: "ROUND_TRIP", returnDate: futureDate(67) }));
    const multiValidation = validateFlightSearch({ tripType: "MULTI_CITY", journeys: [
        { origin: "DEL", destination: "DXB", departureDate: futureDate(60) },
        { origin: "DXB", destination: "LHR", departureDate: futureDate(64) },
        { origin: "LHR", destination: "DEL", departureDate: futureDate(70) },
    ], adults: 1, cabin: "ECONOMY" });
    expect(multiValidation.ok).toBe(true);
    expect(roundTrip[0].segments).toHaveLength(2);
    expect(generateFlightOffers(multiValidation.value)[0].segments).toHaveLength(3);
});

test("generates stable A320, 737 and 787-style seat maps with priced seat features", () => {
    const domesticOffers = generateFlightOffers(searchInput());
    const internationalOffers = generateFlightOffers(searchInput({ destination: "LHR" }));
    const maps = [generateSeatMap(domesticOffers[0]), generateSeatMap(internationalOffers[0])];
    expect(maps[0].segments[0].seats[0]).toEqual(expect.objectContaining({ seatNumber: "1A", type: "WINDOW", status: expect.any(String), price: expect.objectContaining({ unit: "MINOR" }) }));
    expect(maps[1].segments[0].aircraft.code).toBe("B787");
    expect(generateSeatMap(domesticOffers[0])).toEqual(maps[0]);
});

test("supports forced price change and fare unavailable revalidation", async () => {
    const priceProvider = new MockFlightProvider({ minLatency: 0, maxLatency: 0, forceError: "PRICE_CHANGED" });
    const offer = (await priceProvider.search(searchInput())) .offers[0];
    await expect(priceProvider.revalidate({ offer })).resolves.toEqual(expect.objectContaining({ status: "PRICE_CHANGED", requiresAcceptance: true }));
    const fareProvider = new MockFlightProvider({ minLatency: 0, maxLatency: 0, forceError: "FARE_UNAVAILABLE" });
    await expect(fareProvider.revalidate({ offer })).rejects.toEqual(expect.objectContaining({ code: "FARE_UNAVAILABLE" }));
});

test("prevents the same seat from being booked twice", async () => {
    const provider = new MockFlightProvider({ minLatency: 0, maxLatency: 0, forceError: "" });
    const offer = (await provider.search(searchInput())).offers.find((item) => item.availability.fareBucketAvailable >= 2);
    const seatMap = await provider.getSeatMap(offer.offerId, offer);
    const seat = seatMap.segments[0].seats.find((item) => item.status === "AVAILABLE");
    const selection = [{ segmentId: seatMap.segments[0].segmentId, seatNumber: seat.seatNumber }];
    const payload = { offer, fareId: offer.fare.fareId, passengers: [{ lastName: "Traveller" }], seats: selection };
    await expect(provider.createBooking({ ...payload, requestId: "first" })).resolves.toEqual(expect.objectContaining({ status: "CONFIRMED" }));
    await expect(provider.createBooking({ ...payload, requestId: "second" })).rejects.toEqual(expect.objectContaining({ code: "SEAT_UNAVAILABLE" }));
});

test("simulates booking failure without calling an external provider", async () => {
    const provider = new MockFlightProvider({ minLatency: 0, maxLatency: 0, forceError: "BOOKING_FAILED" });
    const offer = generateFlightOffers(searchInput())[0];
    await expect(provider.createBooking({ offer, fareId: offer.fare.fareId, passengers: [{}] })).rejects.toEqual(expect.objectContaining({ code: "BOOKING_FAILED" }));
});

test("expires temporary searches", async () => {
    const store = new FlightOfferStore({ ttlSeconds: 0.001 });
    await store.set("search", "expired-search", { searchId: "expired-search" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await expect(store.getSearch("expired-search")).resolves.toBeNull();
});

test("creates and retrieves a normalized persistent booking snapshot through injected repository", async () => {
    const provider = new MockFlightProvider({ minLatency: 0, maxLatency: 0, forceError: "" });
    const store = new FlightOfferStore();
    const providerSearch = await provider.search(searchInput());
    const search = { searchId: "search-booking", expiresAt: new Date(Date.now() + 60000).toISOString(), currency: "INR", input: searchInput(), offers: providerSearch.offers };
    await store.saveSearch(search);
    let saved;
    const repository = {
        create: jest.fn(async (value) => { saved = { ...value, bookingRef: "TRM-FLT-260001", createdAt: new Date(), updatedAt: new Date(), toObject() { return this; } }; return saved; }),
        findById: jest.fn(async () => saved),
        update: jest.fn(async (_id, updates) => { saved = { ...saved, ...updates }; return saved; }),
    };
    provider.revalidate = jest.fn(async ({ offer: selectedOffer }) => ({ status: "CONFIRMED", currentPrice: selectedOffer.price, requiresAcceptance: false }));
    const service = new FlightService({ provider, store, bookings: repository });
    const offer = providerSearch.offers.find((item) => item.availability.fareBucketAvailable >= 1);
    const passenger = { type: "ADULT", title: "Mr", firstName: "Aman", lastName: "Shah", gender: "MALE", dateOfBirth: "1990-01-01", nationality: "IN" };
    const booking = await service.createBooking({ searchId: search.searchId, offerId: offer.offerId, fareId: offer.fare.fareId, passengers: [passenger], seats: [], extras: [], acceptPriceChange: true }, { sub: "507f1f77bcf86cd799439011", role: "member" });
    expect(booking).toEqual(expect.objectContaining({ bookingId: "TRM-FLT-260001", pnr: expect.any(String), segments: expect.any(Array), price: expect.any(Object) }));
    await expect(service.getBooking(booking.bookingId, { sub: "another-user", role: "member" })).rejects.toEqual(expect.objectContaining({ code: "BOOKING_FORBIDDEN" }));
});

test("provider factory selects mock and rejects unregistered production providers", () => {
    expect(createFlightProvider("mock", { fresh: true, minLatency: 0, maxLatency: 0 })).toBeInstanceOf(MockFlightProvider);
    expect(() => createFlightProvider("amadeus")).toThrow("Unsupported flight provider");
});
