import mongoose from "mongoose";
import ApiError from "../../../shared/errors/ApiError.js";
import Tour from "../../tours/models/Tour.js";
import PartnerAgency from "../../auth/models/PartnerAgency.js";
import BookingQuote from "../models/BookingQuote.js";
import Coupon from "../models/Coupon.js";
import TaxRule from "../models/TaxRule.js";
import PlatformPricingConfig from "../models/PlatformPricingConfig.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import { calculateBookingPrice } from "./BookingPricingService.js";

const activeDateQuery = (now) => ({ active: true, $and: [{ $or: [{ effectiveFrom: null }, { effectiveFrom: { $lte: now } }] }, { $or: [{ effectiveUntil: null }, { effectiveUntil: { $gte: now } }] }] });
const id = (value) => String(typeof value === "object" ? value?._id || value?.id : value || "");
const optionKey = (value) => String(value || "").trim().toLowerCase();
const findByIdOrName = (values, value) => {
  const selected = typeof value === "object" ? value?._id || value?.id || value?.value || value?.title || value?.label : value;
  const key = optionKey(selected);
  return (values || []).find((x) => [id(x), x.title, x.value, x.label, x.name].some((candidate) => optionKey(candidate) === key));
};

// Compatibility adapter for tours that still rely on the discovery API's
// generated room choices. Prices are derived on the server from the persisted
// tour base price and should be backfilled to explicit pricing objects later.
const legacyFallbackRooms = (tour) => {
  const basePrice = Number(tour?.price?.min || 0);
  const comfort = Math.max(1500, Math.round(basePrice * 0.3 / 500) * 500);
  const premium = Math.max(3500, Math.round(basePrice * 0.65 / 500) * 500);
  return [
    { value: "Standard included stay", title: "Standard included stay", price: 0, pricing: { unit: "PER_BOOKING", amountMinor: 0, currency: "INR" } },
    { value: "Comfort hotel upgrade", title: "Comfort hotel upgrade", price: comfort, pricing: { unit: "PER_BOOKING", amountMinor: comfort * 100, currency: "INR" } },
    { value: "Premium hotel upgrade", title: "Premium hotel upgrade", price: premium, pricing: { unit: "PER_BOOKING", amountMinor: premium * 100, currency: "INR" } },
  ];
};

async function resolveCoupon(code, { userId, tour, bookingValueMinor }) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() }).lean();
  const now = new Date();
  if (!coupon || !coupon.active) throw new ApiError(400, "Coupon is inactive or invalid");
  if (coupon.validFrom && coupon.validFrom > now || coupon.validUntil && coupon.validUntil < now) throw new ApiError(400, "Coupon is expired or not active yet");
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) throw new ApiError(400, "Coupon usage limit reached");
  if (coupon.minimumBookingValueMinor > bookingValueMinor) throw new ApiError(400, "Coupon minimum booking value is not met");
  if (coupon.eligibleTours?.length && !coupon.eligibleTours.some((x) => id(x) === id(tour._id))) throw new ApiError(400, "Coupon is not valid for this tour");
  if (coupon.eligibleAgencies?.length && !coupon.eligibleAgencies.some((x) => id(x) === id(tour.agencyId))) throw new ApiError(400, "Coupon is not valid for this agency");
  // Per-user counters require a redemption record; reject only when configured
  // after quote consumption is introduced, never trust a frontend count.
  void userId;
  return coupon;
}

