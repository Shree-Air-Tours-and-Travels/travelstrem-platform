import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import ApiError from "../../shared/errors/ApiError.js";
import FinancialEngine from "../../core/financial-engine/index.js";
import FlightOfferStore from "../flights/services/flight-offer.store.js";
import ContactLead from "../forms/models/ContactLead.js";
import User from "../auth/models/User.js";
import { createReadableReference } from "../../utils/readableReference.js";
import { enquiryDto, publishToUser, REALTIME_EVENTS } from "../../realtime/index.js";
import { createHotelProvider } from "./providers/hotel-provider.factory.js";

const idFor = (actor) => actor?.sub || actor?.id || actor?._id;
const money = (amount, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100);
const hotelPage = JSON.parse(
    readFileSync(new URL("../../data/trehub-remote/hotels/hotels.json", import.meta.url), "utf8"),
).component;
const hotelLabels = hotelPage.elements.labels;
const hotelPageSize = hotelPage.dataScope.options.pagination.pageSize;
const label = (ref, values = {}) =>
    Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        hotelLabels[ref] || "",
    );
const field = (id, labelRef, value) => ({ id, labelRef, value });
const displayTime = (value = "") => {
    const [hours, minutes] = String(value).split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return String(value);
    return new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: minutes ? "2-digit" : undefined,
        hour12: true,
        timeZone: "UTC",
    })
        .format(new Date(Date.UTC(2000, 0, 1, hours, minutes)))
        .toUpperCase();
};
const shortDate = (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    }).format(date);
};
const amenityIcon = (value = "") => {
    const name = String(value).toLowerCase();
    if (name.includes("wi-fi") || name.includes("wifi")) return "globe";
    if (name.includes("pool")) return "beach";
    if (name.includes("parking")) return "carTaxiFront";
    if (name.includes("restaurant") || name.includes("meal")) return "food";
    if (name.includes("reception")) return "support";
    if (name.includes("airport") || name.includes("transfer")) return "plane";
    if (name.includes("spa")) return "sparkles";
    return "check";
};
export function validateHotelSearch(values = {}, now = Date.now()) {
    const errors = {};
    const input = {
        destination: String(values.destination || "").trim(),
        checkIn: String(values.checkIn || ""),
        checkOut: String(values.checkOut || ""),
        guests: Number(values.guests ?? 1),
        rooms: Number(values.rooms ?? 1),
    };
    if (!input.destination || input.destination.length > 120)
        errors.destination = "Enter a destination (up to 120 characters).";
    for (const key of ["checkIn", "checkOut"]) {
        const date = new Date(`${input[key]}T00:00:00Z`);
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(input[key]) ||
            !Number.isFinite(date.getTime()) ||
            date.toISOString().slice(0, 10) !== input[key]
        )
            errors[key] = "Choose a valid date.";
    }
    if (!errors.checkIn && input.checkIn < new Date(now).toISOString().slice(0, 10))
        errors.checkIn = "Check-in cannot be in the past.";
    input.nights = (Date.parse(input.checkOut) - Date.parse(input.checkIn)) / 86400000;
    if (
        !errors.checkOut &&
        (!Number.isInteger(input.nights) || input.nights < 1 || input.nights > 30)
    )
        errors.checkOut = "Choose a stay between 1 and 30 nights.";
    if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 24)
        errors.guests = "Choose between 1 and 24 guests.";
    if (
        !Number.isInteger(input.rooms) ||
        input.rooms < 1 ||
        input.rooms > 8 ||
        input.rooms > input.guests
    )
        errors.rooms = "Choose 1 to 8 rooms, no more than the guest count.";
    if (Object.keys(errors).length)
        throw new ApiError(422, "Check your hotel search details.", errors);
    return input;
}

export default class HotelService {
    constructor({
        provider = createHotelProvider(),
        store = new FlightOfferStore(),
        calculatePricing = FinancialEngine.calculatePricing,
    } = {}) {
        this.provider = provider;
        this.store = store;
        this.calculatePricing = calculatePricing;
    }

    async priceRoom(room, input, actor = {}) {
        if (
            !Number.isSafeInteger(room.nightlyAmountMinor) ||
            room.nightlyAmountMinor < 0 ||
            !room.currency
        )
            throw new ApiError(502, "The hotel supplier returned an invalid rate.");
        const subtotal = room.nightlyAmountMinor * input.rooms * input.nights;
        if (!Number.isSafeInteger(subtotal))
            throw new ApiError(502, "The hotel supplier returned an invalid stay total.");
        const calculation = await this.calculatePricing({
            productType: "hotel",
            baseAmountMinor: subtotal,
            currency: room.currency,
            paymentProvider: "razorpay",
            agencyId: actor.agencyId || null,
        });
        return {
            subtotal,
            convenienceFee: calculation.finalPayableMinor - subtotal,
            total: calculation.finalPayableMinor,
            currency: room.currency,
            pricingConfigSnapshot: calculation.pricingConfigSnapshot,
        };
    }

