import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import ApiError from "../../../shared/errors/ApiError.js";
import FinancialEngine from "../../../core/financial-engine/index.js";
import CurrencyAdapter from "../../../core/financial-engine/adapters/currency.adapter.js";
import FlightOfferStore from "../../flights/services/flight-offer.store.js";
import ContactLead from "../../forms/models/ContactLead.js";
import User from "../../auth/models/User.js";
import { createReadableReference } from "../../../utils/readableReference.js";
import { enquiryDto, publishToUser, REALTIME_EVENTS } from "../../../realtime/index.js";
import { createHotelProvider } from "../providers/hotel-provider.factory.js";
import { hotelsMatch, normalizeHotel } from "../domain/normalize-hotel.js";
import { airportByCode, airports } from "../../flights/data/catalog.js";
import logger from "../../../shared/logger/index.js";

const idFor = (actor) => actor?.sub || actor?.id || actor?._id;
const money = (amount, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100);
const hotelPage = JSON.parse(
    readFileSync(
        new URL("../../../data/trehub-remote/hotels/hotels.json", import.meta.url),
        "utf8",
    ),
).component;
const hotelLabels = hotelPage.elements.labels;
const hotelPageSize = hotelPage.dataScope.options.pagination.pageSize;
const label = (ref, values = {}) =>
    Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
        hotelLabels[ref] || "",
    );
