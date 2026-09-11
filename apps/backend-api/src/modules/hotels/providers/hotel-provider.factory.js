import HotelProvider from "../../../providers/travel/contracts/HotelProvider.js";

const image = (id, width = 1200) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const dateBefore = (value, days) => {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
};
const HOTEL_IMAGES = [
    [
        "photo-1566073771259-6a8506099945",
        "photo-1564501049412-61c2a3083791",
        "photo-1542314831-068cd1dbfeeb",
    ],
    [
        "photo-1520250497591-112f2f40a3f4",
        "photo-1571896349842-33c89424de2d",
        "photo-1551882547-ff40c63fe5fa",
    ],
    [
        "photo-1445019980597-93fa8acb246c",
        "photo-1582719478250-c89cae4dc85b",
        "photo-1564501049412-61c2a3083791",
    ],
    [
        "photo-1549294413-26f195200c16",
        "photo-1566073771259-6a8506099945",
        "photo-1520250497591-112f2f40a3f4",
    ],
];
const ROOM_IMAGES = [
    [
        "photo-1611892440504-42a792e24d32",
        "photo-1590490360182-c33d57733427",
        "photo-1631049307264-da0ec9d70304",
    ],
    [
        "photo-1598928636135-d146006ff4be",
        "photo-1566665797739-1674de7a421a",
        "photo-1586023492125-27b2c045efd7",
    ],
    [
        "photo-1560185007-c5ca9d2c014d",
        "photo-1560185127-6ed189bf02f4",
        "photo-1591088398332-8a7791972843",
    ],
];

// Providers return hotel records and room rates in integer minor currency units.
// Room rates include supplier taxes; platform/payment fees belong to the service.
export class MockHotelProvider extends HotelProvider {
    constructor() {
        super({ name: "mock" });
    }

    async searchHotels(input) {
        return Array.from({ length: 8 }, (_, index) => ({
            hotelId: `MOCK-HOTEL-${index + 1}`,
            name: `${input.destination} ${["Grand", "Garden", "Riverside", "Central", "Palace", "Retreat", "Suites", "Residence"][index]}`,
            address: `${input.destination} city centre`,
            stars: 3 + (index % 3),
            rating: (8 + index / 10).toFixed(1),
            reviewCount: 1246 + index * 187,
            distanceFromCentreMeters: 500 + index * 250,
            checkInTime: "14:00",
            checkOutTime: "11:00",
            payAtProperty: index % 3 !== 2,
            images: HOTEL_IMAGES[index % HOTEL_IMAGES.length].map((id) => image(id)),
            reviews: [],
            description:
                "A relaxing city stay with comfortable rooms, attentive service and convenient access to local attractions.",
            amenities: [
                "Wi-Fi",
                "Reception 24/7",
                ...(index % 2 ? ["Pool", "Restaurant"] : ["Parking", "Restaurant"]),
                "Airport transfer",
                "Spa",
            ],
            policies: [
                "Check-in from 14:00; check-out by 11:00, property local time.",
                "Government-issued photo identification is required for all guests.",
                "Special requests are subject to property availability.",
            ],
            rooms: ["Classic", "Deluxe", "Suite"].map((name, roomIndex) => ({
                roomId: `${index + 1}-${roomIndex + 1}`,
                name: `${name} room`,
                category: ["Essential", "Premium", "Signature"][roomIndex],
                bed: roomIndex === 2 ? "King bed and sofa bed" : "Double or twin beds",
                image: image(ROOM_IMAGES[roomIndex][0], 900),
                images: ROOM_IMAGES[roomIndex].map((id) => image(id, 1000)),
                facilities: ["Private bathroom", "Air conditioning", "Wi-Fi", "Tea and coffee"],
                size: `${24 + roomIndex * 12} m²`,
                capacity: roomIndex === 2 ? 4 : 2,
                available: 6 - (index % 3),
                nightlyAmountMinor: 250000 + index * 60000 + roomIndex * 180000,
                currency: "INR",
                meal: roomIndex < 2 ? "Breakfast included" : "Room only",
                refundable: roomIndex < 2,
                freeCancellationUntil: roomIndex < 2 ? dateBefore(input.checkIn, 2) : null,
                cancellation:
                    roomIndex < 2
                        ? "Free cancellation until 48 hours before check-in; then one night charged."
                        : "Non-refundable once booked.",
            })),
        }));
    }

    async getHotelDetails({ hotelId, input }) {
        return (await this.searchHotels(input)).find((hotel) => hotel.hotelId === hotelId) || null;
    }
}

const factories = new Map([["mock", () => new MockHotelProvider()]]);
export const registerHotelProvider = (name, factory) => factories.set(name.toLowerCase(), factory);
export const createHotelProvider = (name = process.env.HOTEL_PROVIDER || "mock") => {
    const factory = factories.get(name.toLowerCase());
    if (!factory) throw new Error(`Unsupported hotel provider: ${name}`);
    return factory();
};
