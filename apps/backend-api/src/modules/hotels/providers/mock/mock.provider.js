import HotelProvider from "../../../../providers/travel/contracts/HotelProvider.js";

const image = (id, width = 1200) =>
    id.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
const dateBefore = (value, days) => {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
};
const HOTEL_IMAGES = [
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/7441fb9bb0995749024e92a2.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/18d95c23e1135411561eba2c.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/020952c6c084016ba026fa68.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/9f5b9b62d0b2d59d3db40d0f.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519371/travelstrem/site-assets/974d52c9e9bdd44711ef26cb.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519371/travelstrem/site-assets/fdf479ee32c281957125ca84.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/9f5b9b62d0b2d59d3db40d0f.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519371/travelstrem/site-assets/974d52c9e9bdd44711ef26cb.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/7441fb9bb0995749024e92a2.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/020952c6c084016ba026fa68.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519371/travelstrem/site-assets/5aba6017985c3bf2bfb57297.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/cea709d1cffba40d0dce5685.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/18d95c23e1135411561eba2c.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/9f5b9b62d0b2d59d3db40d0f.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/e0d9fad67e34c131502859e1.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/e0d9fad67e34c131502859e1.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519370/travelstrem/site-assets/7441fb9bb0995749024e92a2.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519371/travelstrem/site-assets/fdf479ee32c281957125ca84.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519371/travelstrem/site-assets/974d52c9e9bdd44711ef26cb.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/cea709d1cffba40d0dce5685.jpg",
    ],
];
const ROOM_IMAGES = [
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/cd0e6a7f0f06ff4ce50404e3.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/767f9dce0afeafcab7c2c8f9.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/6ce006ee97ddb0cdb2d6543d.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519373/travelstrem/site-assets/5970cc6f03cca257a9ae9193.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519373/travelstrem/site-assets/8e82e5a0ebfb21cbd98c7e5b.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519373/travelstrem/site-assets/b0873b69038894e3d59a0702.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519374/travelstrem/site-assets/37e935626887c54427349af1.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519374/travelstrem/site-assets/22f807c0571222d66d122f78.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519374/travelstrem/site-assets/aee451f39038eb51773a785c.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/767f9dce0afeafcab7c2c8f9.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/cd0e6a7f0f06ff4ce50404e3.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519373/travelstrem/site-assets/8e82e5a0ebfb21cbd98c7e5b.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519373/travelstrem/site-assets/b0873b69038894e3d59a0702.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519372/travelstrem/site-assets/6ce006ee97ddb0cdb2d6543d.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519373/travelstrem/site-assets/5970cc6f03cca257a9ae9193.jpg",
    ],
    [
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519374/travelstrem/site-assets/22f807c0571222d66d122f78.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519374/travelstrem/site-assets/aee451f39038eb51773a785c.jpg",
        "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519374/travelstrem/site-assets/37e935626887c54427349af1.jpg",
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
