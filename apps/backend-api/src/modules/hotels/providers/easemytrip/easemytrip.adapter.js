// Maps EaseMyTrip requests and responses at the supplier boundary.
// The HTTP client and its authentication remain provider-specific and server-side.
const majorToMinor = (amount) => {
    if (amount === null || amount === undefined) return null;
    const value = String(amount);
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
    const [whole, fraction = ""] = value.split(".");
    const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
};

const list = (value) => (Array.isArray(value) ? value : []);
const policyTitles = {
    guarantee: "Guarantee policy",
    guaranteePolicy: "Guarantee policy",
    children: "Children policy",
    childrenPolicy: "Children policy",
    cancellation: "Cancellation / amendment policy",
    cancellationPolicy: "Cancellation / amendment policy",
    cancellationAmendment: "Cancellation / amendment policy",
    lateCheckout: "Late check-out policy",
    lateCheckOut: "Late check-out policy",
    lateCheckoutPolicy: "Late check-out policy",
};
const policySections = (policies) =>
    Object.entries(policies || {}).flatMap(([key, value]) => {
        if (key === "importantInformation" || !policyTitles[key]) return [];
        const items = (Array.isArray(value) ? value : [value])
            .map((item) =>
                typeof item === "string" ? item : item?.description || item?.text || "",
            )
            .filter(Boolean);
        return items.length ? [{ id: key, title: policyTitles[key], items }] : [];
    });

