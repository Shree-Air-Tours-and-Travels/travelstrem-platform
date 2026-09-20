import crypto from "node:crypto";
import TravelProviderError from "../../../../providers/travel/contracts/TravelProviderError.js";

const PROVIDER = "trekko";
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === "string" ? value.trim() : "");
const stableId = (value) =>
    crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 20);

const majorToMinor = (value) => {
    if (value === null || value === undefined) return null;
    const source = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(source)) return null;
    const [whole, fraction = ""] = source.split(".");
    const minor =
        BigInt(whole) * 100n +
        BigInt((fraction.slice(0, 2) || "0").padEnd(2, "0")) +
        (Number(fraction[2] || 0) >= 5 ? 1n : 0n);
    return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
};

const guestDistribution = (input) => {
    const roomCount = Math.max(1, Number(input.rooms) || 1);
    const adultCount = Math.max(1, Number(input.adults) || 1);
    if (adultCount < roomCount) {
        throw new TravelProviderError(
            PROVIDER,
            "searchHotels",
            "Trekko requires at least one adult in every room.",
        );
    }
    const guests = [];
    for (let index = 0; index < adultCount; index += 1)
        guests.push({ id: guests.length + 1, age: 30 });
    list(input.childAges).forEach((age) =>
        guests.push({ id: guests.length + 1, age: Number(age) }),
    );

    const rooms = Array.from({ length: roomCount }, () => ({ guest_ids: [] }));
    for (let index = 0; index < roomCount; index += 1)
        rooms[index].guest_ids.push(guests[index].id);
    guests
        .slice(roomCount)
        .forEach((guest, index) => rooms[index % roomCount].guest_ids.push(guest.id));
    return { guests, guests_room_distribution: rooms };
};

const availabilityRequest = (input, accommodationId) => ({
    accommodation_id: Number.isFinite(Number(accommodationId))
        ? Number(accommodationId)
        : accommodationId,
    start_date: input.checkIn,
    end_date: input.checkOut,
    ...guestDistribution(input),
    ...(text(input.nationality) ? { nationality: text(input.nationality).toUpperCase() } : {}),
    currency_code: text(input.currency).toUpperCase(),
});

const cancellationFor = (option) => {
    const policy = text(option.cancellation_policy);
    const nonRefundable = /non[- ]?refundable/i.test(policy);
    const policyDate = policy.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    const ruleDate = list(option.cancellation_policy_rules)
        .map((rule) => text(rule.DateFrom || rule.dateFrom))
        .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
        .sort()[0];
    return {
        refundable: !nonRefundable,
        freeCancellationUntil: nonRefundable ? null : policyDate || ruleDate || null,
        cancellation:
            policy ||
            (nonRefundable
                ? "Non-refundable once booked."
                : "Review the cancellation terms before booking."),
    };
};

const roomNameFor = (option) => {
    const room = list(option.rooms_data)[0] || {};
    return (
        text(room.room_name || room.name || room.room_type || room.description) || "Available room"
    );
};

