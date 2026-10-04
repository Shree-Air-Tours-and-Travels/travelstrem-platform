import crypto from "node:crypto";
import TravelProviderError from "../../../../providers/travel/contracts/TravelProviderError.js";

const PROVIDER = "stayingapi";
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === "string" ? value.trim() : "");
const resultLimit = () => Math.max(1, Number(process.env.HOTEL_STAYINGAPI_RESULT_LIMIT) || 40);
const stableId = (value) =>
    crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 20);

const majorToMinor = (value) => {
    if (value === null || value === undefined) return null;
    const source = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(source)) return null;
    const [whole, fraction = ""] = source.split(".");
    const cents = BigInt((fraction.slice(0, 2) || "0").padEnd(2, "0"));
    const rounded = BigInt(whole) * 100n + cents + (Number(fraction[2] || 0) >= 5 ? 1n : 0n);
    return rounded <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(rounded) : null;
};

const readable = (value) => {
    const normalized = text(value).toLowerCase();
    if (normalized === "wifi") return "Wi-Fi";
    return normalized
        .split("_")
        .filter(Boolean)
        .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
        .join(" ");
};

const addressFor = (property) =>
    [
        property.location?.address,
        property.location?.city,
        property.location?.region,
        property.location?.country,
    ]
        .map(text)
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(", ");

const matchesDestination = (property, input) => {
    const expected = text(input.destinationName || input.destination).toLowerCase();
    const locations = [
        property.location?.city,
        property.location?.region,
        property.location?.address,
    ]
        .map(text)
        .filter(Boolean)
        .map((value) => value.toLowerCase());
    return (
        !expected ||
        !locations.length ||
        locations.some(
            (value) => value === expected || value.includes(expected) || expected.includes(value),
        )
    );
};

const ratingFor = (property) => {
    const value = Number(property.guestRating);
    const scale = Number(property.ratingScale);
    if (!Number.isFinite(value) || value < 0) return null;
    return Number.isFinite(scale) && scale > 0
        ? Number(Math.min(10, value * (10 / scale)).toFixed(1))
        : value;
};

const detailSections = (property) => {
    const items = [
        property.bedrooms != null
            ? { id: "bedrooms", label: "Bedrooms", value: String(property.bedrooms) }
            : null,
        property.bathrooms != null
            ? { id: "bathrooms", label: "Bathrooms", value: String(property.bathrooms) }
            : null,
        property.maxOccupancy != null
            ? {
                  id: "occupancy",
                  label: "Maximum occupancy",
                  value: `${property.maxOccupancy} guests`,
              }
            : null,
        property.host?.name ? { id: "host", label: "Host", value: property.host.name } : null,
    ].filter(Boolean);
    return items.length
        ? [{ id: "property-information", title: "Property information", items }]
        : [];
};

