import HotelProvider from "../../../../providers/travel/contracts/HotelProvider.js";

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
        "photo-1571896349842-33c89424de2d",
        "photo-1551882547-ff40c63fe5fa",
    ],
    [
        "photo-1520250497591-112f2f40a3f4",
        "photo-1571896349842-33c89424de2d",
        "photo-1551882547-ff40c63fe5fa",
        "photo-1566073771259-6a8506099945",
        "photo-1542314831-068cd1dbfeeb",
    ],
    [
        "photo-1445019980597-93fa8acb246c",
        "photo-1582719478250-c89cae4dc85b",
        "photo-1564501049412-61c2a3083791",
        "photo-1571896349842-33c89424de2d",
        "photo-1549294413-26f195200c16",
    ],
    [
        "photo-1549294413-26f195200c16",
        "photo-1566073771259-6a8506099945",
        "photo-1520250497591-112f2f40a3f4",
        "photo-1551882547-ff40c63fe5fa",
        "photo-1582719478250-c89cae4dc85b",
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
    [
        "photo-1590490360182-c33d57733427",
        "photo-1611892440504-42a792e24d32",
        "photo-1566665797739-1674de7a421a",
    ],
    [
        "photo-1586023492125-27b2c045efd7",
        "photo-1631049307264-da0ec9d70304",
        "photo-1598928636135-d146006ff4be",
    ],
    [
        "photo-1560185127-6ed189bf02f4",
        "photo-1591088398332-8a7791972843",
        "photo-1560185007-c5ca9d2c014d",
    ],
];
const ROOM_TYPES = [
    {
        name: "Classic room",
        category: "Essential",
        description: "A comfortable room with practical everyday comforts.",
        beds: [{ type: "double bed", count: 1 }],
        size: "24 m²",
        capacity: 2,
        view: "Garden view",
        nightlyExtraMinor: 0,
    },
    {
        name: "Deluxe room",
        category: "Premium",
        description: "A spacious upgraded room with extra living space and in-room amenities.",
        beds: [{ type: "queen bed", count: 1 }],
        size: "36 m²",
        capacity: 2,
        view: "Pool view",
        nightlyExtraMinor: 180000,
    },
    {
        name: "Suite room",
        category: "Signature",
        description: "A suite with separate lounging space for longer and family stays.",
        beds: [
            { type: "king bed", count: 1 },
            { type: "sofa bed", count: 1 },
        ],
        size: "48 m²",
        capacity: 4,
        view: "City view",
        nightlyExtraMinor: 360000,
    },
    {
        name: "Triple room",
        category: "Family",
        description: "A flexible room for three guests travelling together.",
        beds: [
            { type: "double bed", count: 1 },
            { type: "single bed", count: 1 },
        ],
        size: "34 m²",
        capacity: 3,
        view: "Garden view",
        nightlyExtraMinor: 220000,
    },
    {
        name: "Bunk room",
        category: "Group",
        description: "A shared-layout room with individual sleeping spaces for a small group.",
        beds: [{ type: "bunk bed", count: 2 }],
        size: "30 m²",
        capacity: 4,
        bathroom: "Shared bathroom",
        facilities: ["Air conditioning", "Wi-Fi", "Individual lockers"],
        detailSections: [
            {
                id: "shared-layout",
                title: "Shared layout",
                items: [
                    { id: "sleeping", label: "Sleeping spaces", value: "4 individual bunk spaces" },
                    { id: "storage", label: "Storage", value: "Individual lockers" },
                ],
            },
        ],
        nightlyExtraMinor: 120000,
    },
    {
        name: "Large family room",
        category: "Family",
        description: "An open-plan room with space for a larger family or group.",
        beds: [
            { type: "double bed", count: 1 },
            { type: "single bed", count: 2 },
            { type: "sofa bed", count: 1 },
        ],
        size: "62 m²",
        capacity: 6,
        view: "Pool view",
        detailSections: [
            {
                id: "layout",
                title: "Room layout",
                items: [
                    { id: "living", label: "Living area", value: "Separate seating area" },
                    { id: "extra", label: "Extra sleeping space", value: "Sofa bed included" },
                ],
            },
        ],
        nightlyExtraMinor: 480000,
    },
];
const CLASSIC_RATE_PLANS = [
    { id: "room-only", name: "Room only", meal: "Room only", extraMinor: 0, meals: [] },
    { id: "breakfast", name: "Bed and breakfast", meal: "Breakfast included", extraMinor: 35000, meals: ["Daily breakfast"] },
    { id: "half-board", name: "Half board", meal: "Breakfast and lunch included", extraMinor: 80000, meals: ["Daily breakfast", "Daily lunch"] },
];