    async search(values, actor) {
        const input = validateHotelSearch(values);
        const hotels = await this.provider.searchHotels(input);
        if (!Array.isArray(hotels))
            throw new ApiError(502, "The hotel supplier returned an invalid response.");
        const search = {
            searchId: crypto.randomUUID(),
            input,
            hotels,
            provider: this.provider.name,
            expiresAt: Date.now() + 15 * 60000,
        };
        await this.store.set("hotel-search", search.searchId, search);
        return this.results(search.searchId, values, actor);
    }

    async requireSearch(searchId) {
        const search = await this.store.get("hotel-search", searchId);
        if (!search || search.expiresAt <= Date.now())
            throw new ApiError(
                410,
                "This hotel search has expired. Search again for updated availability.",
            );
        if (search.provider !== this.provider.name)
            throw new ApiError(410, "The hotel supplier changed. Please search again.");
        return search;
    }

    async rooms(hotel, search, actor) {
        return Promise.all(
            hotel.rooms
                .filter(
                    (room) =>
                        room.available >= search.input.rooms &&
                        room.capacity * search.input.rooms >= search.input.guests,
                )
                .map(async (room) => ({
                    ...room,
                    price: await this.priceRoom(room, search.input, actor),
                })),
        );
    }

    roomCard(room, input) {
        const detailFields = [
            {
                ...field(
                    "occupancy",
                    "occupancy",
                    label("occupancySummary", { count: room.capacity }),
                ),
                icon: "usersRound",
            },
            { ...field("meal", "meal", room.meal), icon: "food" },
            { ...field("cancellation", "cancellation", room.cancellation), icon: "shieldCheck" },
        ];
        const priceFields = [
            field("nightly", "nightly", money(room.nightlyAmountMinor, room.currency)),
            {
                ...field("stay", "stay", money(room.price.subtotal, room.currency)),
                detail: label(
                    input.rooms === 1 ? "stayUnitsSummarySingleRoom" : "stayUnitsSummary",
                    {
                        rooms: input.rooms,
                        nights: input.nights,
                    },
                ),
            },
            field("fee", "fee", money(room.price.convenienceFee, room.currency)),
            field("total", "total", money(room.price.total, room.currency)),
        ];
        return {
            id: room.roomId,
            title: room.name,
            subtitle: room.bed,
            meta: [room.bed, room.size].filter(Boolean).join(" · "),
            image: room.image || room.images?.[0] || "",
            images: room.images || (room.image ? [room.image] : []),
            imageAlt: room.name,
            galleryTitle: `${room.name} · ${label("roomGallery")}`,
            imageCountLabel: label("photoCount", {
                count: (room.images || (room.image ? [room.image] : [])).length,
            }),
            badge: { value: room.category || room.name, tone: "info" },
            fields: [...detailFields, ...priceFields],
            detailFields,
            priceFields,
            actionLabelRef: "selectRoom",
            actionIcon: "arrowUpRight",
            totalMinor: room.price.total,
            facilities: (room.facilities || []).map((value) => ({
                value,
                icon: amenityIcon(value),
            })),
            size: room.size || "",
            selectedLabelRef: "selectedRoom",
        };
    }

