import crypto from "node:crypto";
import ApiError from "../../../shared/errors/ApiError.js";

// Validate the provider-neutral hotel draft before it enters the TreHub domain.

const strings = (values) =>
    (Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value);

const clean = (value) => String(value || "").trim();
const comparable = (value) =>
    clean(value)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
const tokens = (value) =>
    new Set(
        comparable(value)
            .split(" ")
            .filter((word) => word.length > 1),
    );
const similarity = (left, right) => {
    const a = tokens(left);
    const b = tokens(right);
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter((value) => b.has(value)).length;
    return (2 * intersection) / (a.size + b.size);
};
const finiteCoordinate = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const distanceMeters = (left, right) => {
    if (
        [left.latitude, left.longitude, right.latitude, right.longitude].some(
            (value) => value === null,
        )
    )
        return Infinity;
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const lat = radians(right.latitude - left.latitude);
    const lon = radians(right.longitude - left.longitude);
    const a =
        Math.sin(lat / 2) ** 2 +
        Math.cos(radians(left.latitude)) *
            Math.cos(radians(right.latitude)) *
            Math.sin(lon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const identityFor = (hotel) => ({
    mappingIds: strings(hotel.identity?.mappingIds).map(comparable).filter(Boolean),
    name: clean(hotel.identity?.name || hotel.name),
    address: clean(hotel.identity?.address || hotel.address),
    city: clean(hotel.identity?.city),
    country: clean(hotel.identity?.country),
    postalCode: clean(hotel.identity?.postalCode),
    phone: clean(hotel.identity?.phone).replace(/\D/g, ""),
    latitude: finiteCoordinate(hotel.identity?.latitude),
    longitude: finiteCoordinate(hotel.identity?.longitude),
});

export const hotelsMatch = (leftHotel, rightHotel) => {
    const left = identityFor(leftHotel);
    const right = identityFor(rightHotel);
    if (left.mappingIds.some((id) => right.mappingIds.includes(id))) return true;
    const nameScore = similarity(left.name, right.name);
    const addressScore = similarity(left.address, right.address);
    const sameCity = left.city && right.city && comparable(left.city) === comparable(right.city);
    const sameCountry =
        left.country && right.country && comparable(left.country) === comparable(right.country);
    const samePostal =
        left.postalCode &&
        right.postalCode &&
        comparable(left.postalCode) === comparable(right.postalCode);
    const samePhone =
        left.phone.length >= 7 &&
        right.phone.length >= 7 &&
        left.phone.slice(-10) === right.phone.slice(-10);
    if (distanceMeters(left, right) <= 100 && nameScore >= 0.72) return true;
    if ((samePostal || samePhone) && sameCity && nameScore >= 0.78) return true;
    return Boolean(sameCity && sameCountry && nameScore >= 0.9 && addressScore >= 0.82);
};

const canonicalId = (hotel) =>
    `canonical:${crypto
        .createHash("sha256")
        .update(
            [
                comparable(hotel.name),
                comparable(hotel.address),
                hotel.identity?.postalCode || "",
            ].join("|"),
        )
        .digest("hex")
        .slice(0, 20)}`;

export const canonicalizeHotels = (hotels) => {
    const canonical = [];
    for (const hotel of hotels) {
        const match = canonical.find((candidate) => hotelsMatch(candidate, hotel));
        const supplier = hotel.providerReference;
        if (!match) {
            canonical.push({
                ...hotel,
                hotelId: canonicalId(hotel),
                providerReference: { suppliers: [supplier] },
                supplierHotelIds: [supplier].filter(Boolean).map((item) => ({
                    providerName: item.providerName,
                    hotelId: item.hotelId,
                })),
            });
            continue;
        }
        match.rooms.push(...hotel.rooms);
        match.images = [...new Set([...match.images, ...hotel.images])];
        match.amenities = [...new Set([...match.amenities, ...hotel.amenities])];
        match.policies = [...new Set([...match.policies, ...hotel.policies])];
        match.services = [...new Set([...match.services, ...hotel.services])];
        for (const section of hotel.policySections) {
            const existing = match.policySections.find((item) => item.id === section.id);
            if (existing) existing.items = [...new Set([...existing.items, ...section.items])];
            else match.policySections.push(section);
        }
        match.providerReference.suppliers.push(supplier);
        match.supplierHotelIds.push({
            providerName: supplier.providerName,
            hotelId: supplier.hotelId,
        });
        if (!match.description && hotel.description) match.description = hotel.description;
        if (Number(hotel.rating) > Number(match.rating || 0)) {
            match.rating = hotel.rating;
            match.reviewCount = hotel.reviewCount;
        }
    }
    return canonical;
};

const detailSections = (sections) =>
    (Array.isArray(sections) ? sections : []).flatMap((section, sectionIndex) => {
        if (!section || typeof section !== "object" || !section.title) return [];
        const items = (Array.isArray(section.items) ? section.items : []).flatMap(
            (item, itemIndex) => {
                if (typeof item === "string" && item)
                    return [{ id: `${sectionIndex}-${itemIndex}`, value: item }];
                if (!item || typeof item !== "object" || (!item.value && !item.label)) return [];
                return [
                    {
                        id: String(item.id || `${sectionIndex}-${itemIndex}`),
                        label: item.label ? String(item.label) : "",
                        value: item.value ? String(item.value) : "",
                        icon: item.icon ? String(item.icon) : "info",
                    },
                ];
            },
        );
        if (!items.length && !section.description) return [];
        return [
            {
                id: String(section.id || `section-${sectionIndex}`),
                title: String(section.title),
                description: section.description ? String(section.description) : "",
                items,
            },
        ];
    });

const normalizeRoom = (room) => {
    if (!room || typeof room !== "object" || !room.roomId || !room.name) return null;
    const capacity = Number(room.occupancy?.maxGuests ?? room.capacity);
    const available = room.inventory?.remaining ?? room.available;
    const stock = available == null ? null : Number(available);
    const validStock = stock === null || (Number.isSafeInteger(stock) && stock >= 0);
    const sellUnit = String(room.sellUnit || "room").toLowerCase();
    if (!Number.isSafeInteger(capacity) || capacity < 1 || !["room", "bed"].includes(sellUnit))
        return null;
    return {
        ...room,
        roomId: String(room.roomId),
        roomTypeId: String(room.roomTypeId || room.roomId),
        ratePlanId: String(room.ratePlanId || room.roomId),
        capacity,
        available: validStock ? stock : null,
        availabilityStatus: validStock
            ? String(room.availabilityStatus || "UNKNOWN").toUpperCase()
            : "UNKNOWN",
        sellUnit,
        currency: String(room.currency || "").toUpperCase(),
        images: strings(room.images),
        facilities: strings(room.facilities),
        inclusions: strings(room.inclusions),
        detailSections: Array.isArray(room.detailSections) ? room.detailSections : [],
    };
};

export const normalizeHotel = (hotel) => {
    if (!hotel || typeof hotel !== "object" || !hotel.hotelId || !hotel.name)
        throw new ApiError(502, "The hotel supplier returned an invalid property.");
    const seen = new Set();
    const rooms = (Array.isArray(hotel.rooms) ? hotel.rooms : [])
        .map(normalizeRoom)
        .filter(Boolean);
    for (const room of rooms) {
        if (seen.has(room.roomId))
            throw new ApiError(502, "The hotel supplier returned duplicate room offers.");
        seen.add(room.roomId);
    }
    return {
        ...hotel,
        hotelId: String(hotel.hotelId),
        name: String(hotel.name),
        images: strings(hotel.images),
        amenities: strings(hotel.amenities),
        policies: strings(hotel.policies),
        services: (Array.isArray(hotel.services) ? hotel.services : [])
            .map((service) => typeof service === "string" ? service : service?.name || service?.value || service?.description)
            .filter((service) => typeof service === "string" && service.trim()),
        policySections: (Array.isArray(hotel.policySections) ? hotel.policySections : []).flatMap(
            (section, index) => {
                if (!section?.title) return [];
            const items = (Array.isArray(section.items) ? section.items : [])
                .map((item) => typeof item === "string" ? item : item?.text || item?.value || item?.description)
                .filter((item) => typeof item === "string" && item.trim());
                return items.length
                    ? [
                          {
                              id: String(section.id || `policy-${index}`),
                              title: String(section.title),
                              items,
                          },
                      ]
                    : [];
            },
        ),
        detailSections: detailSections(hotel.detailSections),
        identity: identityFor(hotel),
        rooms,
    };
};