const imageUrls = (items) =>
    list(items)
        .map((item) => item?.url)
        .filter((url) => typeof url === "string" && /^https?:\/\//.test(url));

const occupancyFor = (room, rate, search) => {
    const requested = Array.isArray(search?.rooms) ? search.rooms : [];
    const requestedAdults = Math.max(
        0,
        ...requested.map((allocation) => Number(allocation.adults) || 0),
    );
    const requestedChildren = Math.max(
        0,
        ...requested.map((allocation) => Number(allocation.children) || 0),
    );
    const specified = room.specifications?.maxOccupancy || {};
    const adults = specified.adults ?? rate.occupancy?.adults ?? requestedAdults;
    const children = specified.children ?? rate.occupancy?.children ?? requestedChildren;
    return {
        maxGuests: specified.total ?? (adults == null ? null : Number(adults) + Number(children)),
        maxAdults: adults == null ? null : Number(adults),
        maxChildren: children == null ? null : Number(children),
    };
};

const cancellationText = (cancellation) => {
    const description = list(cancellation?.rules).find((rule) => rule?.description)?.description;
    if (description) return description;
    if (cancellation?.type === "NON_REFUNDABLE") return "Non-refundable once booked.";
    if (cancellation?.freeCancellationUntil)
        return `Free cancellation until ${cancellation.freeCancellationUntil}.`;
    return "";
};

export class EaseMyTripHotelAdapter {
    adaptSearch(response) {
        const hotels = Array.isArray(response)
            ? response
            : Array.isArray(response?.hotels)
              ? response.hotels
              : [response];
        return hotels.map((hotel) => this.adaptHotel(hotel));
    }

    adaptHotel(response) {
        const property = response?.hotel;
        const availability = response?.availability;
        if (!property?.id || !availability || !Array.isArray(availability.rooms))
            throw new TypeError("Invalid EaseMyTrip hotel response");

        const gallery = imageUrls(property.media?.gallery);
        const cover = property.media?.coverImage?.url;
        const images = gallery.length ? gallery : imageUrls([{ url: cover }]);
        const ratingScore = Number(property.rating?.score);
        const ratingScale = Number(property.rating?.scale);
        const rating =
            Number.isFinite(ratingScore) && Number.isFinite(ratingScale) && ratingScale > 0
                ? ((ratingScore / ratingScale) * 10).toFixed(1)
                : null;
        const search = response.search || {};
        const rooms = availability.rooms
            .filter((room) => room && typeof room === "object")
            .flatMap((room) =>
                list(room.ratePlans)
                    .filter((rate) => rate && typeof rate === "object")
                    .flatMap((rate) => {
                        const rateId = rate.rateId || rate.providerRateId || rate.provider?.rateKey;
                        const nightlyAmountMinor = majorToMinor(rate.pricing?.perNight?.total);
                        if (!room.roomId || !rateId || nightlyAmountMinor === null) return [];

                        const stock = rate.availability?.roomsLeft;
                        const roomImages = imageUrls(room.media);
                        const size = room.specifications?.size;
                        const sellUnit = rate.pricingUnit === "BED" ? "bed" : "room";
                        const sameStay =
                            Number(rate.pricing?.stay?.nights) === Number(search.nights) &&
                            search.rooms?.length === 1;
                        const stayAmountMinor = sameStay
                            ? majorToMinor(rate.pricing?.stay?.total)
                            : null;
                        const offerItems = list(rate.offers)
                            .filter((offer) => offer?.title)
                            .map((offer, index) => ({
                                id: offer.id || `offer-${index}`,
                                label: offer.title,
                                value:
                                    list(offer.conditions).join(" · ") ||
                                    "Subject to provider terms",
                            }));
                        return [
                            {
                                roomId: `${room.roomId}:${rateId}`,
                                roomTypeId: room.roomId,
                                ratePlanId: rateId,
                                name: room.name || "Room",
                                category: rate.name || room.name || "Room option",
                                description: room.description || "",
                                bed: room.specifications?.bedType || "",
                                beds: room.specifications?.beds || [],
                                size: size?.sqM
                                    ? `${size.sqM} m²`
                                    : size?.sqFt
                                      ? `${size.sqFt} sq ft`
                                      : "",
                                view: room.specifications?.view || "",
                                image: roomImages[0] || images[0] || "",
                                images: roomImages.length ? roomImages : images,
                                facilities: list(room.amenities)
                                    .map((amenity) => amenity?.name)
                                    .filter(Boolean),
                                inclusions: list(rate.benefits)
                                    .filter((benefit) => benefit?.included === true && benefit.name)
                                    .map((benefit) => benefit.name),
                                detailSections: offerItems.length
                                    ? [
                                          {
                                              id: "provider-offers",
                                              title: "Provider offers",
                                              items: offerItems,
                                          },
                                      ]
                                    : [],
                                occupancy:
                                    sellUnit === "bed"
                                        ? { maxGuests: 1, maxAdults: 1, maxChildren: 0 }
                                        : occupancyFor(room, rate, search),
                                available: stock == null ? null : stock,
                                availabilityStatus: rate.availability?.onRequest
                                    ? "ON_REQUEST"
                                    : availability.status,
                                sellUnit,
                                nightlyAmountMinor,
                                stayAmountMinor,
                                currency: rate.pricing?.currency,
                                meal: rate.mealPlan?.name || rate.name || "",
                                ratePlan: rate.name || "",
                                paymentPolicy: rate.payment?.payAtHotel
                                    ? "Pay at property"
                                    : rate.payment?.payNow
                                      ? "Prepayment required"
                                      : "",
                                taxesIncluded: true,
                                refundable: rate.cancellation?.refundable === true,
                                freeCancellationUntil:
                                    rate.cancellation?.freeCancellationUntil || null,
                                cancellation: cancellationText(rate.cancellation),
                                providerReference: {
                                    hotelId: property.providerHotelId,
                                    roomId: room.providerRoomId,
                                    rateId: rate.providerRateId,
                                    rateKey: rate.provider?.rateKey,
                                    sessionToken: rate.provider?.sessionToken,
                                    requiresRecheck:
                                        rate.provider?.requiresRecheck ||
                                        response.meta?.recheckRequiredBeforeBooking,
                                },
                            },
                        ];
                    }),
            );

        return {
            hotelId: property.id,
            name: property.name,
            address: property.address?.formatted || property.address?.line1 || "",
            stars: property.starRating,
            rating,
            reviewCount: property.rating?.reviewCount || response.reviews?.summary?.total || 0,
            distanceFromCentreMeters: null,
            propertyType: property.type || "",
            totalRooms: null,
            languages: [],
            checkInTime: property.checkIn?.from || "",
            checkOutTime: property.checkOut?.until || "",
            payAtProperty: rooms.some((room) => room.paymentPolicy === "Pay at property"),
            images,
            reviews: response.reviews?.items || [],
            description: property.description?.full || property.description?.short || "",
            amenities: list(property.amenities)
                .map((amenity) => amenity?.name)
                .filter(Boolean),
            policies: Array.isArray(property.propertyPolicies?.importantInformation)
                ? property.propertyPolicies.importantInformation
                : property.propertyPolicies?.importantInformation
                  ? [property.propertyPolicies.importantInformation]
                  : [],
            policySections: policySections(property.propertyPolicies),
            services: [...new Set([...list(property.services), ...list(property.accessibility)]
                .map((service) => (typeof service === "string" ? service : service?.name || service?.description))
                .filter(Boolean))],
            detailSections: property.detailSections || response.propertyDetails?.sections || [],
            rooms,
            providerReference: {
                searchId: response.provider?.trace?.providerSearchId,
                hotelId: property.providerHotelId,
                expiresAt: response.meta?.expiresAt,
            },
        };
    }
}

export default EaseMyTripHotelAdapter;