export async function createBookingQuote({ userId = null, guestSessionId = "", input }) {
  if (!userId && !guestSessionId) throw new ApiError(400, "Guest session is required");
  const tourRef = input.tourId || input.tourRef;
  const tour = mongoose.Types.ObjectId.isValid(String(tourRef || ""))
    ? await Tour.findById(tourRef)
    : await Tour.findOne({ slug: String(tourRef || "").trim().toLowerCase() });
  if (!tour) throw new ApiError(404, "Tour not found");
  if (tour.status && !["published", "active", "listed"].includes(String(tour.status).toLowerCase())) throw new ApiError(409, "Tour is not bookable");
  const travellers = Array.isArray(input.travellers) && input.travellers.length ? input.travellers : [
    ...Array.from({ length: Math.max(1, Number(input.adults || 1)) }, () => ({ type: "ADULT" })),
    ...Array.from({ length: Math.max(0, Number(input.children || 0)) }, () => ({ type: "CHILD" })),
    ...Array.from({ length: Math.max(0, Number(input.infants || 0)) }, () => ({ type: "INFANT" })),
  ];
  const flightInventoryManaged = Boolean(tour.flights?.included && tour.flights?.inventoryManaged);
  const availableSeats = tour.availability?.seatsAvailable;
  if (flightInventoryManaged && availableSeats != null && travellers.length > Number(availableSeats)) {
    throw new ApiError(409, `Only ${availableSeats} flight seat${Number(availableSeats) === 1 ? " is" : "s are"} available for this departure`);
  }
  // Existing tours may not have hotelOptions yet. Resolve the shared room set
  // as a compatibility source, never a client price source.
  const defaultRoomOptions = await masterDataService.getOptionSets(["trevista.defaultRoomOptions"]);
  const roomChoices = [
    ...(Array.isArray(tour.hotelOptions) ? tour.hotelOptions : []),
    ...(defaultRoomOptions["trevista.defaultRoomOptions"] || []),
    ...legacyFallbackRooms(tour),
  ].filter((option, index, all) => all.findIndex((candidate) => optionKey(candidate._id || candidate.id || candidate.value || candidate.title) === optionKey(option._id || option.id || option.value || option.title)) === index);
  const hotel = input.hotelOptionId || input.roomType ? findByIdOrName(roomChoices, input.hotelOptionId || input.roomType) : null;
  if ((input.hotelOptionId || input.roomType) && (!hotel || hotel.active === false)) {
    throw new ApiError(400, `Selected hotel option '${String(input.hotelOptionId || input.roomType)}' is unavailable; refresh the available options`);
  }
  const transportOptions = Array.isArray(tour.transportOptions) && tour.transportOptions.length
    ? tour.transportOptions : (await masterDataService.getOptionSets(["trevista.transportOptions"]))["trevista.transportOptions"] || [];
  const transport = input.transportOptionId || input.transport ? findByIdOrName(transportOptions, input.transportOptionId || input.transport) : null;
  if (input.transportOptionId && (!transport || transport.active === false)) throw new ApiError(400, "Selected transport option is unavailable");
  const requestedAddons = input.selectedAddonIds || input.addonIds || input.addons || [];
  const addons = requestedAddons.map((value) => findByIdOrName(tour.extras, value)).filter(Boolean);
  if (addons.length !== requestedAddons.length || addons.some((x) => x.active === false)) throw new ApiError(400, "One or more selected add-ons are unavailable");
  const [agency, platform, taxRules] = await Promise.all([
    tour.agencyId ? PartnerAgency.findById(tour.agencyId).lean() : null,
    PlatformPricingConfig.findOne({ key: "default" }).lean(), TaxRule.find(activeDateQuery(new Date())).lean(),
  ]);
  if (agency && !["approved", "active"].includes(agency.status)) throw new ApiError(409, "This agency is not active");
  const selections = { travellers, startDate: input.startDate, endDate: input.endDate, rooms: input.rooms, hotelOptionId: id(hotel), transportOptionId: id(transport), addonIds: addons.map((x) => id(x)), departureId: input.departureId || "" };
  let pricing = calculateBookingPrice({ tour, selections, options: { hotel, transport, addons }, configs: { agency, platform, taxRules } });
  const coupon = await resolveCoupon(input.couponCode, { userId, tour, bookingValueMinor: pricing.subtotalMinor });
  if (coupon) pricing = calculateBookingPrice({ tour, selections, options: { hotel, transport, addons }, configs: { agency, platform, taxRules, coupon } });
  pricing.availability = {
    inventoryManaged: flightInventoryManaged,
    seatsAvailable: flightInventoryManaged ? availableSeats : null,
    canBook: !flightInventoryManaged || availableSeats == null || travellers.length <= Number(availableSeats),
  };
  const ownerQuery = userId ? { userId } : { userId: null, guestSessionId };
  await BookingQuote.updateMany(
    { quoteType: "BOOKING_V2", ...ownerQuery, tourId: tour._id, status: "ACTIVE" },
    { $set: { status: "INVALIDATED" } },
  );
  const quote = await BookingQuote.create({ quoteType: "BOOKING_V2", status: "ACTIVE", userId, guestSessionId: userId ? "" : guestSessionId, tourId: tour._id, agencyId: tour.agencyId, departureId: selections.departureId, selections, pricing, expiresAt: new Date(Date.now() + Number(process.env.BOOKING_QUOTE_TTL_MINUTES || 20) * 60000) });
  return quote;
}

export async function consumeQuote({ quoteId, userId, guestSessionId = "" }) {
  const quote = await BookingQuote.findOne({ _id: quoteId, quoteType: "BOOKING_V2", status: "ACTIVE", expiresAt: { $gt: new Date() }, $or: [{ userId }, ...(guestSessionId ? [{ userId: null, guestSessionId }] : [])] });
  if (!quote) throw new ApiError(409, "Quote is invalid, expired, or already used");
  quote.status = "CONSUMED"; quote.consumedAt = new Date(); await quote.save(); return quote;
}

export const quoteDto = (quote) => ({ quoteId: String(quote._id), quoteNumber: quote.quoteNumber, currency: quote.pricing.currency, moneyUnit: "PAISE", items: quote.pricing.items, tourSubtotalMinor: quote.pricing.tourSubtotalMinor, addonsSubtotalMinor: quote.pricing.addonsSubtotalMinor, subtotalMinor: quote.pricing.subtotalMinor, platformFee: quote.pricing.platformFee, agencyFee: quote.pricing.agencyFee?.chargingMode === "CUSTOMER_FEE" ? quote.pricing.agencyFee : { amountMinor: 0 }, discount: quote.pricing.discount, taxes: quote.pricing.taxes, taxAmountMinor: quote.pricing.taxAmountMinor, paymentFee: quote.pricing.customerGatewayFee, finalPayableMinor: quote.pricing.finalPayableMinor, availability: quote.pricing.availability, expiresAt: quote.expiresAt });