const field = (id, labelRef, value) => ({ id, labelRef, value });
const readableRate = (value) => {
    const text = String(value || "").trim();
    return text && text === text.toUpperCase() && /[A-Z]/.test(text)
        ? text
              .replaceAll("_", " ")
              .toLowerCase()
              .replace(/^./, (letter) => letter.toUpperCase())
        : text;
};
const surchargeHelp = (calculation, currency) => {
    const service =
        calculation.platformFee?.responsibility === "CUSTOMER"
            ? calculation.platformFee.amountMinor || 0
            : 0;
    const gst =
        calculation.platformFee?.responsibility === "CUSTOMER"
            ? calculation.platformFee.gstMinor || 0
            : 0;
    const otherCharges =
        calculation.finalPayableMinor - calculation.baseAmountMinor - service - gst;
    return label(otherCharges > 0 ? "feeHelpWithOther" : "feeHelp", {
        service: money(service, currency),
        gst: money(gst, currency),
    });
};
const requiredUnits = (room, input) => (room.sellUnit === "bed" ? input.guests : input.rooms);
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
const parseProviderDate = (value) => {
    const source = String(value || "").trim();
    if (!source) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(source)
        ? new Date(`${source}T00:00:00Z`)
        : new Date(source);
    return Number.isFinite(date.getTime()) ? date : null;
};
const shortDate = (value) => {
    const date = parseProviderDate(value);
    if (!date) return String(value || "");
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    }).format(date);
};
const displayDate = (value) => {
    const date = parseProviderDate(value);
    if (!date) return String(value || "");
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
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
const bedSummary = (room) =>
    room.bed ||
    (Array.isArray(room.beds)
        ? room.beds
              .map((bed) => {
                  if (typeof bed === "string") return bed;
                  if (bed?.label) return bed.label;
                  const count = Number(bed?.count ?? 1);
                  return bed?.type && Number.isSafeInteger(count) && count > 0
                      ? `${count} ${bed.type}${count === 1 ? "" : "s"}`
                      : "";
              })
              .filter(Boolean)
              .join(" · ")
        : "");
const hotelImages = (hotel) => {
    const propertyImages = Array.isArray(hotel.images) ? hotel.images.filter(Boolean) : [];
    if (propertyImages.length) return propertyImages;
    return [
        ...new Set(
            (hotel.rooms || [])
                .flatMap((room) =>
                    room.images?.length ? room.images : room.image ? [room.image] : [],
                )
                .filter(Boolean),
        ),
    ];
};
const isStayingApiSearchHotel = (hotel) =>
    hotel.providerReference?.suppliers?.length > 0 &&
    hotel.providerReference.suppliers.every((supplier) => supplier.providerName === "stayingapi");
export function validateHotelSearch(values = {}, now = Date.now()) {
    const errors = {};
    const adults = Number(values.adults ?? values.guests ?? 1);
    const children = Number(values.children ?? 0);
    const childAges = String(values.childAges || "")
        .split(",")
        .filter((value) => value !== "")
        .map(Number);
    const input = {
        destination: String(values.destination || "").trim(),
        checkIn: String(values.checkIn || ""),
        checkOut: String(values.checkOut || ""),
        adults,
        children,
        childAges,
        guests: adults + children,
        rooms: Number(values.rooms ?? 1),
        pets: values.pets === true || String(values.pets).toLowerCase() === "true",
        currency: String(values.currency || process.env.DEFAULT_DISPLAY_CURRENCY || "INR")
            .trim()
            .toUpperCase(),
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
    if (!/^[A-Z]{3}$/.test(input.currency))
        errors.currency = "Choose a valid three-letter currency code.";
    if (!Number.isInteger(adults) || adults < 1 || adults > 24)
        errors.adults = "Choose between 1 and 24 adults.";
    if (!Number.isInteger(children) || children < 0 || children > 10)
        errors.children = "Choose up to 10 children.";
    if (
        children !== childAges.length ||
        childAges.some((age) => !Number.isInteger(age) || age < 0 || age > 17)
    )
        errors.childAges = "Provide each child's age at check-out.";
    if (
        !Number.isInteger(input.rooms) ||
        input.rooms < 1 ||
        input.rooms > 8 ||
        input.rooms > input.guests
    )
        errors.rooms = "Choose 1 to 8 rooms, no more than the guest count.";
    if (Object.keys(errors).length)
        throw new ApiError(422, "Check your hotel search details.", errors);
    const destinationKey = input.destination.toLowerCase();
    const airport =
        airportByCode.get(input.destination.toUpperCase()) ||
        airports.find((item) =>
            [item.city, item.name].some(
                (value) => String(value || "").toLowerCase() === destinationKey,
            ),
        );
    input.destinationCode =
        airport?.iataCode ||
        (/^[A-Za-z0-9]{3}$/.test(input.destination) ? input.destination.toUpperCase() : "");
    input.destinationName = airport?.city || input.destination;
    input.destinationCountry = airport?.country || "";
    input.destinationCountryCode = airport?.countryCode || "";
    return input;
}

export default class HotelService {
    constructor({
        provider = null,
        store = new FlightOfferStore(),
        calculatePricing = FinancialEngine.calculatePricing,
        currencyAdapter = new CurrencyAdapter(),
    } = {}) {
        this.provider = provider;
        this.store = store;
        this.calculatePricing = calculatePricing;
        this.currencyAdapter = currencyAdapter;
        this.detailCache = new Map();
    }

    async getProvider() {
        if (!this.provider) {
            this.providerPromise ||= createHotelProvider();
            try {
                this.provider = await this.providerPromise;
            } catch (error) {
                this.providerPromise = null;
                throw error;
            }
        }
        return this.provider;
    }

    async priceRoom(room, input, actor = {}) {
        if (
            !Number.isSafeInteger(room.nightlyAmountMinor) ||
            room.nightlyAmountMinor < 0 ||
            !room.currency
        )
            throw new ApiError(502, "The hotel supplier returned an invalid rate.");
        const units = requiredUnits(room, input);
        const stayAmount = room.stayAmountMinor ?? room.nightlyAmountMinor * input.nights;
        if (!Number.isSafeInteger(stayAmount) || stayAmount < 0)
            throw new ApiError(502, "The hotel supplier returned an invalid stay rate.");
        const subtotal = stayAmount * units;
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
            feeHelp: surchargeHelp(calculation, room.currency),
            total: calculation.finalPayableMinor,
            currency: room.currency,
            pricingConfigSnapshot: calculation.pricingConfigSnapshot,
        };
    }

    async search(values, actor) {
        const input = validateHotelSearch({
            ...values,
            currency: values?.currency || actor?.currency || actor?.settings?.currency,
        });
        const provider = await this.getProvider();
        const queryKey = crypto
            .createHash("sha256")
            .update(
                JSON.stringify({
                    input,
                    provider: provider.name,
                    offerNormalizationVersion: 2,
                    resultLimits: [
                        process.env.HOTEL_PROVIDER_RESULT_LIMIT,
                        process.env.HOTEL_HOTELBEDS_RESULT_LIMIT,
                        process.env.HOTEL_STAYINGAPI_RESULT_LIMIT,
                    ],
                    actorId: idFor(actor) || null,
                    agencyId: actor?.agencyId || null,
                }),
            )
            .digest("hex");
        const cachedSearchId = await this.store.get("hotel-query", queryKey);
        if (cachedSearchId) {
            const cachedSearch = await this.store.get("hotel-search", cachedSearchId);
            if (cachedSearch?.expiresAt > Date.now() && cachedSearch.provider === provider.name)
                return this.results(cachedSearchId, values, actor);
        }
        const providerHotels = await provider.searchHotels(input);
        if (!Array.isArray(providerHotels))
            throw new ApiError(502, "The hotel supplier returned an invalid response.");
        const providerCompletion = providerHotels.providerCompletion;
        const providerDiagnostics = providerHotels.providerDiagnostics || [];
        const conversionOutcomes = await Promise.allSettled(
            providerHotels.map((hotel) =>
                this.currencyAdapter.convertHotel(normalizeHotel(hotel), input.currency),
            ),
        );
        const hotels = conversionOutcomes.flatMap((outcome) =>
            outcome.status === "fulfilled" ? [outcome.value] : [],
        );
        if (!hotels.length && providerHotels.length)
            throw (
                conversionOutcomes.find((outcome) => outcome.status === "rejected")?.reason ||
                new ApiError(502, "Hotel suppliers returned no usable stays.")
            );
        const now = Date.now();
        const expiresAt = hotels.reduce(
            (expiry, hotel) => {
                const providerExpiry = Date.parse(hotel.providerReference?.expiresAt);
                return Number.isFinite(providerExpiry) ? Math.min(expiry, providerExpiry) : expiry;
            },
            now + 15 * 60000,
        );
        const search = {
            searchId: crypto.randomUUID(),
            input,
            hotels,
            provider: provider.name,
            providerDiagnostics,
            providerSyncStatus: providerDiagnostics.some((item) => item.status === "loading")
                ? "loading"
                : "complete",
            demoInventory: Boolean(provider.isDemo),
            expiresAt,
        };
        await this.store.set("hotel-search", search.searchId, search);
        await this.store.set("hotel-query", queryKey, search.searchId);
        if (providerCompletion) {
            void providerCompletion
                .then(async (completedProviderHotels) => {
                    const completedConversions = await Promise.allSettled(
                        completedProviderHotels.map((hotel) =>
                            this.currencyAdapter.convertHotel(
                                normalizeHotel(hotel),
                                input.currency,
                            ),
                        ),
                    );
                    const completedHotels = completedConversions.flatMap((outcome) =>
                        outcome.status === "fulfilled" ? [outcome.value] : [],
                    );
                    const current = await this.store.get("hotel-search", search.searchId);
                    if (!current) return;
                    const stableHotels = [...current.hotels];
                    for (const hotel of completedHotels) {
                        const index = stableHotels.findIndex((item) => hotelsMatch(item, hotel));
                        if (index === -1) stableHotels.push(hotel);
                        else
                            stableHotels[index] = {
                                ...hotel,
                                hotelId: stableHotels[index].hotelId,
                            };
                    }
                    await this.store.set("hotel-search", search.searchId, {
                        ...current,
                        hotels: stableHotels,
                        providerDiagnostics: completedProviderHotels.providerDiagnostics || [],
                        providerSyncStatus: "complete",
                    });
                })
                .catch((error) => {
                    logger.error("[Hotels] background provider sync failed", {
                        searchId: search.searchId,
                        code: error?.code || "PROVIDER_ERROR",
                    });
                    void this.store
                        .get("hotel-search", search.searchId)
                        .then(
                            (current) =>
                                current &&
                                this.store.set("hotel-search", search.searchId, {
                                    ...current,
                                    providerSyncStatus: "complete",
                                }),
                        )
                        .catch(() => {});
                });
        }
        return this.results(search.searchId, values, actor);
    }

    async requireSearch(searchId) {
        const provider = await this.getProvider();
        const search = await this.store.get("hotel-search", searchId);
        if (!search || search.expiresAt <= Date.now())
            throw new ApiError(
                410,
                "This hotel search has expired. Search again for updated availability.",
            );
        if (search.provider !== provider.name)
            throw new ApiError(410, "The hotel supplier changed. Please search again.");
        return search;
    }

    async rooms(hotel, search, actor, { forDetails = false } = {}) {
        const priceInput = search.input;
        return Promise.all(
            (Array.isArray(hotel.rooms) ? hotel.rooms : [])
                .filter((room) => room && typeof room === "object")
                .filter((room) => {
                    const units = forDetails
                        ? room.sellUnit === "bed" && search.input.rooms === 1
                            ? search.input.guests
                            : 1
                        : requiredUnits(room, search.input);
                    const stockAvailable =
                        room.availabilityStatus === "ON_REQUEST" ||
                        (room.available === null
                            ? ["AVAILABLE", "ON_REQUEST"].includes(room.availabilityStatus)
                            : room.available >= units);
                    const adultCapacity =
                        room.occupancy?.maxAdults == null ? null : Number(room.occupancy.maxAdults);
                    return (
                        room.roomId &&
                        stockAvailable &&
                        (forDetails ||
                            (room.capacity * units >= search.input.guests &&
                                (!Number.isSafeInteger(adultCapacity) ||
                                    adultCapacity * units >= search.input.guests))) &&
                        Number.isSafeInteger(room.nightlyAmountMinor) &&
                        room.nightlyAmountMinor >= 0 &&
                        room.currency
                    );
                })
                .map(async (room) => ({
                    ...room,
                    price: await this.priceRoom(room, priceInput, actor),
                })),
        );
    }

    roomCard(room, input) {
        const beds = bedSummary(room);
        const hasAvailability = room.available !== null;
        const availabilityLabelRef =
            room.sellUnit === "bed"
                ? room.available === 1
                    ? "bedRemaining"
                    : "bedsRemaining"
                : room.available === 1
                  ? "roomRemaining"
                  : "roomsRemaining";
        const availabilityValue =
            room.availabilityStatus === "ON_REQUEST"
                ? label("availabilityOnRequest")
                : hasAvailability
                  ? label(availabilityLabelRef, { count: room.available })
                  : label("availabilityAvailable");
        const detailFields = [
            {
                ...field(
                    "occupancy",
                    "occupancy",
                    room.occupancy?.summary ||
                        label(
                            room.sellUnit === "bed"
                                ? "occupancyBedSummary"
                                : room.capacity === 1
                                  ? "occupancySummarySingle"
                                  : "occupancySummary",
                            { count: room.capacity },
                        ),
                ),
                icon: "usersRound",
            },
            { ...field("meal", "meal", readableRate(room.meal)), icon: "food" },
            { ...field("cancellation", "cancellation", room.cancellation), icon: "shieldCheck" },
        ];
        const priceFields = [
            field(
                "nightly",
                room.sellUnit === "bed" ? "nightlyBed" : "nightly",
                money(room.nightlyAmountMinor, room.currency),
            ),
            {
                ...field("stay", "stay", money(room.price.subtotal, room.currency)),
                detail: label(
                    room.sellUnit === "bed"
                        ? input.guests === 1
                            ? "stayBedUnitsSummarySingleBed"
                            : "stayBedUnitsSummary"
                        : input.rooms === 1
                          ? "stayUnitsSummarySingleRoom"
                          : "stayUnitsSummary",
                    {
                        rooms: input.rooms,
                        guests: input.guests,
                        nights: input.nights,
                    },
                ),
            },
            {
                ...field("fee", "fee", money(room.price.convenienceFee, room.currency)),
            },
            field(
                "total",
                input.selectionRooms > 1 ? "singleRoomTotal" : "total",
                money(room.price.total, room.currency),
            ),
        ];
        const roomInformation = [
            beds ? { ...field("bed", "bedType", beds), icon: "hotel" } : null,
            room.size ? { ...field("size", "roomSize", room.size), icon: "info" } : null,
            room.view ? { ...field("view", "roomView", room.view), icon: "eye" } : null,
            room.bathroom
                ? { ...field("bathroom", "bathroom", room.bathroom), icon: "check" }
                : null,
            room.smokingPolicy
                ? {
                      ...field("smoking", "smokingPolicy", room.smokingPolicy),
                      icon: "shieldCheck",
                  }
                : null,
            room.childPolicy
                ? { ...field("children", "childPolicy", room.childPolicy), icon: "usersRound" }
                : null,
            room.extraBedPolicy
                ? { ...field("extraBed", "extraBedPolicy", room.extraBedPolicy), icon: "hotel" }
                : null,
            room.accessibility
                ? {
                      ...field("accessibility", "accessibility", room.accessibility),
                      icon: "check",
                  }
                : null,
        ].filter(Boolean);
        const rateConditions = [
            room.ratePlan
                ? {
                      ...field("ratePlan", "ratePlan", readableRate(room.ratePlan)),
                      icon: "badgeCheck",
                  }
                : null,
            room.paymentPolicy
                ? { ...field("payment", "paymentPolicy", room.paymentPolicy), icon: "payment" }
                : null,
            room.meal ? { ...field("meal", "meal", readableRate(room.meal)), icon: "food" } : null,
            typeof room.taxesIncluded === "boolean"
                ? {
                      ...field(
                          "taxes",
                          "taxesAndFees",
                          label(room.taxesIncluded ? "taxesIncluded" : "taxesExcluded"),
                      ),
                      icon: "badgeCheck",
                  }
                : null,
            room.cancellation
                ? {
                      ...field("cancellation", "cancellation", room.cancellation),
                      icon: "shieldCheck",
                  }
                : null,
            { ...field("availability", "availability", availabilityValue), icon: "hotel" },
        ].filter(Boolean);
        const includedItems = (room.inclusions || []).map((value, index) => ({
            id: `inclusion-${index}`,
            value,
            icon: "check",
        }));
        const facilityItems = (room.facilities || []).map((value, index) => ({
            id: `facility-${index}`,
            value,
            icon: amenityIcon(value),
        }));
        const priceFacts = [
            { ...field("availability", "availability", availabilityValue), icon: "hotel" },
            room.paymentPolicy
                ? { ...field("payment", "paymentPolicy", room.paymentPolicy), icon: "payment" }
                : null,
            typeof room.taxesIncluded === "boolean"
                ? {
                      ...field(
                          "taxes",
                          "taxesAndFees",
                          label(room.taxesIncluded ? "taxesIncluded" : "taxesExcluded"),
                      ),
                      icon: "badgeCheck",
                  }
                : null,
        ].filter(Boolean);
        return {
            id: room.roomId,
            roomTypeId: room.roomTypeId,
            ratePlanId: room.ratePlanId,
            rateLabel: readableRate(room.ratePlan || room.meal || room.category || room.name),
            rateSummary: [
                room.meal !== room.ratePlan ? readableRate(room.meal) : null,
                room.paymentPolicy,
            ]
                .filter(Boolean)
                .join(" · "),
            title: room.name,
            subtitle: beds,
            meta: [beds, room.size].filter(Boolean).join(" · "),
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
            priceFacts,
            expandedDetails: {
                titleRef: "roomDetailsHeading",
                description: room.description || "",
                sections: [
                    roomInformation.length
                        ? { id: "room", titleRef: "roomInformation", items: roomInformation }
                        : null,
                    includedItems.length
                        ? { id: "inclusions", titleRef: "roomInclusions", items: includedItems }
                        : null,
                    facilityItems.length
                        ? { id: "facilities", titleRef: "roomFeatures", items: facilityItems }
                        : null,
                    rateConditions.length
                        ? { id: "rate", titleRef: "rateConditions", items: rateConditions }
                        : null,
                    ...(Array.isArray(room.detailSections)
                        ? room.detailSections
                              .filter((section) => section?.title && Array.isArray(section.items))
                              .map((section, sectionIndex) => ({
                                  id: section.id || `provider-${sectionIndex}`,
                                  title: section.title,
                                  items: section.items
                                      .filter((item) => item?.label && item.value != null)
                                      .map((item, itemIndex) => ({
                                          id: item.id || `item-${itemIndex}`,
                                          label: item.label,
                                          value: String(item.value),
                                          icon: "info",
                                      })),
                              }))
                        : []),
                ].filter(Boolean),
            },
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

    async lowestStayCombination(hotel, search, actor, refundableOnly = false) {
        const groups = new Map();
        for (const room of hotel.rooms || []) {
            if (refundableOnly && !room.refundable) continue;
            if (
                !Number.isSafeInteger(room.nightlyAmountMinor) ||
                room.nightlyAmountMinor < 0 ||
                !room.currency ||
                !Number.isSafeInteger(room.capacity) ||
                room.capacity < 1
            )
                continue;
            if (room.available === 0 && room.availabilityStatus !== "ON_REQUEST") continue;
            if (
                room.available == null &&
                !["AVAILABLE", "ON_REQUEST"].includes(room.availabilityStatus)
            )
                continue;
            const stayMinor = room.stayAmountMinor ?? room.nightlyAmountMinor * search.input.nights;
            if (!Number.isSafeInteger(stayMinor) || stayMinor < 0) continue;
            const key = `${room.currency}:${room.roomTypeId || room.roomId}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({ ...room, stayMinor });
        }
        const currency = groups.values().next().value?.[0]?.currency;
        if (!currency) return null;
        let states = new Map([
            ["0:0:0", { count: 0, capacity: 0, adults: 0, subtotal: 0, rooms: [] }],
        ]);
        for (const offers of groups.values()) {
            if (offers[0].currency !== currency) continue;
            const next = new Map(states);
            for (let quantity = 1; quantity <= search.input.rooms; quantity += 1) {
                const rate = offers
                    .filter((room) => {
                        const units =
                            room.sellUnit === "bed" && search.input.rooms === 1
                                ? search.input.guests
                                : quantity;
                        return (
                            room.availabilityStatus === "ON_REQUEST" ||
                            room.available == null ||
                            room.available >= units
                        );
                    })
                    .sort((a, b) => a.stayMinor - b.stayMinor)[0];
                if (!rate) continue;
                const units =
                    rate.sellUnit === "bed" && search.input.rooms === 1
                        ? search.input.guests
                        : quantity;
                const adults =
                    rate.occupancy?.maxAdults == null
                        ? rate.capacity
                        : Number(rate.occupancy.maxAdults);
                if (!Number.isSafeInteger(adults) || adults < 1) continue;
                for (const state of states.values()) {
                    const count = state.count + quantity;
                    if (count > search.input.rooms) continue;
                    const capacity = Math.min(
                        search.input.guests,
                        state.capacity + rate.capacity * units,
                    );
                    const adultCapacity = Math.min(
                        search.input.guests,
                        state.adults + adults * units,
                    );
                    const subtotal = state.subtotal + rate.stayMinor * units;
                    if (!Number.isSafeInteger(subtotal)) continue;
                    const key = `${count}:${capacity}:${adultCapacity}`;
                    if (!next.has(key) || subtotal < next.get(key).subtotal)
                        next.set(key, {
                            count,
                            capacity,
                            adults: adultCapacity,
                            subtotal,
                            rooms: [...state.rooms, ...Array(quantity).fill(rate)],
                        });
                }
            }
            states = next;
        }
        const best = states.get(
            `${search.input.rooms}:${search.input.guests}:${search.input.guests}`,
        );
        if (!best) return null;
        const calculation = await this.calculatePricing({
            productType: "hotel",
            baseAmountMinor: best.subtotal,
            currency,
            paymentProvider: "razorpay",
            agencyId: actor.agencyId || null,
        });
        return {
            rooms: best.rooms,
            price: {
                subtotal: best.subtotal,
                convenienceFee: calculation.finalPayableMinor - best.subtotal,
                feeHelp: surchargeHelp(calculation, currency),
                total: calculation.finalPayableMinor,
                currency,
            },
            optionCount: [...groups.values()].reduce((total, offers) => total + offers.length, 0),
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
            const stay = await this.lowestStayCombination(
                hotel,
                search,
                actor,
                filters.refundable === "true",
            );
            const room = stay?.rooms[0];
            if (!room || (filters.maxPrice && stay.price.total > Number(filters.maxPrice) * 100))
                continue;
            const sameRate = stay.rooms.every((item) => item.roomId === room.roomId);
            const ratingLabelRef =
                Number(hotel.rating) >= 9
                    ? "ratingExceptional"
                    : Number(hotel.rating) >= 8
                      ? "ratingVeryGood"
                      : "ratingGood";
            const highlights = [
                stay.rooms.every((item) => item.refundable)
                    ? {
                          id: "cancellation",
                          labelRef: "freeCancellation",
                          icon: "check",
                          tone: "success",
                      }
                    : null,
                stay.rooms.every((item) => item.meal?.toLowerCase().includes("breakfast"))
                    ? {
                          id: "breakfast",
                          labelRef: "breakfastIncluded",
                          icon: "food",
                          tone: "warning",
                      }
                    : null,
                stay.rooms.every((item) => item.paymentPolicy === "Pay at property")
                    ? {
                          id: "payment",
                          labelRef: "payAtProperty",
                          icon: "payment",
                          tone: "secondary",
                      }
                    : null,
            ].filter(Boolean);
            const images = hotelImages(hotel);
            cards.push({
                id: hotel.hotelId,
                title: hotel.name,
                subtitle: hotel.address,
                image: images[0] || "",
                images,
                imageAlt: hotel.name,
                imageCountLabel: label("photoCount", { count: images.length }),
                badge: {
                    value: label("starsSummary", { count: hotel.stars }),
                    tone: "info",
                    icon: "star",
                    showDot: false,
                },
                rating: {
                    value: hotel.rating,
                    labelRef: ratingLabelRef,
                    reviews: hotel.reviewCount
                        ? label("reviewCountSummary", {
                              count: new Intl.NumberFormat("en-IN").format(hotel.reviewCount),
                          })
                        : "",
                },
                location: {
                    value: hotel.address,
                    distance:
                        Number.isFinite(Number(hotel.distanceFromCentreMeters)) &&
                        hotel.distanceFromCentreMeters != null
                            ? label("distanceSummary", { distance: hotel.distanceFromCentreMeters })
                            : "",
                },
                highlights,
                description: hotel.description,
                amenities: (hotel.amenities || []).slice(0, 6).map((value) => ({
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
                        value: label("roomOptionsAvailable", { count: stay.optionCount }),
                        icon: "hotel",
                    },
                ].filter((fact) => fact.value),
                price: {
                    labelRef: "stayPrice",
                    value: money(stay.price.total, stay.price.currency),
                },
                priceFields: [
                    sameRate
                        ? field(
                              "nightly",
                              room.sellUnit === "bed" ? "nightlyBed" : "nightly",
                              money(room.nightlyAmountMinor, room.currency),
                          )
                        : null,
                    field("stay", "stay", money(stay.price.subtotal, stay.price.currency)),
                    {
                        ...field(
                            "fee",
                            "fee",
                            money(stay.price.convenienceFee, stay.price.currency),
                        ),
                    },
                ].filter(Boolean),
                staySummary: label(
                    room.sellUnit === "bed"
                        ? search.input.guests === 1
                            ? "staySummarySingleBed"
                            : "staySummaryBeds"
                        : search.input.rooms === 1
                          ? "staySummarySingleRoom"
                          : "staySummary",
                    search.input,
                ),
                priceDescriptionLabelRef: "priceIncludesFees",
                cancellationNotice:
                    stay.rooms.every((item) => item.refundable) &&
                    sameRate &&
                    room.freeCancellationUntil
                        ? label("freeCancellationUntil", {
                              date: shortDate(room.freeCancellationUntil),
                          })
                        : "",
                actionLabelRef: "viewHotel",
                secondaryActionLabelRef: "viewRooms",
                href: `/trehub/hotels/${encodeURIComponent(hotel.hotelId)}?searchId=${searchId}`,
                totalMinor: stay.price.total,
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
            expiresAt: search.expiresAt,
            input: search.input,
            provider: search.provider,
            providers: search.providerDiagnostics || [],
            providerSyncStatus: search.providerSyncStatus || "complete",
            demoInventory: search.demoInventory,
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
        const key = `${searchId}:${hotelId}:${idFor(actor) || "guest"}:${actor.agencyId || ""}`;
        const cached = this.detailCache.get(key);
        if (cached?.expiresAt > Date.now()) return cached.value;
        if (this.detailCache.size > 500) {
            for (const [cacheKey, entry] of this.detailCache) {
                if (entry.expiresAt <= Date.now()) this.detailCache.delete(cacheKey);
            }
            if (this.detailCache.size > 500)
                this.detailCache.delete(this.detailCache.keys().next().value);
        }
        const value = this.loadDetails(searchId, hotelId, actor);
        this.detailCache.set(key, {
            value,
            expiresAt: Math.min(search.expiresAt, Date.now() + 60000),
        });
        try {
            return await value;
        } catch (error) {
            this.detailCache.delete(key);
            throw error;
        }
    }

    async detailWidget(searchId, hotelId, widget, actor = {}) {
        const details = await this.details(searchId, hotelId, actor);
        if (widget === "overview") {
            const propertyFields = new Set([
                "rooms",
                "roomGroups",
                "amenities",
                "policies",
                "policySections",
                "services",
                "detailSections",
                "reviews",
                "reviewCards",
                "rules",
                "contact",
            ]);
            return Object.fromEntries(
                Object.entries(details).filter(([key]) => !propertyFields.has(key)),
            );
        }
        if (widget === "rooms") return { rooms: details.rooms, roomGroups: details.roomGroups };
        if (widget === "property-information")
            return {
                address: details.address,
                mapUrl: details.mapUrl,
                amenities: details.amenities,
                policies: details.policies,
                policySections: details.policySections,
                services: details.services,
                detailSections: details.detailSections,
                reviewCards: details.reviewCards,
                rules: details.rules,
                contact: details.contact,
            };
        throw new ApiError(404, "This hotel widget is not available.");
    }

    async loadDetails(searchId, hotelId, actor = {}) {
        const search = await this.requireSearch(searchId);
        const searchedHotel = search.hotels.find((hotel) => hotel.hotelId === hotelId);
        if (!searchedHotel) throw new ApiError(404, "Hotel not found in this search.");
        const providerHotel = isStayingApiSearchHotel(searchedHotel)
            ? searchedHotel
            : await (
                  await this.getProvider()
              ).getHotelDetails({
                  hotelId,
                  providerReference: searchedHotel.providerReference,
                  input: search.input,
              });
        // The search snapshot remains valid for this search even when a supplier's
        // follow-up details request has no availability or temporarily fails.
        const hotel = await this.currencyAdapter.convertHotel(
            normalizeHotel(providerHotel || searchedHotel),
            search.input.currency,
        );
        if (hotel.hotelId !== hotelId)
            throw new ApiError(502, "The hotel supplier returned a different property.");
        const rooms = await this.rooms(hotel, search, actor, { forDetails: true });
        const ratingLabelRef =
            Number(hotel.rating) >= 9
                ? "ratingExceptional"
                : Number(hotel.rating) >= 8
                  ? "ratingVeryGood"
                  : "ratingGood";
        const roomCards = rooms.map((room) => this.roomCard(room, search.input));
        const roomGroups = [
            ...roomCards
                .reduce((groups, room) => {
                    const typeId = room.roomTypeId || room.id;
                    if (!groups.has(typeId)) groups.set(typeId, { id: typeId, variants: [] });
                    groups.get(typeId).variants.push(room);
                    return groups;
                }, new Map())
                .values(),
        ];
        const shownAmenities = new Set(
            (hotel.amenities || []).map((value) => value.trim().toLowerCase()),
        );
        const serviceValues = [...new Set([
            ...(hotel.services || []),
            ...(hotel.amenities || []).filter((value) =>
                /wheelchair|accessible|braille|visual alarm|elevator|concierge|housekeeping|front desk|laundry service|transfer service/i.test(value),
            ),
        ])];
        const shownPolicies = new Set(
            (hotel.policies || []).map((value) => value.trim().toLowerCase()),
        );
        const detailSections = (hotel.detailSections || [])
            .map((section) => ({
                ...section,
                items: (section.items || []).filter((item) => {
                    const name = String(item.label || "")
                        .trim()
                        .toLowerCase();
                    const value = String(item.value || "")
                        .trim()
                        .toLowerCase();
                    return (
                        !(shownAmenities.has(name) && value === "available") &&
                        !shownPolicies.has(value)
                    );
                }),
            }))
            .filter((section) => section.items.length || section.description);
        return {
            searchId,
            hotelId,
            provider: search.provider,
            demoInventory: search.demoInventory,
            input: search.input,
            title: hotel.name,
            startingPrice: rooms.length
                ? money(Math.min(...rooms.map((room) => room.price.total)), search.input.currency)
                : "",
            description: hotel.description,
            address: hotel.address,
            stars: hotel.stars,
            propertyClass: label("propertyClassSummary", { count: hotel.stars }),
            rating: hotel.rating,
            ratingSummary: {
                value: hotel.rating,
                labelRef: ratingLabelRef,
                reviews: label("reviewCountSummary", {
                    count: new Intl.NumberFormat("en-IN").format(hotel.reviewCount || 0),
                }),
            },
            badge: {
                value: label("starsSummary", { count: hotel.stars }),
                tone: "info",
                icon: "hotel",
            },
            images: hotelImages(hotel),
            reviews: hotel.reviews || [],
            reviewCards: (Array.isArray(hotel.reviews) ? hotel.reviews : [])
                .flatMap((review) => {
                    const body =
                        typeof review === "string"
                            ? review.trim()
                            : String(
                                  review?.text || review?.comment || review?.review || "",
                              ).trim();
                    if (!body) return [];
                    return [
                        {
                            body,
                            author:
                                typeof review === "string"
                                    ? ""
                                    : String(
                                          review.author || review.reviewer || review.name || "",
                                      ).trim(),
                        },
                    ];
                })
                .slice(0, 3),
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`,
            contact:
                hotel.identity?.phone?.length >= 7
                    ? {
                          phone: hotel.identity.phone,
                          phoneUrl: `tel:${hotel.identity.phone.replace(/[^\d+]/g, "")}`,
                      }
                    : null,
            facts: [
                {
                    id: "propertyType",
                    icon: "hotel",
                    labelRef: "propertyType",
                    value: hotel.propertyType || "",
                },
                {
                    id: "propertyRooms",
                    icon: "building2",
                    labelRef: "propertyRooms",
                    value: hotel.totalRooms
                        ? label("propertyRoomsSummary", { count: hotel.totalRooms })
                        : "",
                },
                {
                    id: "languages",
                    icon: "globe",
                    labelRef: "languages",
                    value: (hotel.languages || []).join(", "),
                },
                {
                    id: "arrivalDeparture",
                    icon: "clock",
                    labelRef: "arrivalDeparture",
                    value:
                        hotel.checkInTime && hotel.checkOutTime
                            ? `${displayTime(hotel.checkInTime)} – ${displayTime(hotel.checkOutTime)}`
                            : "",
                },
            ].filter((item) => item.value),
            amenities: (hotel.amenities || []).filter((value) => !serviceValues.includes(value)).map((value) => ({
                value,
                icon: amenityIcon(value),
            })),
            policies: hotel.policies || [],
            policySections: hotel.policySections || [],
            services: serviceValues.map((value) => ({ value, icon: amenityIcon(value) })),
            detailSections,
            rules: {
                checkIn: hotel.checkInTime ? displayTime(hotel.checkInTime) : "",
                checkOut: hotel.checkOutTime ? displayTime(hotel.checkOutTime) : "",
            },
            summary: {
                titleRef: "yourStay",
                subtitle: hotel.name,
                fields: [
                    {
                        ...field(
                            "dates",
                            "dates",
                            `${displayDate(search.input.checkIn)} – ${displayDate(search.input.checkOut)}`,
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
            rooms: roomCards,
            roomGroups,
            returnTo: `/trehub/hotels?${new URLSearchParams(search.input)}`,
        };
    }

    async quoteRooms({ searchId, hotelId, roomIds }, actor = {}) {
        const search = await this.requireSearch(searchId);
        const searchedHotel = search.hotels.find((item) => item.hotelId === hotelId);
        if (!searchedHotel) throw new ApiError(404, "Hotel not found in this search.");
        if (
            !Array.isArray(roomIds) ||
            roomIds.length !== search.input.rooms ||
            roomIds.some((id) => typeof id !== "string" || !id)
        )
            throw new ApiError(422, `Choose ${search.input.rooms} room offers for this stay.`);

        const providerHotel = isStayingApiSearchHotel(searchedHotel)
            ? searchedHotel
            : await (
                  await this.getProvider()
              ).getHotelDetails({
                  hotelId,
                  providerReference: searchedHotel.providerReference,
                  input: search.input,
              });
        const hotel = await this.currencyAdapter.convertHotel(
            normalizeHotel(providerHotel || searchedHotel),
            search.input.currency,
        );
        if (hotel.hotelId !== hotelId)
            throw new ApiError(502, "The hotel supplier returned a different property.");

        const selected = roomIds.map((id) => hotel.rooms.find((room) => room.roomId === id));
        if (selected.some((room) => !room))
            throw new ApiError(409, "A selected room is no longer available. Review the rates.");
        const quantities =
            selected.length === 1 && selected[0].sellUnit === "bed"
                ? [search.input.guests]
                : selected.map(() => 1);
        const currency = selected[0].currency;
        if (
            !currency ||
            selected.some(
                (room) =>
                    room.currency !== currency ||
                    !Number.isSafeInteger(room.nightlyAmountMinor) ||
                    room.nightlyAmountMinor < 0,
            )
        )
            throw new ApiError(409, "The selected room rates cannot be combined.");

        const byOffer = new Map();
        const byType = new Map();
        for (const [index, room] of selected.entries()) {
            const typeId = room.roomTypeId || room.roomId;
            byOffer.set(room.roomId, (byOffer.get(room.roomId) || 0) + quantities[index]);
            byType.set(typeId, [
                ...(byType.get(typeId) || []),
                ...Array(quantities[index]).fill(room),
            ]);
        }
        for (const room of selected) {
            if (
                room.availabilityStatus !== "ON_REQUEST" &&
                (room.available === 0 ||
                    (room.available == null && room.availabilityStatus !== "AVAILABLE") ||
                    (room.available != null && byOffer.get(room.roomId) > room.available))
            )
                throw new ApiError(
                    409,
                    "A selected room is no longer available. Review the rates.",
                );
        }
        for (const sameType of byType.values()) {
            const stock = sameType.map((room) => room.available).filter((value) => value != null);
            if (
                stock.length &&
                sameType.length > Math.min(...stock) &&
                !sameType.every((room) => room.availabilityStatus === "ON_REQUEST")
            )
                throw new ApiError(409, "There are not enough rooms of the selected type.");
        }
        const capacity = selected.reduce(
            (total, room, index) => total + room.capacity * quantities[index],
            0,
        );
        const adultCapacity = selected.reduce((total, room, index) => {
            const adults =
                room.occupancy?.maxAdults == null ? null : Number(room.occupancy.maxAdults);
            return (
                total + (Number.isSafeInteger(adults) ? adults : room.capacity) * quantities[index]
            );
        }, 0);
        if (capacity < search.input.guests || adultCapacity < search.input.guests)
            throw new ApiError(
                422,
                "These rooms cannot accommodate all guests. Choose a different combination.",
            );

        const lineItems = selected.map((room, index) => {
            const stayAmountMinor =
                (room.stayAmountMinor ?? room.nightlyAmountMinor * search.input.nights) *
                quantities[index];
            if (!Number.isSafeInteger(stayAmountMinor) || stayAmountMinor < 0)
                throw new ApiError(502, "The hotel supplier returned an invalid stay rate.");
            return {
                slot: index + 1,
                roomId: room.roomId,
                roomTypeId: room.roomTypeId,
                ratePlanId: room.ratePlanId,
                quantity: quantities[index],
                name: room.name,
                ratePlan: room.ratePlan || room.meal || room.name,
                meal: room.meal || "",
                sellUnit: room.sellUnit,
                paymentPolicy: room.paymentPolicy || "",
                cancellation: room.cancellation || "",
                refundable: Boolean(room.refundable),
                freeCancellationUntil: room.freeCancellationUntil || null,
                taxesIncluded: room.taxesIncluded,
                providerReference: room.providerReference || null,
                currencyConversion: room.currencyConversion || null,
                stayAmountMinor,
                stayAmount: money(stayAmountMinor, currency),
            };
        });
        const subtotal = lineItems.reduce((sum, item) => sum + item.stayAmountMinor, 0);
        if (!Number.isSafeInteger(subtotal))
            throw new ApiError(502, "The hotel supplier returned an invalid stay total.");
        const calculation = await this.calculatePricing({
            productType: "hotel",
            baseAmountMinor: subtotal,
            currency,
            paymentProvider: "razorpay",
            agencyId: actor.agencyId || null,
        });
        return {
            hotel,
            search,
            lineItems,
            price: {
                subtotal,
                convenienceFee: calculation.finalPayableMinor - subtotal,
                total: calculation.finalPayableMinor,
                currency,
                pricingConfigSnapshot: calculation.pricingConfigSnapshot,
            },
            display: {
                subtotal: money(subtotal, currency),
                convenienceFee: money(calculation.finalPayableMinor - subtotal, currency),
                total: money(calculation.finalPayableMinor, currency),
            },
        };
    }

    async createEnquiry({ searchId, hotelId, roomIds, roomId, expectedTotal }, actor) {
        const userId = idFor(actor);
        if (!userId) throw new ApiError(401, "Please sign in to create an enquiry.");
        const search = await this.requireSearch(searchId);
        const selectedIds = roomIds || (roomId ? Array(search.input.rooms).fill(roomId) : []);
        const quote = await this.quoteRooms({ searchId, hotelId, roomIds: selectedIds }, actor);
        const { hotel, lineItems, price } = quote;
        if (expectedTotal !== price.total)
            throw new ApiError(
                409,
                "The hotel price has changed. Refresh the room rates and review the new total.",
            );
        const roomSignature = JSON.stringify([...selectedIds].sort());
        const existing = await ContactLead.findOne({
            claimedBy: userId,
            journeyType: "hotel",
            "customizationSnapshot.searchId": searchId,
            "customizationSnapshot.hotelId": hotelId,
            "customizationSnapshot.roomSignature": roomSignature,
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
                room: lineItems
                    .map(
                        (item) =>
                            `${item.slot}. ${item.quantity > 1 ? `${item.quantity} ${item.sellUnit}s × ` : ""}${item.name} (${item.ratePlan})`,
                    )
                    .join("; "),
                meals: [...new Set(lineItems.map((item) => item.meal).filter(Boolean))].join("; "),
                cancellation: [
                    ...new Set(
                        selectedIds
                            .map(
                                (id) =>
                                    hotel.rooms.find((item) => item.roomId === id)?.cancellation,
                            )
                            .filter(Boolean),
                    ),
                ].join("; "),
                stayChargeSummary: quote.display.subtotal,
                convenienceFeeSummary: quote.display.convenienceFee,
                priceSummary: quote.display.total,
            },
            customizationSnapshot: {
                type: "HOTEL",
                travellers: search.input.guests,
                rooms: search.input.rooms,
                currency: price.currency,
                searchId,
                hotelId,
                roomId: selectedIds[0],
                roomIds: selectedIds,
                roomSignature,
                roomSelections: lineItems,
                searchInput: search.input,
                searchUrl,
                hotel: {
                    hotelId: hotel.hotelId,
                    name: hotel.name,
                    address: hotel.address,
                },
                room: {
                    roomId: selectedIds[0],
                    roomTypeId: lineItems[0].roomTypeId,
                    ratePlanId: lineItems[0].ratePlanId,
                    name: lineItems[0].name,
                    ratePlan: lineItems[0].ratePlan,
                    sellUnit: lineItems[0].sellUnit,
                    currency: price.currency,
                },
                price,
                requiresPassport: false,
            },
        });
        publishToUser(String(userId), REALTIME_EVENTS.ENQUIRY_CREATED, enquiryDto(lead)).catch(
            () => {},
        );
        return { targetPath: `/?tab=bookings&enquiry=${lead.enquiryRef}` };
    }
}
