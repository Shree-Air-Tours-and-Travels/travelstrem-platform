import crypto from "crypto";
import TravelProviderError from "../../../../providers/travel/contracts/TravelProviderError.js";

const PROVIDER = "hotelbeds";
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === "string" ? value.trim() : "");
const resultLimit = () => Math.max(1, Number(process.env.HOTEL_HOTELBEDS_RESULT_LIMIT) || 40);
const rateLimit = () => Math.max(1, Number(process.env.HOTEL_HOTELBEDS_MAX_RATES_PER_ROOM) || 3);

const majorToMinor = (amount) => {
    if (amount === null || amount === undefined) return null;
    const normalized = String(amount).trim();
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
    const negative = normalized.startsWith("-");
    const [whole, fraction = ""] = normalized.replace("-", "").split(".");
    const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    const signed = negative ? -minor : minor;
    return signed >= 0n && signed <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(signed) : null;
};

const stableId = (value) =>
    crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 20);

const destinationCode = (input = {}) => {
    const code = text(input.destinationCode || input.destination).toUpperCase();
    if (!/^[A-Z0-9]{3}$/.test(code)) {
        throw new TravelProviderError(
            PROVIDER,
            "searchHotels",
            "Hotelbeds requires a three-character destination code from the location catalogue.",
        );
    }
    return code;
};

const allocationsFor = (input = {}) => {
    const rooms = Math.max(1, Number(input.rooms) || 1);
    const adults = Math.max(1, Number(input.adults ?? input.guests) || 1);
    const children = Math.max(0, Number(input.children) || 0);
    const childAges = list(input.childAges).map(Number);
    const allocations = Array.from({ length: rooms }, (_, index) => ({
        adults: Math.floor(adults / rooms) + (index < adults % rooms ? 1 : 0),
        childAges: [],
    }));
    childAges.slice(0, children).forEach((age, index) => {
        allocations[index % rooms].childAges.push(age);
    });
    const grouped = new Map();
    allocations.forEach((allocation) => {
        const key = `${allocation.adults}:${allocation.childAges.join(",")}`;
        const current = grouped.get(key) || {
            rooms: 0,
            adults: allocation.adults,
            children: allocation.childAges.length,
            paxes: allocation.childAges.map((age) => ({ type: "CH", age })),
        };
        current.rooms += 1;
        grouped.set(key, current);
    });
    return [...grouped.values()];
};

const availabilityRequest = (input, hotelCode) => ({
    stay: { checkIn: input.checkIn, checkOut: input.checkOut },
    occupancies: allocationsFor(input),
    filter: {
        maxHotels: hotelCode ? 1 : resultLimit(),
        maxRatesPerRoom: rateLimit(),
    },
    ...(hotelCode
        ? {
              hotels: {
                  hotel: [Number.isFinite(Number(hotelCode)) ? Number(hotelCode) : hotelCode],
              },
          }
        : { destination: { code: destinationCode(input) } }),
});

const hotelList = (response) => list(response?.hotels?.hotels || response?.hotels);
const contentHotel = (response) =>
    response?.hotel || list(response?.hotels).at(0) || response || {};
const contentHotelsByCode = (response) =>
    new Map(
        list(response?.hotels)
            .filter((hotel) => hotel?.code != null)
            .map((hotel) => [String(hotel.code), hotel]),
    );

const imageUrl = (image) => {
    const url = text(image?.url);
    if (/^https?:\/\//i.test(url)) return url;
    const path = text(image?.path);
    return path ? `https://photos.hotelbeds.com/giata/original/${path.replace(/^\/+/, "")}` : "";
};
const imagesFor = (content) =>
    list(content.images)
        .slice()
        .sort(
            (left, right) =>
                Number(left.visualOrder ?? Number.MAX_SAFE_INTEGER) -
                    Number(right.visualOrder ?? Number.MAX_SAFE_INTEGER) ||
                Number(left.order ?? Number.MAX_SAFE_INTEGER) -
                    Number(right.order ?? Number.MAX_SAFE_INTEGER),
        )
        .map(imageUrl)
        .filter(Boolean);

const descriptionFor = (value) => text(value?.content || value?.description || value);
const starsFor = (hotel, content) => {
    const source = `${hotel.categoryName || ""} ${hotel.categoryCode || ""} ${content.category?.description?.content || ""}`;
    const match = source.match(/([1-5])/);
    return match ? Number(match[1]) : null;
};
const cancellationDate = (value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date)
        : String(value);
};