// Providers return hotel records and room rates in integer minor currency units.
// Room rates include supplier taxes; platform/payment fees belong to the service.
export class MockHotelProvider extends HotelProvider {
    constructor() {
        super({ name: "mock" });
        this.isDemo = true;
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
            propertyType: index % 2 ? "Resort" : "Hotel",
            totalRooms: 96 + index * 12,
            languages: ["English", "Hindi"],
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
                "Check-in from 2 PM; check-out by 11 AM, property local time.",
                "Government-issued photo identification is required for all guests.",
                "The minimum age for check-in is 18 years.",
                "Children are welcome; extra beds and cots are subject to availability.",
                "Pets are not allowed at this property.",
                "Special requests are subject to property availability.",
            ],
            detailSections: [
                {
                    id: "property-highlights",
                    title: "Property highlights",
                    description: "Useful details supplied by the property.",
                    items: [
                        { id: "location", icon: "mapPin", label: "Location", value: "City-centre access with nearby public transport" },
                        { id: "breakfast", icon: "food", label: "Breakfast", value: "Continental and buffet options" },
                        { id: "parking", icon: "car", label: "Parking", value: "On-site parking subject to availability" },
                    ],
                },
                {
                    id: "guest-information",
                    title: "Guest information",
                    items: [
                        { id: "children", icon: "usersRound", label: "Children", value: "Children are welcome; age-based pricing may apply" },
                        { id: "pets", icon: "info", label: "Pets", value: "Contact the property before travelling with a pet" },
                        { id: "requests", icon: "sparkles", label: "Special requests", value: "Subject to availability and may cost extra" },
                    ],
                },
            ],
            rooms: ROOM_TYPES.flatMap((type, roomIndex) => {
                const roomTypeId = `${index + 1}-${roomIndex + 1}`;
                const rates = index === 0 && roomIndex === 0
                    ? CLASSIC_RATE_PLANS
                    : [{
                        id: "standard",
                        name: "Best available rate",
                        meal: roomIndex < 2 ? "Breakfast included" : "Room only",
                        extraMinor: 0,
                        meals: roomIndex < 2 ? ["Daily breakfast"] : [],
                    }];
                return rates.map((rate) => ({
                    roomId: rates.length > 1 ? `${roomTypeId}:${rate.id}` : roomTypeId,
                    roomTypeId,
                    ratePlanId: rate.id,
                    ...type,
                    bathroom: type.bathroom || "1 private bathroom",
                    smokingPolicy: "Non-smoking room",
                    childPolicy: "Children are welcome using existing bedding",
                    extraBedPolicy:
                        roomIndex === 4
                            ? "Extra beds are not available"
                            : "Extra bed available on request",
                    accessibility: "Accessible room available on request",
                    image: image(ROOM_IMAGES[roomIndex][0], 900),
                    images: ROOM_IMAGES[roomIndex].map((id) => image(id, 1000)),
                    facilities: type.facilities || [
                        "Private bathroom",
                        "Air conditioning",
                        "Wi-Fi",
                        "Tea and coffee",
                    ],
                    inclusions: [
                        ...rate.meals,
                        "Daily housekeeping",
                        "Complimentary Wi-Fi",
                        "Access to hotel leisure facilities",
                    ],
                    available: 6 - (index % 3),
                    nightlyAmountMinor: 250000 + index * 60000 + type.nightlyExtraMinor + rate.extraMinor,
                    currency: "INR",
                    meal: rate.meal,
                    ratePlan: rate.name,
                    paymentPolicy: index % 3 !== 2 ? "Pay at property" : "Prepayment required",
                    taxesIncluded: true,
                    refundable: roomIndex < 2,
                    freeCancellationUntil: roomIndex < 2 ? dateBefore(input.checkIn, 2) : null,
                    cancellation:
                        roomIndex < 2
                            ? "Free cancellation until 48 hours before check-in; then one night charged."
                            : "Non-refundable once booked.",
                }));
            }),
        }));
    }

    async getHotelDetails({ hotelId, input }) {
        return (await this.searchHotels(input)).find((hotel) => hotel.hotelId === hotelId) || null;
    }
}

export default MockHotelProvider;