const roomsFor = (hotel, input) =>
    list(hotel.options).flatMap((option) => {
        const priceMinor = majorToMinor(
            option.maximum_price ?? option.minimum_price ?? option.nett_price,
        );
        const currency = text(option.currency_code).toUpperCase();
        const vendor = text(option.vendor);
        const ratePlanCode = text(option.rate_plan_code);
        if (priceMinor === null || !currency || !vendor || !ratePlanCode) return [];

        const pricedRooms = Math.max(1, Number(input.rooms) || 1);
        const nights = Math.max(1, Number(input.nights) || 1);
        const perRoomStay = Math.round(priceMinor / pricedRooms);
        const roomCodes = list(option.room_codes).length
            ? list(option.room_codes).map(String)
            : list(option.rooms_data)
                  .map((room) => String(room.room_code || room.code || ""))
                  .filter(Boolean);
        const roomTypeKey = roomCodes.length ? [...new Set(roomCodes)].sort().join("|") : "room";
        const offerKey = `${vendor}:${ratePlanCode}`;
        const meal = text(option.board_plan_text);
        return [
            {
                roomId: `${hotel.accommodation_id}:${stableId(`${roomTypeKey}:${offerKey}`)}`,
                roomTypeId: `${hotel.accommodation_id}:${stableId(roomTypeKey)}`,
                ratePlanId: stableId(offerKey),
                name: roomNameFor(option),
                category: meal || "Available rate",
                description: "",
                bed: "",
                bathroom: "",
                image: "",
                images: [],
                facilities: [],
                inclusions: meal ? [meal] : [],
                detailSections: [],
                occupancy: {
                    maxGuests: Math.max(1, Math.ceil(Number(input.guests) / pricedRooms)),
                    maxAdults: Math.max(1, Math.ceil(Number(input.adults) / pricedRooms)),
                    maxChildren: Math.max(0, Math.ceil(Number(input.children || 0) / pricedRooms)),
                },
                available: null,
                availabilityStatus: "AVAILABLE",
                sellUnit: "room",
                nightlyAmountMinor: Math.round(perRoomStay / nights),
                stayAmountMinor: perRoomStay,
                currency,
                meal,
                ratePlan: meal || ratePlanCode,
                paymentPolicy: "Prepayment required",
                taxesIncluded: null,
                ...cancellationFor(option),
                providerReference: {
                    accommodationId: String(hotel.accommodation_id),
                    vendor,
                    ratePlanCode,
                    bookingCode: text(option.booking_code),
                    roomCodes,
                    roomsData: list(option.rooms_data),
                    minimumPrice: option.minimum_price,
                    maximumPrice: option.maximum_price,
                    nettPrice: option.nett_price,
                    cancellationPolicy: text(option.cancellation_policy),
                    cancellationPolicyRules: list(option.cancellation_policy_rules),
                    boardPlanText: meal,
                },
            },
        ];
    });

export default class TrekkoAdapter {
    adaptDestinationRequest(input) {
        return { query: input.destinationName || input.destination };
    }

    adaptDestinations(response) {
        const seen = new Set();
        return list(response?.data)
            .filter((item) => {
                const id = text(String(item?.search_by_id ?? ""));
                if (Number(item?.search_by_type) !== 0 || !id || seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .slice(0, Math.max(1, Number(process.env.HOTEL_TREKKO_RESULT_LIMIT) || 8));
    }

    adaptAvailabilityRequest(input, accommodationId) {
        return availabilityRequest(input, accommodationId);
    }

    adaptDetailsRequest({ hotelId, providerReference, input }) {
        const accommodationId = providerReference?.accommodationId || hotelId;
        if (!accommodationId)
            throw new TravelProviderError(
                PROVIDER,
                "getHotelDetails",
                "Trekko accommodation identity is missing.",
            );
        return availabilityRequest(input, accommodationId);
    }

    adaptHotel(response, input, destination = {}) {
        if (!response?.accommodation_id || !response?.name)
            throw new TravelProviderError(
                PROVIDER,
                "adaptHotel",
                "Trekko returned an invalid accommodation.",
            );
        const rooms = roomsFor(response, input);
        return {
            hotelId: String(response.accommodation_id),
            name: String(response.name),
            address: text(destination.sub_name),
            identity: {
                mappingIds: [response.giata_id, response.giata_code, destination.giata_id]
                    .filter((value) => value != null)
                    .map(String),
                city: text(response.city || destination.name),
                country: text(response.country_code || destination.country_code),
                postalCode: text(response.postal_code),
                phone: text(response.phone),
                latitude: response.latitude ?? destination.latitude,
                longitude: response.longitude ?? destination.longitude,
            },
            stars: null,
            rating: null,
            reviewCount: 0,
            distanceFromCentreMeters: null,
            propertyType: "Hotel",
            totalRooms: null,
            languages: [],
            checkInTime: "",
            checkOutTime: "",
            payAtProperty: false,
            images: [],
            reviews: [],
            description: "",
            amenities: [],
            policies: [],
            detailSections: [],
            rooms,
            providerReference: {
                accommodationId: String(response.accommodation_id),
                destination,
                expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
            },
        };
    }
}

export { guestDistribution, majorToMinor };