const cancellationFor = (rate) => {
    const policies = list(rate.cancellationPolicies);
    const first = policies
        .filter((policy) => policy?.from)
        .sort((left, right) => String(left.from).localeCompare(String(right.from)))[0];
    const nonRefundable = String(rate.rateClass || "").toUpperCase() === "NRF";
    return {
        refundable: !nonRefundable,
        freeCancellationUntil: nonRefundable ? null : first?.from || null,
        cancellation:
            text(rate.rateComments) ||
            (nonRefundable
                ? "Non-refundable once booked."
                : first?.from
                  ? `Cancellation charges apply from ${cancellationDate(first.from)}. Check the rate conditions for the amount.`
                  : "Check the rate conditions before booking."),
    };
};

const roomContentMap = (content) =>
    new Map(list(content.rooms).map((room) => [String(room.roomCode || room.code), room]));

const stableRateIdentity = (room, rate, cancellation) =>
    JSON.stringify({
        roomCode: String(room.code || ""),
        boardCode: text(rate.boardCode),
        rateClass: text(rate.rateClass),
        paymentType: text(rate.paymentType),
        adults: Number(rate.adults) || 0,
        children: Number(rate.children) || 0,
        rooms: Number(rate.rooms) || 1,
        refundable: cancellation.refundable,
        freeCancellationUntil: cancellation.freeCancellationUntil,
    });