    async results(searchId, filters = {}, actor = {}) {
        const search = await this.requireSearch(searchId);
        const cards = [];
        for (const hotel of search.hotels) {
            if (
                filters.name &&
                !hotel.name.toLowerCase().includes(String(filters.name).toLowerCase())
            )
                continue;
            if (filters.stars && hotel.stars < Number(filters.stars)) continue;
            if (filters.amenity && !hotel.amenities.includes(filters.amenity)) continue;
            const rooms = (await this.rooms(hotel, search, actor))
                .filter((room) => filters.refundable !== "true" || room.refundable)
                .sort((a, b) => a.price.total - b.price.total);
            const room = rooms[0];
            if (!room || (filters.maxPrice && room.price.total > Number(filters.maxPrice) * 100))
                continue;
            const ratingLabelRef =
                Number(hotel.rating) >= 9
                    ? "ratingExceptional"
                    : Number(hotel.rating) >= 8
                      ? "ratingVeryGood"
                      : "ratingGood";
            const highlights = [
                room.refundable
                    ? {
                          id: "cancellation",
                          labelRef: "freeCancellation",
                          icon: "check",
                          tone: "success",
                      }
                    : null,
                room.meal?.toLowerCase().includes("breakfast")
                    ? {
                          id: "breakfast",
                          labelRef: "breakfastIncluded",
                          icon: "food",
                          tone: "warning",
                      }
                    : null,
                hotel.payAtProperty
                    ? {
                          id: "payment",
                          labelRef: "payAtProperty",
                          icon: "payment",
                          tone: "secondary",
                      }
                    : null,
            ].filter(Boolean);
            cards.push({
                id: hotel.hotelId,
                title: hotel.name,
                subtitle: hotel.address,
                image: hotel.images?.[0] || "",
                images: hotel.images || [],
                imageAlt: hotel.name,
                imageCountLabel: label("photoCount", { count: hotel.images?.length || 0 }),
                badge: {
                    value: label("starsSummary", { count: hotel.stars }),
                    tone: "info",
                    icon: "star",
                    showDot: false,
                },
                rating: {
                    value: hotel.rating,
                    labelRef: ratingLabelRef,
                    reviews: label("reviewCountSummary", {
                        count: new Intl.NumberFormat("en-IN").format(hotel.reviewCount || 0),
                    }),
                },
                location: {
                    value: hotel.address,
                    distance: label("distanceSummary", {
                        distance: hotel.distanceFromCentreMeters || 0,
                    }),
                },
                highlights,
                description: hotel.description,
                amenities: (hotel.amenities || []).map((value) => ({
                    value,
                    icon: amenityIcon(value),
                })),
                facts: [
                    {
                        id: "checkIn",
                        labelRef: "checkIn",
                        value: displayTime(hotel.checkInTime),
                        icon: "clock",
                    },
                    {
                        id: "checkOut",
                        labelRef: "checkOut",
                        value: displayTime(hotel.checkOutTime),
                        icon: "clock",
                    },
                    {
                        id: "rooms",
                        labelRef: "roomOptions",
                        value: label("roomOptionsAvailable", { count: rooms.length }),
                        icon: "hotel",
                    },
                ],
                price: { labelRef: "stayPrice", value: money(room.price.total, room.currency) },
                priceFields: [
                    field("nightly", "nightly", money(room.nightlyAmountMinor, room.currency)),
                    field("stay", "stay", money(room.price.subtotal, room.currency)),
                    field("fee", "fee", money(room.price.convenienceFee, room.currency)),
                ],
                staySummary: label(
                    search.input.rooms === 1 ? "staySummarySingleRoom" : "staySummary",
                    search.input,
                ),
                priceDescriptionLabelRef: "priceIncludesFees",
                cancellationNotice:
                    room.refundable && room.freeCancellationUntil
                        ? label("freeCancellationUntil", {
                              date: shortDate(room.freeCancellationUntil),
                          })
                        : "",
                actionLabelRef: "viewHotel",
                secondaryActionLabelRef: "viewRooms",
                href: `/trehub/hotels/${encodeURIComponent(hotel.hotelId)}?searchId=${searchId}`,
                totalMinor: room.price.total,
            });
        }
        if (filters.sort === "price") cards.sort((a, b) => a.totalMinor - b.totalMinor);
        const total = cards.length;
        const totalPages = Math.ceil(total / hotelPageSize);
        const requestedPage = Math.max(1, Number.parseInt(filters.page, 10) || 1);
        const page = totalPages ? Math.min(requestedPage, totalPages) : 1;
        const start = (page - 1) * hotelPageSize;
        return {
            searchId,
            input: search.input,
            provider: search.provider,
            cards: cards.slice(start, start + hotelPageSize),
            summary: label("resultsSummary", {
                count: total,
                destination: search.input.destination,
            }),
            pagination: { page, pageSize: hotelPageSize, total, totalPages },
        };
    }