const roomFor = (property, input) => {
    const price = property.price;
    if (!price) return [];
    const nights = Math.max(1, Number(price.nights || input.nights) || 1);
    const nightlyAmountMinor = majorToMinor(price.nightlyPrice);
    const totalAmountMinor = majorToMinor(price.totalPrice);
    if (nightlyAmountMinor === null && totalAmountMinor === null) return [];
    const pricedRooms = Math.max(1, Number(input.rooms) || 1);
    const divide = (amount, units) => Math.floor((amount + Math.floor(units / 2)) / units);
    const stayAmountMinor = divide(totalAmountMinor ?? nightlyAmountMinor * nights, pricedRooms);
    const nightly =
        nightlyAmountMinor == null
            ? divide(stayAmountMinor, nights)
            : divide(nightlyAmountMinor, pricedRooms);
    const platform = text(property.platform);
    const listingId = text(property.platformListingId);
    const rateKey = `${platform}:${listingId}:${price.source || "rate"}`;
    return [
        {
            roomId: `${property.id}:${stableId(rateKey)}`,
            roomTypeId: `${property.id}:accommodation`,
            ratePlanId: stableId(rateKey),
            name: readable(property.propertyType) || "Accommodation",
            category: "Available stay",
            description: "",
            bed:
                property.bedrooms != null
                    ? `${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}`
                    : "",
            bathroom:
                property.bathrooms != null
                    ? `${property.bathrooms} bathroom${property.bathrooms === 1 ? "" : "s"}`
                    : "",
            images: list(property.images).filter((image) => /^https?:\/\//i.test(image)),
            facilities: list(property.amenities).map(readable).filter(Boolean),
            inclusions: [],
            detailSections: [],
            occupancy: {
                maxGuests: Math.max(1, Number(property.maxOccupancy) || input.guests),
                maxAdults: Math.max(1, Number(property.maxOccupancy) || input.adults),
                maxChildren: Math.max(0, Number(input.children) || 0),
            },
            available: null,
            availabilityStatus: "AVAILABLE",
            sellUnit: "room",
            nightlyAmountMinor: nightly,
            stayAmountMinor,
            currency: text(price.currency || input.currency).toUpperCase(),
            meal: list(property.amenities).includes("breakfast") ? "Breakfast available" : "",
            ratePlan: "Provider rate",
            paymentPolicy: "Payment terms shown by provider",
            taxesIncluded: price.fees?.taxes != null,
            refundable: false,
            freeCancellationUntil: null,
            cancellation: "Review the provider's cancellation terms before booking.",
            providerReference: { platform, listingId, externalUrl: price.url || property.url },
        },
    ];
};

export default class StayingApiAdapter {
    adaptSearchRequest(input) {
        return {
            location: input.destinationName || input.destination,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            adults: input.adults,
            children: input.children,
            childAges: input.childAges,
            rooms: input.rooms,
            currency: input.currency,
            limit: resultLimit(),
            ...(process.env.HOTEL_STAYINGAPI_PLATFORMS
                ? { platforms: process.env.HOTEL_STAYINGAPI_PLATFORMS }
                : {}),
        };
    }

    adaptDetailsRequest({ providerReference, input }) {
        const platform = text(providerReference?.platform);
        const listingId = text(providerReference?.listingId);
        if (!platform || !listingId)
            throw new TravelProviderError(
                PROVIDER,
                "getHotelDetails",
                "StayingAPI listing identity is missing.",
            );
        return {
            platform,
            listingId,
            params: {
                checkIn: input.checkIn,
                checkOut: input.checkOut,
                currency: input.currency,
                ...(providerReference.country ? { country: providerReference.country } : {}),
            },
        };
    }

    adaptSearch(response, input) {
        return list(response?.data)
            .filter((property) => matchesDestination(property, input))
            .slice(0, resultLimit())
            .map((property) => this.adaptHotel(property, input, { coverOnly: true }));
    }

    adaptDetails(response, input, fallbackProperty) {
        return this.adaptHotel(response?.data || fallbackProperty, input, { fallbackProperty });
    }

    adaptHotel(source, input, { coverOnly = false, fallbackProperty } = {}) {
        const property = { ...(fallbackProperty || {}), ...(source || {}) };
        if (!property.id || !property.name || !property.platform || !property.platformListingId)
            throw new TravelProviderError(
                PROVIDER,
                "adaptHotel",
                "StayingAPI returned an invalid property.",
            );
        const allImages = list(property.images).filter((image) => /^https?:\/\//i.test(image));
        const rooms = roomFor(property, input).map((room) => ({
            ...room,
            images: coverOnly ? allImages.slice(0, 1) : allImages,
            image: allImages[0] || "",
        }));
        return {
            hotelId: String(property.id),
            name: String(property.name),
            address: addressFor(property),
            identity: {
                mappingIds: [property.giataId, property.giataCode, property.mappingId]
                    .filter((value) => value != null)
                    .map(String),
                city: text(property.location?.city),
                country: text(property.location?.country),
                postalCode: text(property.location?.postalCode || property.location?.postal_code),
                phone: text(property.phone || property.contact?.phone),
                latitude: property.location?.latitude ?? property.latitude,
                longitude: property.location?.longitude ?? property.longitude,
            },
            stars: property.starRating == null ? null : Number(property.starRating),
            rating: ratingFor(property),
            reviewCount: Number(property.reviewCount) || 0,
            distanceFromCentreMeters: null,
            propertyType: readable(property.propertyType),
            totalRooms: null,
            languages: [],
            checkInTime: "",
            checkOutTime: "",
            payAtProperty: false,
            images: coverOnly ? allImages.slice(0, 1) : allImages,
            reviews: [],
            description: "",
            amenities: list(property.amenities).map(readable).filter(Boolean),
            policies: [],
            detailSections: detailSections(property),
            rooms,
            providerReference: {
                platform: String(property.platform),
                listingId: String(property.platformListingId),
                country: text(property.location?.country).toLowerCase(),
                externalUrl: property.url || null,
                searchProperty: property,
                expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
            },
        };
    }
}

export { majorToMinor };