const normalizedRooms = (hotel, content, stay) => {
    const byCode = roomContentMap(content);
    const nights = Math.max(
        1,
        Math.round(
            (Date.parse(`${stay.checkOut}T00:00:00Z`) - Date.parse(`${stay.checkIn}T00:00:00Z`)) /
                86400000,
        ),
    );
    const offers = list(hotel.rooms).flatMap((room) =>
        list(room.rates).flatMap((rate) => {
            const rateKey = text(rate.rateKey);
            const totalMinor = majorToMinor(rate.net ?? rate.sellingRate);
            const pricedRooms = Math.max(1, Number(rate.rooms) || 1);
            if (!rateKey || totalMinor === null) return [];
            const roomStayMinor = Math.round(totalMinor / pricedRooms);
            const roomContent = byCode.get(String(room.code)) || {};
            const images = list(content.images)
                .filter((image) => !image.roomCode || String(image.roomCode) === String(room.code))
                .map(imageUrl)
                .filter(Boolean);
            const facilities = list(roomContent.roomFacilities || roomContent.facilities)
                .map((facility) => descriptionFor(facility.description))
                .filter(Boolean);
            const taxesIncluded = rate.taxes?.allIncluded !== false;
            const cancellation = cancellationFor(rate);
            const rateIdentity = stableId(stableRateIdentity(room, rate, cancellation));
            return [
                {
                    roomId: `${hotel.code}:${room.code}:${rateIdentity}`,
                    roomTypeId: String(room.code),
                    ratePlanId: `${rate.boardCode || "ROOM"}:${rateIdentity}`,
                    name: text(room.name) || descriptionFor(roomContent.description) || "Room",
                    category: text(rate.boardName) || text(room.name) || "Room option",
                    description: descriptionFor(roomContent.description),
                    bed: descriptionFor(roomContent.type?.description),
                    size: "",
                    view: "",
                    image: images[0] || "",
                    images,
                    facilities,
                    inclusions: [
                        text(rate.boardName),
                        ...list(rate.promotions).map((promotion) => text(promotion.name)),
                    ].filter(Boolean),
                    detailSections: text(rate.rateComments)
                        ? [
                              {
                                  id: "rate-comments",
                                  title: "Important rate information",
                                  items: [
                                      {
                                          id: "rate-comment",
                                          label: "Before you book",
                                          value: text(rate.rateComments),
                                      },
                                  ],
                              },
                          ]
                        : [],
                    occupancy: {
                        maxGuests: Math.max(
                            1,
                            Number(rate.adults || 0) + Number(rate.children || 0),
                        ),
                        maxAdults: Math.max(1, Number(rate.adults) || 1),
                        maxChildren: Math.max(0, Number(rate.children) || 0),
                    },
                    // A returned multi-room rate is already priced for that many rooms.
                    // Do not reject it when the supplier reports one rate allotment.
                    available:
                        rate.allotment == null
                            ? null
                            : Math.max(pricedRooms, Math.max(0, Number(rate.allotment) || 0)),
                    availabilityStatus: "AVAILABLE",
                    sellUnit: "room",
                    nightlyAmountMinor: Math.round(roomStayMinor / nights),
                    stayAmountMinor: roomStayMinor,
                    currency: hotel.currency,
                    meal: text(rate.boardName),
                    ratePlan: text(rate.boardName) || text(rate.rateClass),
                    paymentPolicy:
                        rate.paymentType === "AT_WEB" ? "Prepayment required" : "Pay at property",
                    taxesIncluded,
                    ...cancellation,
                    providerReference: {
                        hotelCode: String(hotel.code),
                        roomCode: String(room.code),
                        rateKey,
                        rateType: text(rate.rateType),
                        requiresRecheck: String(rate.rateType).toUpperCase() === "RECHECK",
                    },
                },
            ];
        }),
    );
    return [
        ...offers
            .reduce((unique, offer) => {
                const current = unique.get(offer.roomId);
                if (!current || offer.stayAmountMinor < current.stayAmountMinor)
                    unique.set(offer.roomId, offer);
                return unique;
            }, new Map())
            .values(),
    ];
};

const propertySections = (content) => {
    const sections = [];
    const facilities = list(content.facilities)
        .map((facility, index) => ({
            id: `facility-${facility.facilityGroupCode || "general"}-${facility.facilityCode || index}`,
            label: descriptionFor(facility.description),
            value: facility.indFee
                ? "Additional charge may apply"
                : facility.number != null
                  ? String(facility.number)
                  : "Available",
        }))
        .filter((item) => item.label);
    if (facilities.length)
        sections.push({ id: "facilities", title: "Property facilities", items: facilities });
    const issues = list(content.issues)
        .map((issue, index) => ({ id: `issue-${index}`, value: descriptionFor(issue.description) }))
        .filter((item) => item.value);
    if (issues.length)
        sections.push({
            id: "important-information",
            title: "Important information",
            items: issues,
        });
    return sections;
};

export default class HotelBedsAdapter {
    hotelCodes(response) {
        return hotelList(response)
            .filter((hotel) => hotel?.code != null)
            .map((hotel) => String(hotel.code));
    }

    adaptSearchRequest(input) {
        return availabilityRequest(input);
    }

    adaptDetailsRequest({ hotelId, providerReference, input }) {
        return {
            availability: availabilityRequest(input, providerReference?.hotelCode || hotelId),
            hotelCode: String(providerReference?.hotelCode || hotelId),
            language: "ENG",
        };
    }

    adaptSearch(response, input, contentResponse) {
        const stay = response?.hotels || { checkIn: input.checkIn, checkOut: input.checkOut };
        const content = contentHotelsByCode(contentResponse);
        return hotelList(response)
            .slice(0, resultLimit())
            .map((hotel) => {
                const adapted = this.adaptHotel({
                    availability: { hotels: { ...stay, hotels: [hotel] } },
                    content: content.get(String(hotel.code)),
                });
                return { ...adapted, images: adapted.images.slice(0, 1) };
            });
    }

