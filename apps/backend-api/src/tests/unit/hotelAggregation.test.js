import AggregateHotelProvider from "../../modules/hotels/providers/aggregate/aggregate.provider.js";

const hotel = ({
    hotelId,
    name = "The Grand Dubai Hotel",
    address = "Sheikh Zayed Road, Dubai",
    latitude = 25.2048,
    longitude = 55.2708,
    city = "Dubai",
    country = "AE",
    postalCode = "00000",
    amount = 10000,
    rateKey = "rate-1",
} = {}) => ({
    hotelId,
    name,
    address,
    identity: { name, address, latitude, longitude, city, country, postalCode },
    images: [],
    amenities: [],
    policies: [],
    detailSections: [],
    rooms: [
        {
            roomId: `${hotelId}-room`,
            roomTypeId: `${hotelId}-type`,
            ratePlanId: rateKey,
            name: "Deluxe room",
            occupancy: { maxGuests: 2, maxAdults: 2, maxChildren: 0 },
            available: 2,
            availabilityStatus: "AVAILABLE",
            sellUnit: "room",
            nightlyAmountMinor: amount,
            stayAmountMinor: amount,
            currency: "INR",
            images: [],
            facilities: [],
            inclusions: [],
            detailSections: [],
            providerReference: { rateKey },
        },
    ],
    providerReference: { supplierHotelId: hotelId },
});

const provider = (name, hotels) => ({
    name,
    isDemo: false,
    searchHotels: async () => hotels,
    getHotelDetails: async ({ hotelId }) => hotels.find((item) => item.hotelId === hotelId),
});

const completedSearch = async (providers) => {
    const initial = await new AggregateHotelProvider(providers).searchHotels({});
    return initial.providerCompletion || initial;
};

test("shows the same physical hotel from two suppliers once", async () => {
    const results = await completedSearch([
        provider("supplier-a", [hotel({ hotelId: "a-1" })]),
        provider("supplier-b", [hotel({ hotelId: "b-9", name: "Grand Dubai Hotel" })]),
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].supplierHotelIds).toHaveLength(2);
});

test("retains every supplier rate beneath the canonical hotel", async () => {
    const results = await completedSearch([
        provider("supplier-a", [hotel({ hotelId: "a-1", amount: 12000, rateKey: "a-rate" })]),
        provider("supplier-b", [hotel({ hotelId: "b-9", amount: 9000, rateKey: "b-rate" })]),
    ]);
    expect(results[0].rooms).toHaveLength(2);
    expect(results[0].providerReference.suppliers.map((item) => item.providerName)).toEqual([
        "supplier-a",
        "supplier-b",
    ]);
});

test("keeps similarly named hotels separate when location evidence differs", async () => {
    const results = await completedSearch([
        provider("supplier-a", [hotel({ hotelId: "a-1", name: "Grand Palace Hotel" })]),
        provider("supplier-b", [
            hotel({
                hotelId: "b-9",
                name: "Grand Palace Hotel Annex",
                address: "Palm Jumeirah, Dubai",
                latitude: 25.1124,
                longitude: 55.139,
                postalCode: "11111",
            }),
        ]),
    ]);
    expect(results).toHaveLength(2);
});

test("retains supplier diagnostics when every supplier returns no inventory", async () => {
    const results = await completedSearch([provider("supplier-a", []), provider("supplier-b", [])]);
    expect(results).toHaveLength(0);
    expect(results.providerDiagnostics).toEqual([
        expect.objectContaining({ name: "supplier-a", status: "success", count: 0 }),
        expect.objectContaining({ name: "supplier-b", status: "success", count: 0 }),
    ]);
});

test("the selected best rate retains supplier hotel and rate booking references", async () => {
    const providers = [
        provider("supplier-a", [hotel({ hotelId: "a-1", amount: 12000, rateKey: "a-rate" })]),
        provider("supplier-b", [hotel({ hotelId: "b-9", amount: 9000, rateKey: "b-rate" })]),
    ];
    const aggregate = new AggregateHotelProvider(providers);
    const initial = await aggregate.searchHotels({});
    const results = await (initial.providerCompletion || initial);
    const details = await aggregate.getHotelDetails({
        hotelId: results[0].hotelId,
        providerReference: results[0].providerReference,
        input: {},
    });
    const selected = details.rooms.reduce(
        (best, room) => (!best || room.stayAmountMinor < best.stayAmountMinor ? room : best),
        null,
    );
    expect(selected.providerReference).toEqual(
        expect.objectContaining({
            providerName: "supplier-b",
            hotelId: "b-9",
            supplier: { rateKey: "b-rate" },
        }),
    );
});