    async details(searchId, hotelId, actor = {}) {
        const search = await this.requireSearch(searchId);
        if (!search.hotels.some((hotel) => hotel.hotelId === hotelId))
            throw new ApiError(404, "Hotel not found in this search.");
        const hotel = await this.provider.getHotelDetails({ hotelId, input: search.input });
        if (!hotel) throw new ApiError(404, "This hotel is no longer available.");
        const rooms = await this.rooms(hotel, search, actor);
        return {
            searchId,
            hotelId,
            provider: search.provider,
            input: search.input,
            title: hotel.name,
            description: hotel.description,
            address: hotel.address,
            stars: hotel.stars,
            rating: hotel.rating,
            badge: {
                value: label("starsSummary", { count: hotel.stars }),
                tone: "info",
                icon: "hotel",
            },
            images: hotel.images || [],
            reviews: hotel.reviews || [],
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`,
            facts: [
                {
                    id: "rating",
                    icon: "star",
                    labelRef: "rating",
                    value: label("ratingSummary", { rating: hotel.rating }),
                },
                {
                    id: "stars",
                    icon: "hotel",
                    labelRef: "propertyClass",
                    value: label("starsSummary", { count: hotel.stars }),
                },
                {
                    id: "nights",
                    icon: "calendar",
                    labelRef: "nights",
                    value: label("nightsSummary", search.input),
                },
                {
                    id: "party",
                    icon: "usersRound",
                    labelRef: "party",
                    value: label("partySummary", search.input),
                },
            ],
            amenities: (hotel.amenities || []).map((value) => ({
                value,
                icon: amenityIcon(value),
            })),
            policies: hotel.policies || [],
            summary: {
                titleRef: "yourStay",
                subtitle: hotel.name,
                fields: [
                    {
                        ...field(
                            "dates",
                            "dates",
                            `${search.input.checkIn} – ${search.input.checkOut}`,
                        ),
                        icon: "calendarDays",
                    },
                    {
                        ...field(
                            "party",
                            "party",
                            label(
                                search.input.rooms === 1
                                    ? "partySummarySingleRoom"
                                    : "partySummary",
                                search.input,
                            ),
                        ),
                        icon: "usersRound",
                    },
                    {
                        ...field("nights", "nights", label("nightsSummary", search.input)),
                        icon: "clock",
                    },
                ],
            },
            rooms: rooms.map((room) => this.roomCard(room, search.input)),
            returnTo: `/trehub/hotels?${new URLSearchParams(search.input)}`,
        };
    }

    async createEnquiry({ searchId, hotelId, roomId, expectedTotal }, actor) {
        const userId = idFor(actor);
        if (!userId) throw new ApiError(401, "Please sign in to create an enquiry.");
        const search = await this.requireSearch(searchId);
        if (!search.hotels.some((hotel) => hotel.hotelId === hotelId))
            throw new ApiError(404, "Hotel not found in this search.");
        const hotel = await this.provider.getHotelDetails({ hotelId, input: search.input });
        const room =
            hotel &&
            (await this.rooms(hotel, search, actor)).find((item) => item.roomId === roomId);
        if (!room)
            throw new ApiError(
                409,
                "The selected room is no longer available. Choose another room.",
            );
        if (expectedTotal !== room.price.total)
            throw new ApiError(
                409,
                "The hotel price has changed. Refresh the room rates and review the new total.",
            );
        const existing = await ContactLead.findOne({
            claimedBy: userId,
            journeyType: "hotel",
            "customizationSnapshot.searchId": searchId,
            "customizationSnapshot.hotelId": hotelId,
            "customizationSnapshot.roomId": roomId,
            status: { $nin: ["cancelled", "closed"] },
        });
        if (existing) return { targetPath: `/?tab=bookings&enquiry=${existing.enquiryRef}` };
        const customer = await User.findById(userId).select("name email phone").lean();
        const searchUrl = `/trehub/hotels?${new URLSearchParams(search.input)}`;
        const lead = await ContactLead.create({
            form: "hotel-booking",
            enquiryRef: createReadableReference("ENQ"),
            claimedBy: userId,
            product: "trehub",
            journeyType: "hotel",
            tourTitle: hotel.name,
            fields: {
                name: customer?.name || "Traveller",
                email: customer?.email || "",
                phone: customer?.phone || "",
                adultCount: String(search.input.guests),
                childCount: "0",
                infantCount: "0",
                travellerCount: String(search.input.guests),
                hotel: hotel.name,
                address: hotel.address,
                dates: `${search.input.checkIn} – ${search.input.checkOut}`,
                room: `${search.input.rooms} × ${room.name}`,
                meals: room.meal,
                cancellation: room.cancellation,
                stayChargeSummary: money(room.price.subtotal, room.currency),
                convenienceFeeSummary: money(room.price.convenienceFee, room.currency),
                priceSummary: money(room.price.total, room.currency),
            },
            customizationSnapshot: {
                type: "HOTEL",
                travellers: search.input.guests,
                searchId,
                hotelId,
                roomId,
                searchInput: search.input,
                searchUrl,
                hotel,
                room,
                price: room.price,
                requiresPassport: false,
            },
        });
        publishToUser(String(userId), REALTIME_EVENTS.ENQUIRY_CREATED, enquiryDto(lead)).catch(
            () => {},
        );
        return { targetPath: `/?tab=bookings&enquiry=${lead.enquiryRef}` };
    }
}