    adaptHotel({ availability, content: contentResponse } = {}) {
        const hotel = hotelList(availability).at(0);
        if (!hotel?.code)
            throw new TravelProviderError(
                PROVIDER,
                "adaptHotel",
                "Hotelbeds returned an invalid hotel.",
            );
        const content = contentHotel(contentResponse);
        const stay = availability.hotels || {};
        const images = imagesFor(content);
        const rooms = normalizedRooms(hotel, content, stay);
        return {
            hotelId: String(hotel.code),
            name: text(content.name?.content || content.name) || text(hotel.name),
            address:
                descriptionFor(content.address) ||
                [hotel.destinationName, hotel.zoneName].filter(Boolean).join(", "),
            identity: {
                mappingIds: [content.giataCode, content.giataId]
                    .filter((value) => value != null)
                    .map(String),
                city: text(content.city?.content || content.city || hotel.destinationName),
                country: text(content.country?.code || content.countryCode || hotel.countryCode),
                postalCode: text(content.postalCode),
                phone: text(
                    list(content.phones).at(0)?.phoneNumber || list(content.phones).at(0)?.number,
                ),
                latitude: content.coordinates?.latitude ?? content.latitude,
                longitude: content.coordinates?.longitude ?? content.longitude,
            },
            stars: starsFor(hotel, content),
            rating: null,
            reviewCount: 0,
            distanceFromCentreMeters: null,
            propertyType:
                descriptionFor(content.accommodationType?.description) || text(hotel.categoryName),
            totalRooms: content.totalRooms == null ? null : Number(content.totalRooms),
            languages: list(content.languages)
                .map((language) => text(language.code || language))
                .filter(Boolean),
            checkInTime: "",
            checkOutTime: "",
            payAtProperty: rooms.some((room) => room.paymentPolicy === "Pay at property"),
            images,
            reviews: [],
            description: descriptionFor(content.description),
            amenities: list(content.facilities)
                .map((facility) => descriptionFor(facility.description))
                .filter(Boolean),
            policies: list(content.issues)
                .map((issue) => descriptionFor(issue.description))
                .filter(Boolean),
            detailSections: propertySections(content),
            rooms,
            providerReference: {
                hotelCode: String(hotel.code),
                expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
            },
        };
    }

    adaptCheckRatesRequest(rateKeys) {
        const keys = list(rateKeys).map(text).filter(Boolean);
        if (!keys.length)
            throw new TravelProviderError(
                PROVIDER,
                "checkRates",
                "At least one Hotelbeds rate key is required.",
            );
        return { rooms: keys.map((rateKey) => ({ rateKey })) };
    }

    adaptCheckRates(response) {
        const rates = hotelList(response).flatMap((hotel) =>
            list(hotel.rooms).flatMap((room) =>
                list(room.rates).flatMap((rate) => {
                    const totalMinor = majorToMinor(rate.net ?? rate.sellingRate);
                    if (!rate.rateKey || totalMinor === null) return [];
                    return [
                        {
                            hotelCode: String(hotel.code),
                            roomCode: String(room.code),
                            rateKey: String(rate.rateKey),
                            rateType: text(rate.rateType),
                            requiresRecheck: String(rate.rateType).toUpperCase() === "RECHECK",
                            totalMinor,
                            currency: hotel.currency,
                            allotment: rate.allotment == null ? null : Number(rate.allotment),
                            rateComments: text(rate.rateComments),
                            cancellationPolicies: list(rate.cancellationPolicies).map((policy) => ({
                                from: policy.from || null,
                                amountMinor: majorToMinor(policy.amount),
                            })),
                        },
                    ];
                }),
            ),
        );
        return { status: rates.length ? "AVAILABLE" : "UNAVAILABLE", rates };
    }
}

export { allocationsFor, availabilityRequest, majorToMinor };
