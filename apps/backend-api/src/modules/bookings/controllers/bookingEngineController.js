import mongoose from "mongoose";
import asyncHandler from "../../../shared/middleware/asyncHandler.js";
import ApiError from "../../../shared/errors/ApiError.js";
import Booking from "../models/Booking.js";
import Tour from "../../tours/models/Tour.js";
import TrevioTrip from "../../trevio/models/TrevioTrip.js";
import User from "../../auth/models/User.js";
import PartnerAgency from "../../auth/models/PartnerAgency.js";
import BookingService from "../services/BookingService.js";
import QuoteService from "../services/QuoteService.js";
import PaymentService from "../services/PaymentService.js";
import TravellerService from "../services/TravellerService.js";
import BookingTimelineService from "../services/BookingTimelineService.js";
import AuditService from "../services/AuditService.js";
import MessageService from "../services/MessageService.js";
import PaymentSettings from "../models/PaymentSettings.js";
import { calculateTrevistaPricing } from "../services/trevistaPricingService.js";
import { createBookingQuote, consumeQuote, quoteDto } from "../services/BookingQuoteService.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import { BOOKING_STATUS, PAYMENT_STATUS, BOOKING_FLOW } from "../../../constants/enums.js";
import { sendBookingConfirmation, sendPaymentSuccess } from "../../../services/email.service.js";
import config from "../../../config/index.js";

function sendSuccess(res, data, message = "OK") {
  return res.json({ status: "success", message, componentData: { data } });
}

function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({ status: "error", message, componentData: { data: null } });
}

function normalizeObjectId(value) {
  if (!value) return null;
  const raw = typeof value === "object" ? (value._id || value.id) : value;
  return mongoose.Types.ObjectId.isValid(String(raw)) ? String(raw) : null;
}

function cleanString(value) {
  return String(value || "").trim();
}

function authInfoFromReq(req) {
  if (!req?.user) return { userId: null, userRole: null, authUser: null };
  const payload = req.user;
  return {
    userId: payload.sub || payload.id || payload._id || payload.userId || null,
    userRole: payload.role || payload.userRole || null,
    authUser: payload,
  };
}

function isPrivileged(authUser, userRole) {
  const roles = new Set();
  const add = (v) => { if (v) String(v).split(",").map((p) => p.trim().toLowerCase()).filter(Boolean).forEach((p) => roles.add(p)); };
  add(userRole);
  add(authUser?.role);
  if (Array.isArray(authUser?.roles)) authUser.roles.forEach(add);
  return [...roles].some((r) => ["admin", "agent", "super_admin", "support", "operations"].includes(r));
}

function actorFromReq(req) {
  const { userId, userRole, authUser } = authInfoFromReq(req);
  return {
    id: normalizeObjectId(userId),
    role: userRole,
    type: isPrivileged(authUser, userRole) ? "agent" : "customer",
    privileged: isPrivileged(authUser, userRole),
    authUser,
  };
}

const recordBookingAudit = (req, booking, action, before = null) => AuditService.record({
  bookingId: booking._id,
  action,
  before,
  after: booking.toObject(),
  actor: actorFromReq(req),
  reqMeta: { ip: req.ip || "", userAgent: req.headers?.["user-agent"] || "", correlationId: req.headers?.["x-request-id"] || "" },
});

function canAccessBooking(req, booking, { requireAgencyManager = false } = {}) {
  const actorId = String(req.user?.sub || req.user?.id || "");
  const isMaster = req.user?.role === "admin" && req.user?.adminLevel === "master";
  if (isMaster) return true;
  if (req.user?.role === "agent") {
    if (!req.user?.agencyId || String(booking.agencyId || "") !== String(req.user.agencyId)) return false;
    if (req.user.agencyRole === "partner_admin") return true;
    if (requireAgencyManager) return false;
    return String(booking.assignedAgent || "") === actorId;
  }
  return !requireAgencyManager && String(booking.user || "") === actorId;
}

function assertBookingAccess(req, booking, options) {
  if (!canAccessBooking(req, booking, options)) throw new ApiError(403, "Not authorized to access this booking");
}

async function resolveBookingAgent(tour) {
  if (tour?.ownerAgent) return tour.ownerAgent;
  if (tour?.partnerAgencyRef) {
    const partnerAgent = await User.findOne({
      role: "agent",
      partnerAgencyRef: tour.partnerAgencyRef,
      agentApprovalStatus: "approved",
    }).select("_id");
    if (partnerAgent?._id) return partnerAgent._id;
  }
  const adminUser = await User.findOne({ role: "admin", adminLevel: "master" }).select("_id");
  return adminUser?._id || null;
}

async function ownershipSnapshot(entity) {
  if (!entity?.agencyId) return {};
  const [agency, agent] = await Promise.all([
    mongoose.model("PartnerAgency").findById(entity.agencyId).select("agencyName partnerAgencyRef logo contactEmail contactPhone").lean(),
    entity.ownerAgent ? User.findById(entity.ownerAgent).select("name email phone agentRef").lean() : null,
  ]);
  return { agencyId: entity.agencyId, agencySnapshot: agency ? { id: agency._id, name: agency.agencyName, ref: agency.partnerAgencyRef, logo: agency.logo, email: agency.contactEmail, phone: agency.contactPhone } : null, assignedAgent: agent?._id || null, assignedAgentRef: agent?.agentRef || "", assignedAgentSnapshot: agent ? { id: agent._id, name: agent.name, email: agent.email, phone: agent.phone, ref: agent.agentRef } : null };
}

async function agencyFeeSettings(entity) {
  const defaults = { agentPercent: 2, servicePercent: 2, platformPercent: 2 };
  if (!entity?.agencyId) return defaults;
  const agency = await PartnerAgency.findById(entity.agencyId).select("settings.bookingFees").lean();
  const fees = agency?.settings?.bookingFees || {};
  return {
    agentPercent: Number(fees.agentPercent ?? defaults.agentPercent),
    servicePercent: Number(fees.servicePercent ?? defaults.servicePercent),
    platformPercent: Number(fees.platformPercent ?? defaults.platformPercent),
  };
}

function computeTokenAmount(booking, product) {
  if (product === BOOKING_FLOW.TREVIO) {
    return booking.tokenAmount
      || Math.round(Number(booking.paymentSummary?.total || booking.priceSnapshot?.total || 0) * 0.15);
  }
  return 0;
}

function buildFlowSteps(product) {
  if (product === BOOKING_FLOW.TREVIO) {
    return ["trip", "travellers", "review", "checkout"];
  }
  return ["trip", "travellers", "review", "checkout"];
}

function buildStatusTimeline(status, product) {
  const allSteps = product === BOOKING_FLOW.TREVIO
    ? [
        { key: "booked", label: "Booking Created" },
        { key: "payment_pending", label: "Awaiting Token Payment" },
        { key: "token_verification", label: "Token Verification" },
        { key: "confirmed", label: "Booking Confirmed" },
        { key: "balance_pending", label: "Balance Pending" },
        { key: "completed", label: "Fully Paid" },
      ]
    : [
        { key: "booked", label: "Booking Submitted" },
        { key: "quote_requested", label: "Quote Requested" },
        { key: "quote_sent", label: "Quote Sent" },
        { key: "accepted", label: "Quote Accepted" },
        { key: "payment_pending", label: "Payment Pending" },
        { key: "paid", label: "Paid" },
        { key: "confirmed", label: "Confirmed" },
        { key: "completed", label: "Tour Completed" },
      ];

  const statusToStep = product === BOOKING_FLOW.TREVIO
    ? {
        DRAFT: "booked",
        QUOTE_REQUESTED: "booked",
        AWAITING_TOKEN_PAYMENT: "payment_pending",
        PAYMENT_PENDING: "payment_pending",
        CONFIRMED: "confirmed",
        PARTIALLY_PAID: "token_paid",
        PAID: "token_paid",
        COMPLETED: "completed",
        CANCELLED: "booked",
      }
    : {
        DRAFT: "booked",
        QUOTE_REQUESTED: "quote_requested",
        UNDER_REVIEW: "quote_requested",
        QUOTE_READY: "quote_sent",
        QUOTE_SENT: "quote_sent",
        CUSTOMER_ACCEPTED: "accepted",
        PAYMENT_PENDING: "payment_pending",
        PARTIALLY_PAID: "paid",
        PAID: "paid",
        CONFIRMED: "confirmed",
        TICKETING: "confirmed",
        TICKETED: "confirmed",
        TRAVEL_READY: "confirmed",
        COMPLETED: "completed",
        CANCELLED: "booked",
      };

  const currentStepKey = statusToStep[status] || "booked";
  const currentIndex = allSteps.findIndex((s) => s.key === currentStepKey);

  return allSteps.map((step, idx) => ({
    ...step,
    status: idx < currentIndex ? "completed" : idx === currentIndex ? "current" : "pending",
  }));
}

// Create/submit are command endpoints. The booking journey only needs enough
// data to continue or render its confirmation, not a hydrated booking record.
const bookingCommandResponse = (booking, entity = null) => ({
  id: String(booking._id),
  bookingRef: booking.bookingRef,
  product: booking.product,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  tokenAmount: Number(booking.tokenAmount || 0),
  price: {
    total: Number(booking.priceSnapshot?.total || 0),
    currency: booking.priceSnapshot?.currency || "INR",
  },
  productTitle: entity?.title || entity?.name || "",
});

const bookingLink = (booking) => `${String(config.SHELL_URL || "").replace(/\/$/, "")}/bookings/${booking._id}`;
async function emailBooking(booking, payment = null) {
  const to = booking.primaryContact?.email;
  if (!to) return;
  const entity = booking.trip || booking.tour;
  const common = { to, customerName: booking.primaryContact?.name, bookingId: booking.bookingRef, tripName: entity?.title || "Trip", amount: payment?.amount || booking.paymentSummary?.total, bookingUrl: bookingLink(booking), agencyName: booking.agencySnapshot?.name, agentName: booking.assignedAgentSnapshot?.name, agentEmail: booking.assignedAgentSnapshot?.email, agentPhone: booking.assignedAgentSnapshot?.phone };
  if (payment) await sendPaymentSuccess({ ...common, transactionId: payment.transactionId, paidAt: new Date().toLocaleString("en-IN") });
  else await sendBookingConfirmation({ ...common, travelDates: `${new Date(booking.travelWindow.startDate).toLocaleDateString("en-IN")} – ${new Date(booking.travelWindow.endDate).toLocaleDateString("en-IN")}` });
}

async function resolveProductEntity(product, ref) {
  if (!ref) return null;
  const idQuery = mongoose.Types.ObjectId.isValid(ref) ? [{ _id: ref }] : [];
  if (product === BOOKING_FLOW.TREVIO) {
    return TrevioTrip.findOne({ $or: [...idQuery, { slug: ref }] });
  }
  const titleCandidate = String(ref).replace(/-/g, " ").trim();
  const escapedTitle = titleCandidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Tour.findOne({
    $or: [
      ...idQuery,
      { slug: ref },
      { title: new RegExp(`^${escapedTitle}$`, "i") },
    ],
  });
}

function getPrefExtraPrice(prefArray, selectedValue) {
  if (!Array.isArray(prefArray) || !selectedValue) return 0;
  const match = prefArray.find((opt) => opt.value === selectedValue);
  return match?.extraPrice || 0;
}

function buildPriceSnapshotForProduct(product, entity, body = {}, masterOptions = {}) {
  const travellers = Array.isArray(body.travellers) ? body.travellers : [];
  const guestsCount = Math.max(1, Number(body.adults || 1) + Number(body.children || 0) + Number(body.infants || 0));
  const preferences = body.preferences || {};
  const roomType = String(body.roomType || preferences.roomType || "");
  const addons = Array.isArray(body.addons) ? body.addons : [];

  if (product === BOOKING_FLOW.TREVIO) {
    const basePricePerPerson = entity?.price?.amount || 0;
    const prefs = entity?.preferences || {};

    const roomTypeExtra = getPrefExtraPrice(prefs.roomTypes, roomType);

    const perTravellerExtras = travellers.map((t) => {
      const meal = getPrefExtraPrice(prefs.mealPreferences, t.mealPreference);
      const pkg = getPrefExtraPrice(prefs.packageTypes, t.packageType);
      const drink = getPrefExtraPrice(prefs.drinkTypes, t.drinkType);
      return { meal, pkg, drink, total: meal + pkg + drink };
    });
    const totalTravellerExtras = perTravellerExtras.reduce((sum, t) => sum + t.total, 0);

    const baseTripTotal = basePricePerPerson * guestsCount;
    const totalPrefExtras = roomTypeExtra + totalTravellerExtras;
    const total = baseTripTotal + totalPrefExtras;
    const tokenAmount = Math.round(basePricePerPerson * 0.15) * guestsCount;

    return {
      min: total,
      max: total,
      currency: entity?.price?.currency || "INR",
      isFinal: true,
      source: "trip_price",
      matchedSeason: null,
      note: "",
      perPerson: basePricePerPerson,
      basePricePerPerson,
      roomTypeExtra,
      perTravellerExtras,
      totalTravellerExtras,
      totalPrefExtras,
      baseTripTotal,
      total,
      tokenAmount,
    };
  }

  if (product === BOOKING_FLOW.TREVISTA) {
    const calc = calculateTrevistaPricing(entity, {
      adults: body.adults,
      children: body.children,
      infants: body.infants,
      startDate: body.startDate,
      roomType,
      transport: String(preferences.transport || body.transport || ""),
      addons,
    }, masterOptions);
    const { pricing } = calc;
    return {
      min: pricing.baseTripTotal,
      max: pricing.total,
      currency: pricing.currency,
      isFinal: false,
      source: "engine_price",
      matchedSeason: null,
      note: "Estimated price from booking journey",
      perPerson: pricing.perPerson,
      baseTripTotal: pricing.baseTripTotal,
      roomTypeExtra: pricing.roomTypeExtra,
      transportExtra: pricing.transportExtra,
      addonAmount: pricing.addonAmount,
      agentFee: pricing.agentFee,
      serviceFee: pricing.serviceFee,
      platformFee: pricing.platformFee,
      total: pricing.total,
    };
  }

  return Booking.buildPriceSnapshot(entity, new Date(), guestsCount);
}

// ────────────────────────────────────────────
// CREATE BOOKING
// ────────────────────────────────────────────
export const createBooking = asyncHandler(async (req, res) => {
  const {
    tourRef,
    tripRef,
    product = BOOKING_FLOW.TREVISTA,
    startDate,
    endDate,
    adults = 1,
    children = 0,
    infants = 0,
    travellers = [],
    contact,
    preferences = {},
    roomType = "",
    pickupCity = "",
    specialRequirements = "",
    idempotencyKey = "",
    quoteId = "",
  } = req.body;

  const { userId } = authInfoFromReq(req);
  if (!userId) throw new ApiError(401, "Authentication required");

  const ref = product === BOOKING_FLOW.TREVIO ? (tripRef || tourRef) : (tourRef || tripRef);
  if (!ref) throw new ApiError(400, "Tour or trip reference is required");
  if (!startDate || !endDate) throw new ApiError(400, "Travel dates are required");

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    throw new ApiError(400, "Invalid travel dates");
  }

  const entity = await resolveProductEntity(product, ref);
  if (!entity) throw new ApiError(404, product === BOOKING_FLOW.TREVIO ? "Trip not found" : "Tour not found");

  const guestsCount = Math.max(1, Number(adults) + Number(children) + Number(infants));

  if (idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey, user: userId });
    if (existing) return sendSuccess(res, await BookingService.hydrate(existing), "Booking already exists");
  }

  let v2Quote = null;
  if (product === BOOKING_FLOW.TREVISTA) {
    if (!quoteId) throw new ApiError(400, "A current booking quote is required");
    v2Quote = await consumeQuote({ quoteId, userId, guestSessionId: cleanString(req.body.guestSessionId) });
    if (String(v2Quote.tourId) !== String(entity._id)) throw new ApiError(400, "Quote does not belong to this tour");
  }
  const pricingOptionSets = product === BOOKING_FLOW.TREVISTA
    ? await masterDataService.getOptionSets(["trevista.defaultRoomOptions", "trevista.transportOptions"])
    : {};
  if (product === BOOKING_FLOW.TREVISTA) pricingOptionSets.fees = await agencyFeeSettings(entity);
  const priceSnapshot = v2Quote ? {
    currency: v2Quote.pricing.currency,
    total: Math.round(v2Quote.pricing.finalPayableMinor / 100),
    perPerson: Math.round(v2Quote.pricing.tourSubtotalMinor / Math.max(1, guestsCount) / 100),
    isFinal: true, source: "booking_quote_v2", note: "Immutable V2 quote snapshot",
  } : buildPriceSnapshotForProduct(product, entity, req.body, {
    roomOptions: pricingOptionSets["trevista.defaultRoomOptions"] || [],
    transportOptions: pricingOptionSets["trevista.transportOptions"] || [],
  });

  const bookingData = {
    user: userId,
    product,
    travelWindow: { startDate: start, endDate: end },
    tripSelection: {
      adultCount: Number(adults),
      childCount: Number(children),
      infantCount: Number(infants),
      roomType,
      pickupCity: pickupCity || preferences.pickupCity || "",
      specialRequirements: specialRequirements || preferences.notes || "",
    },
    primaryContact: {
      name: contact?.name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
    },
    tripPreferences: {
      mealPreference: preferences.mealPreference || "",
      bedType: preferences.bedPreference || "",
      transport: preferences.transport || "",
      addFlights: preferences.addFlights || "",
      specialRequests: preferences.notes || preferences.specialRequests || "",
      airportTransferNeeded: preferences.airportTransferNeeded || false,
      roomSharingPreference: preferences.roomSharingPreference || "",
      extraActivities: preferences.extraActivities || [],
    },
    priceSnapshot,
    pricingVersion: v2Quote ? "V2" : "LEGACY",
    quoteId: v2Quote?._id || null,
    pricingSnapshot: v2Quote?.pricing || null,
    paymentSummary: {
      total: priceSnapshot.total,
      paid: 0,
      remaining: priceSnapshot.total,
      refunded: 0,
    },
    guestsCount,
    termsAccepted: true,
    idempotencyKey,
  };
  Object.assign(bookingData, await ownershipSnapshot(entity));

  if (product === BOOKING_FLOW.TREVIO) {
    bookingData.trip = entity._id;
    bookingData.tokenAmount = entity.price?.tokenAmount || priceSnapshot.tokenAmount || 0;
    bookingData.seatsReserved = 0;
    bookingData.paymentStatus = PAYMENT_STATUS.TOKEN_PENDING;
  } else {
    bookingData.tour = entity._id;
    bookingData.seatsReserved = 0;
    bookingData.paymentStatus = PAYMENT_STATUS.UNPAID;
  }

  let reservedSeats = 0;
  const hasManagedInventory = entity.availability?.seatsAvailable != null && (
    product === BOOKING_FLOW.TREVIO
    || (product === BOOKING_FLOW.TREVISTA && entity.flights?.included && entity.flights?.inventoryManaged)
  );

  if (hasManagedInventory) {
    const inventoryModel = product === BOOKING_FLOW.TREVIO ? TrevioTrip : Tour;
    const inventoryQuery = product === BOOKING_FLOW.TREVIO
      ? { _id: entity._id, status: "listed", isListed: true, "availability.seatsAvailable": { $gte: guestsCount } }
      : { _id: entity._id, status: "published", isPublished: { $ne: false }, "flights.included": true, "flights.inventoryManaged": true, "availability.seatsAvailable": { $gte: guestsCount } };
    const reservedTrip = await inventoryModel.findOneAndUpdate(
      inventoryQuery,
      { $inc: { "availability.seatsAvailable": -guestsCount } },
      { new: true },
    );
    if (!reservedTrip) {
      throw new ApiError(409, "The trip no longer has enough available seats");
    }
    reservedSeats = guestsCount;
    bookingData.seatsReserved = reservedSeats;
  }

  let booking;
  try {
    booking = await Booking.create(bookingData);
  } catch (error) {
    if (reservedSeats > 0) {
      const inventoryModel = product === BOOKING_FLOW.TREVIO ? TrevioTrip : Tour;
      await inventoryModel.findByIdAndUpdate(
        entity._id,
        { $inc: { "availability.seatsAvailable": reservedSeats } },
      );
    }
    throw error;
  }

  if (travellers.length > 0) {
    for (const t of travellers) {
      await TravellerService.add(booking._id, t);
    }
  }

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor: { id: userId, type: "customer" },
    action: "booking_created",
    metadata: {
      product,
      title: entity.title || entity.name,
      guestsCount,
      seatsReserved: reservedSeats,
      priceTotal: priceSnapshot.total,
    },
  });

  await recordBookingAudit(req, booking, "booking.create");

  return sendSuccess(res, bookingCommandResponse(booking, entity), "Booking created");
});

// ────────────────────────────────────────────
// TREVISTA PRICING
// ────────────────────────────────────────────
export const getTrevistaPricing = asyncHandler(async (req, res) => {
  const { tourRef } = req.body || {};
  if (!tourRef) throw new ApiError(400, "Tour reference is required");

  const entity = await resolveProductEntity(BOOKING_FLOW.TREVISTA, tourRef);
  if (!entity) throw new ApiError(404, "Tour not found");

  const optionSets = await masterDataService.getOptionSets(["trevista.defaultRoomOptions", "trevista.transportOptions"]);
  const fees = await agencyFeeSettings(entity);
  const calc = calculateTrevistaPricing(entity, req.body || {}, {
    roomOptions: optionSets["trevista.defaultRoomOptions"] || [],
    transportOptions: optionSets["trevista.transportOptions"] || [],
    fees,
  });
  return sendSuccess(res, calc, "Pricing calculated");
});

export const createV2Quote = asyncHandler(async (req, res) => {
  const { userId } = authInfoFromReq(req);
  const guestSessionId = cleanString(req.headers["x-guest-session-id"] || req.body?.guestSessionId);
  if (!userId && !/^[a-zA-Z0-9-]{16,100}$/.test(guestSessionId)) throw new ApiError(400, "A valid guest session is required");
  const quote = await createBookingQuote({ userId, guestSessionId, input: req.body || {} });
  return sendSuccess(res, quoteDto(quote), "Booking quote created");
});

// ────────────────────────────────────────────
// SUBMIT BOOKING
// ────────────────────────────────────────────
export const submitBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actor = actorFromReq(req);

  const booking = await Booking.findById(id)
    .populate("tour", "title slug city address distance period price photo photos cancellationPolicy")
    .populate("trip", "title slug location image price cancellationPolicy duration");
  if (!booking) throw new ApiError(404, "Booking not found");
  assertBookingAccess(req, booking);
  const before = booking.toObject();

  const product = booking.product || BOOKING_FLOW.TREVISTA;

  if (product === BOOKING_FLOW.TREVIO) {
    if (booking.status !== BOOKING_STATUS.DRAFT) {
      throw new ApiError(400, `Booking is in ${booking.status} state and cannot be submitted`);
    }
    booking.transitionStatus(BOOKING_STATUS.AWAITING_TOKEN_PAYMENT);
  } else {
    if (booking.status !== BOOKING_STATUS.DRAFT) {
      throw new ApiError(400, `Booking is in ${booking.status} state and cannot be submitted`);
    }
    booking.transitionStatus(BOOKING_STATUS.QUOTE_REQUESTED);

    const tourDoc = booking.tour ? await Tour.findById(booking.tour) : null;
    const agentId = await resolveBookingAgent(tourDoc);
    if (agentId) {
      booking.assignedAgent = agentId;
      const agent = await User.findById(agentId).select("name agentRef agencyRef partnerAgencyRef");
      if (agent) {
        booking.assignedAgentRef = agent.agentRef || "";
        booking.assignedAgencyRef = agent.agencyRef || "";
        booking.assignedPartnerAgencyRef = agent.partnerAgencyRef || "";
      }
    }

    const now = Date.now();
    const priority = booking.priority || "MEDIUM";
    const quoteHours = { LOW: 48, MEDIUM: 24, HIGH: 8, URGENT: 2 };
    const responseHours = { LOW: 24, MEDIUM: 8, HIGH: 2, URGENT: 1 };
    booking.responseDueAt = new Date(now + (responseHours[priority] || 8) * 3600000);
    booking.quoteDueAt = new Date(now + (quoteHours[priority] || 24) * 3600000);
    booking.followupAt = new Date(now + 86400000);
  }

  await booking.save();
  await recordBookingAudit(req, booking, "booking.submit", before);

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "booking_submitted",
    metadata: { product, newStatus: booking.status },
  });

  if (product === BOOKING_FLOW.TREVISTA) {
    await MessageService.send({
      bookingId: booking._id,
      senderType: "system",
      senderName: "System",
      content: `Booking submitted. Our team will prepare a quote for you shortly.`,
      messageType: "system",
    });
  } else {
    await MessageService.send({
      bookingId: booking._id,
      senderType: "system",
      senderName: "System",
      content: `Booking created. Please submit proof for the token amount of ₹${booking.tokenAmount || 0}.`,
      messageType: "system",
      metadata: { event: "booking_created", channels: ["app-shell"] },
    });
  }

  await emailBooking(booking).catch((error) => console.error("Booking confirmation email failed:", error.message));
  const entity = product === BOOKING_FLOW.TREVIO ? booking.trip : booking.tour;
  return sendSuccess(res, bookingCommandResponse(booking, entity), "Booking submitted");
});

// ────────────────────────────────────────────
// GET BOOKING STATUS
// ────────────────────────────────────────────
export const getBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userRole, authUser } = authInfoFromReq(req);
  const privileged = isPrivileged(authUser, userRole);

  const booking = await Booking.findById(id)
    .populate("tour", "title slug city address photo photos price period cancellationPolicy")
    .populate("trip", "title slug location image photos price cancellationPolicy duration")
    .populate("assignedAgent", "name email");

  if (!booking) throw new ApiError(404, "Booking not found");

  assertBookingAccess(req, booking);

  const hydrated = await BookingService.hydrate(booking);
  const product = booking.product || BOOKING_FLOW.TREVISTA;
  const timeline = buildStatusTimeline(booking.status, product);
  const unreadMessages = await MessageService.countUnread(id, privileged ? "agent" : "customer");

  const tokenAmount = computeTokenAmount(booking, product);
  const paymentConfiguration = product === BOOKING_FLOW.TREVIO
    ? await PaymentSettings.findOneAndUpdate(
        { key: "default", agencyId: booking.agencyId || null },
        { $setOnInsert: { key: "default", agencyId: booking.agencyId || null } },
        { new: true, upsert: true }
      ).lean()
    : null;

  return sendSuccess(res, {
    ...hydrated,
    product,
    timeline,
    flowSteps: buildFlowSteps(product),
    unreadMessages,
    tokenAmount,
    remainingAmount: booking.paymentSummary?.remaining || 0,
    bookingStatus: booking.status,
    paymentConfiguration,
    assignedAgent: booking.assignedAgent,
  });
});

// ────────────────────────────────────────────
// PAY TOKEN (Trevio)
// ────────────────────────────────────────────
export const payToken = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { provider = "razorpay" } = req.body;
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const actor = actorFromReq(req);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  assertBookingAccess(req, booking);
  if (String(booking.user) !== String(actor.id)) throw new ApiError(403, "Not authorized");
  const before = booking.toObject();

  const product = booking.product || BOOKING_FLOW.TREVISTA;
  if (product !== BOOKING_FLOW.TREVIO) {
    throw new ApiError(400, "Token payment is only available for trips");
  }

  const alreadyPaidStatuses = [BOOKING_STATUS.PARTIALLY_PAID, BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.TICKETING, BOOKING_STATUS.TICKETED, BOOKING_STATUS.TRAVEL_READY, BOOKING_STATUS.COMPLETED];
  if (alreadyPaidStatuses.includes(booking.status) || booking.paymentStatus === PAYMENT_STATUS.PARTIAL || booking.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ApiError(400, "Token already paid. Please check your bookings.");
  }

  const totalAmount = booking.paymentSummary?.total || booking.priceSnapshot?.total || 0;
  const tokenAmount = computeTokenAmount(booking, product);

  if (tokenAmount <= 0) throw new ApiError(400, "No token amount to pay");

  await PaymentService.record(booking, {
    amount: tokenAmount,
    provider,
    transactionId,
    type: "deposit",
  }, { id: actor.id, type: actor.type });

  const summary = await PaymentService.summarize(booking._id, totalAmount);
  booking.paymentSummary = summary;

  if (summary.paid >= totalAmount) {
    booking.transitionStatus(BOOKING_STATUS.PAID);
    booking.paymentStatus = PAYMENT_STATUS.PAID;
  } else if (summary.paid > 0) {
    booking.transitionStatus(BOOKING_STATUS.PARTIALLY_PAID);
    booking.paymentStatus = PAYMENT_STATUS.PARTIAL;
  }

  await booking.save();
  await recordBookingAudit(req, booking, "payment.token", before);

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "token_paid",
    metadata: { amount: tokenAmount, provider, transactionId, totalPaid: summary.paid },
  });

  await MessageService.send({
    bookingId: booking._id,
    senderType: "system",
    senderName: "System",
    content: `Token payment of ₹${tokenAmount} received. Booking confirmed.`,
    messageType: "system",
  });

  await booking.populate(["trip", "tour"]);
  await emailBooking(booking, { amount: tokenAmount, transactionId }).catch((error) => console.error("Payment email failed:", error.message));

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, { ...hydrated, tokenAmount, totalPaid: summary.paid }, "Token payment recorded");
});

// ────────────────────────────────────────────
// PAY FULL AMOUNT (Trevista)
// ────────────────────────────────────────────
export const payFullAmount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { provider = "razorpay", amount } = req.body;
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const actor = actorFromReq(req);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  assertBookingAccess(req, booking);
  if (String(booking.user) !== String(actor.id)) throw new ApiError(403, "Not authorized");
  const before = booking.toObject();

  const latestQuote = await QuoteService.latest(booking._id);
  const payAmount = amount || latestQuote?.finalAmount || booking.paymentSummary?.remaining || 0;

  if (payAmount <= 0) throw new ApiError(400, "No amount to pay");

  await PaymentService.record(booking, {
    amount: payAmount,
    provider,
    transactionId,
    type: booking.paymentSummary?.paid > 0 ? "remaining" : "partial",
  }, { id: actor.id, type: actor.type });

  const totalAmount = latestQuote?.finalAmount || booking.paymentSummary?.total || 0;
  const summary = await PaymentService.summarize(booking._id, totalAmount);
  booking.paymentSummary = summary;
  booking.priceSnapshot = { ...booking.priceSnapshot, total: totalAmount, isFinal: true };

  if (summary.paid >= totalAmount) {
    booking.transitionStatus(BOOKING_STATUS.PAID);
    booking.paymentStatus = PAYMENT_STATUS.PAID;
  } else {
    booking.transitionStatus(BOOKING_STATUS.PARTIALLY_PAID);
    booking.paymentStatus = PAYMENT_STATUS.PARTIAL;
  }

  await booking.save();
  await recordBookingAudit(req, booking, "payment.full", before);

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "payment_received",
    metadata: { amount: payAmount, provider, transactionId, totalPaid: summary.paid, remaining: summary.remaining },
  });

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, { ...hydrated, totalPaid: summary.paid, remaining: summary.remaining }, "Payment recorded");
});

// ────────────────────────────────────────────
// ACCEPT QUOTE
// ────────────────────────────────────────────
export const acceptQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actor = actorFromReq(req);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (String(booking.user) !== String(actor.id)) throw new ApiError(403, "Not authorized");
  if (!["QUOTE_SENT", "QUOTE_READY"].includes(booking.status)) {
    throw new ApiError(400, `Booking is in ${booking.status} state`);
  }

  const latestQuote = await QuoteService.latest(booking._id);
  if (latestQuote) {
    await QuoteService.markDecision(booking._id, latestQuote.version, "accept");
  }

  booking.transitionStatus(BOOKING_STATUS.CUSTOMER_ACCEPTED);
  booking.transitionStatus(BOOKING_STATUS.PAYMENT_PENDING);
  await booking.save();

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "quote_accepted",
    metadata: { quoteVersion: latestQuote?.version, finalAmount: latestQuote?.finalAmount },
  });

  await MessageService.send({
    bookingId: booking._id,
    senderType: "system",
    senderName: "System",
    content: `Quote accepted. Please proceed with payment of ₹${latestQuote?.finalAmount || booking.paymentSummary?.total}.`,
    messageType: "system",
  });

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, hydrated, "Quote accepted");
});

// ────────────────────────────────────────────
// REJECT QUOTE
// ────────────────────────────────────────────
export const rejectQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;
  const actor = actorFromReq(req);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (String(booking.user) !== String(actor.id)) throw new ApiError(403, "Not authorized");
  if (!["QUOTE_SENT", "QUOTE_READY"].includes(booking.status)) {
    throw new ApiError(400, `Booking is in ${booking.status} state`);
  }

  const latestQuote = await QuoteService.latest(booking._id);
  if (latestQuote) {
    await QuoteService.markDecision(booking._id, latestQuote.version, "reject");
  }

  booking.transitionStatus(BOOKING_STATUS.CUSTOMER_REJECTED);
  await booking.save();

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "quote_rejected",
    metadata: { reason, quoteVersion: latestQuote?.version },
  });

  await MessageService.send({
    bookingId: booking._id,
    senderType: "system",
    senderName: "System",
    content: `Quote rejected${reason ? `: ${reason}` : ""}. Our team will follow up.`,
    messageType: "system",
  });

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, hydrated, "Quote rejected");
});

// ────────────────────────────────────────────
// MY BOOKINGS (list user's bookings)
// ────────────────────────────────────────────
export const getMyBookings = asyncHandler(async (req, res) => {
  const { userId } = authInfoFromReq(req);
  if (!userId) throw new ApiError(401, "Authentication required");

  const { limit = 20, skip = 0, status, product, sort = "-createdAt" } = req.query;
  const query = { user: userId, deletedAt: null };
  if (status) query.status = Booking.normalizeStatus(status);
  if (product) query.product = product;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("tour", "title slug city photo photos")
      .populate("trip", "title slug location image photos duration")
      .sort(sort).skip(Number(skip)).limit(Math.min(Number(limit), 50)),
    Booking.countDocuments(query),
  ]);

  const hydrated = await BookingService.hydrateMany(bookings, { includeDeep: false });

  const enriched = hydrated.map((b) => ({
    ...b,
    timeline: buildStatusTimeline(b.status, b.product || BOOKING_FLOW.TREVISTA),
    tokenAmount: b.tokenAmount || 0,
  }));

  return sendSuccess(res, { bookings: enriched, total, hasMore: Number(skip) + bookings.length < total });
});

// ────────────────────────────────────────────
// ADMIN: CREATE QUOTE FOR BOOKING
// ────────────────────────────────────────────
export const createQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, basePrice, hotelPrice, flightPrice, visaFee, taxes, serviceFee, discount, notes, finalAmount } = req.body;
  const actor = actorFromReq(req);

  if (!actor.privileged) throw new ApiError(403, "Admin or agent access required");

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  assertBookingAccess(req, booking);
  const before = booking.toObject();

  if (booking.status !== BOOKING_STATUS.QUOTE_REQUESTED && booking.status !== BOOKING_STATUS.UNDER_REVIEW) {
    throw new ApiError(400, `Cannot create quote in ${booking.status} state`);
  }

  const quote = await QuoteService.create(booking, {
    items, basePrice, hotelPrice, flightPrice, visaFee, taxes, serviceFee, discount, notes, finalAmount,
  }, { id: actor.id });

  booking.latestQuoteId = quote._id;
  booking.currentQuoteVersion = quote.version;

  booking.transitionStatus(BOOKING_STATUS.QUOTE_READY);
  booking.transitionStatus(BOOKING_STATUS.QUOTE_SENT);
  await booking.save();
  await recordBookingAudit(req, booking, "quote.create", before);

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "quote_created",
    metadata: { quoteVersion: quote.version, finalAmount: quote.finalAmount },
  });

  await MessageService.send({
    bookingId: booking._id,
    senderType: "system",
    senderName: "System",
    content: `A new quote of ₹${quote.finalAmount} has been prepared. Please review and accept.`,
    messageType: "quote_update",
    metadata: { quoteVersion: quote.version, finalAmount: quote.finalAmount },
  });

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, hydrated, "Quote created and sent");
});

// ────────────────────────────────────────────
// ADMIN: ASSIGN AGENT
// ────────────────────────────────────────────
export const assignAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;
  const actor = actorFromReq(req);

  if (!actor.privileged) throw new ApiError(403, "Admin access required");

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  assertBookingAccess(req, booking, { requireAgencyManager: true });
  const before = booking.toObject();

  if (!agentId) {
    if (booking.tour) {
      const tour = await Tour.findById(booking.tour);
      const resolved = await resolveBookingAgent(tour);
      if (resolved) booking.assignedAgent = resolved;
    }
  } else {
    const agent = await User.findOne({ _id: agentId, agencyId: booking.agencyId, agencyRole: "partner_agent", accountStatus: "active" }).select("name agentRef agencyRef partnerAgencyRef agencyId");
    if (!agent) throw new ApiError(400, "Agent must be active and belong to the booking agency");
    booking.assignedAgent = agentId;
    if (agent) {
      booking.assignedAgentRef = agent.agentRef || "";
      booking.assignedAgencyRef = agent.agencyRef || "";
      booking.assignedPartnerAgencyRef = agent.partnerAgencyRef || "";
    }
  }

  await booking.save();
  await recordBookingAudit(req, booking, "booking.assign", before);

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "agent_assigned",
    metadata: { agentId: booking.assignedAgent },
  });

  const agent = await User.findById(booking.assignedAgent).select("name email");
  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, { ...hydrated, assignedAgent: agent }, "Agent assigned");
});

// ────────────────────────────────────────────
// CANCEL BOOKING
// ────────────────────────────────────────────
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;
  const actor = actorFromReq(req);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  assertBookingAccess(req, booking);
  const before = booking.toObject();

  const cancellable = ["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT", "AWAITING_TOKEN_PAYMENT", "PAYMENT_PENDING", "CONFIRMED"];
  const retryingSeatRelease = booking.status === BOOKING_STATUS.CANCELLED
    && (booking.trip || booking.tour)
    && booking.seatsReserved > 0;
  if (!cancellable.includes(booking.status) && !retryingSeatRelease) {
    throw new ApiError(400, `Cannot cancel booking in ${booking.status} state`);
  }

  if (!retryingSeatRelease) {
    booking.transitionStatus(BOOKING_STATUS.CANCELLED);
    booking.cancelledAt = new Date();
    await booking.save();
  }

  if ((booking.trip || booking.tour) && booking.seatsReserved > 0) {
    const seatsToRelease = booking.seatsReserved;
    const releaseClaim = await Booking.findOneAndUpdate(
      { _id: booking._id, seatsReserved: seatsToRelease },
      { $set: { seatsReserved: 0 } },
      { new: true },
    );

    if (releaseClaim) {
      try {
        const inventoryModel = booking.trip ? TrevioTrip : Tour;
        const releasedTrip = await inventoryModel.findOneAndUpdate(
          { _id: booking.trip || booking.tour },
          { $inc: { "availability.seatsAvailable": seatsToRelease } },
          { new: true },
        );
        if (!releasedTrip) throw new ApiError(404, "Trip inventory not found");
        booking.seatsReserved = 0;
      } catch (error) {
        await Booking.updateOne(
          { _id: booking._id, seatsReserved: 0 },
          { $set: { seatsReserved: seatsToRelease } },
        );
        throw error;
      }
    }
  }

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "booking_cancelled",
    metadata: { reason },
  });
  await recordBookingAudit(req, booking, "booking.cancel", before);

  await MessageService.send({
    bookingId: booking._id,
    senderType: "system",
    senderName: "System",
    content: `Booking cancelled${reason ? `: ${reason}` : ""}.`,
    messageType: "system",
  });

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, hydrated, "Booking cancelled");
});

// ────────────────────────────────────────────
// GET BOOKING DETAIL (for dashboard)
// ────────────────────────────────────────────
export const getBookingDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userRole, authUser } = authInfoFromReq(req);
  const privileged = isPrivileged(authUser, userRole);

  const booking = await Booking.findById(id)
    .populate("tour", "title slug city address distance period price photo photos itinerary highlights inclusions exclusions cancellationPolicy")
    .populate("trip", "title slug location image photos price cancellationPolicy duration itinerary inclusions exclusions")
    .populate("assignedAgent", "name email phone");

  if (!booking) throw new ApiError(404, "Booking not found");

  assertBookingAccess(req, booking);

  const hydrated = await BookingService.hydrate(booking);
  const product = booking.product || BOOKING_FLOW.TREVISTA;
  const timeline = buildStatusTimeline(booking.status, product);
  const latestQuote = await QuoteService.latest(booking._id);
  const messages = await MessageService.list(booking._id, { limit: 50 });
  const unreadMessages = await MessageService.countUnread(booking._id, privileged ? "agent" : "customer");
  const tokenAmount = computeTokenAmount(booking, product);
  const paymentConfiguration = product === BOOKING_FLOW.TREVIO
    ? await PaymentSettings.findOneAndUpdate(
        { key: "default", agencyId: booking.agencyId || null },
        { $setOnInsert: { key: "default", agencyId: booking.agencyId || null } },
        { new: true, upsert: true }
      ).lean()
    : null;

  return sendSuccess(res, {
    ...hydrated,
    product,
    timeline,
    flowSteps: buildFlowSteps(product),
    latestQuote,
    messages,
    unreadMessages,
    tokenAmount,
    remainingAmount: booking.paymentSummary?.remaining || 0,
    bookingStatus: booking.status,
    paymentConfiguration,
    paymentTimeline: hydrated.timeline || [],
    assignedAgent: booking.assignedAgent,
  });
});

// ────────────────────────────────────────────
// CONFIRM BOOKING (admin)
// ────────────────────────────────────────────
export const confirmBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actor = actorFromReq(req);

  if (!actor.privileged) throw new ApiError(403, "Admin access required");

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");
  assertBookingAccess(req, booking);
  const before = booking.toObject();

  const confirmable = ["PAID", "TICKETED"];
  if (!confirmable.includes(booking.status)) {
    throw new ApiError(400, `Cannot confirm booking in ${booking.status} state`);
  }

  booking.transitionStatus(BOOKING_STATUS.CONFIRMED);
  await booking.save();
  await recordBookingAudit(req, booking, "booking.confirm", before);

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor,
    action: "booking_confirmed",
  });

  await MessageService.send({
    bookingId: booking._id,
    senderType: "system",
    senderName: "System",
    content: "Booking confirmed. Have a great trip!",
    messageType: "system",
  });

  const hydrated = await BookingService.hydrate(booking);
  return sendSuccess(res, hydrated, "Booking confirmed");
});

// ────────────────────────────────────────────
// LIST ALL BOOKINGS (admin)
// ────────────────────────────────────────────
export const listAllBookings = asyncHandler(async (req, res) => {
  const { userRole, authUser } = authInfoFromReq(req);
  const privileged = isPrivileged(authUser, userRole);
  if (!privileged) throw new ApiError(403, "Admin access required");

  const { limit = 20, skip = 0, status, product, sort = "-createdAt", search } = req.query;
  const query = { deletedAt: null };
  if (!(authUser?.role === "admin" && authUser?.adminLevel === "master")) {
    if (authUser?.role !== "agent" || !authUser?.agencyId) throw new ApiError(403, "Admin access required");
    query.agencyId = authUser.agencyId;
    if (authUser.agencyRole !== "partner_admin") query.assignedAgent = authUser.sub || authUser.id;
  }
  if (status) query.status = Booking.normalizeStatus(status);
  if (product) query.product = product;
  if (search) {
    query.$or = [
      { bookingRef: { $regex: search, $options: "i" } },
      { "primaryContact.name": { $regex: search, $options: "i" } },
      { "primaryContact.email": { $regex: search, $options: "i" } },
    ];
  }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("tour", "title slug city photo photos")
      .populate("trip", "title slug location image photos duration")
      .populate("user", "name email phone")
      .sort(sort).skip(Number(skip)).limit(Math.min(Number(limit), 100)),
    Booking.countDocuments(query),
  ]);

  const hydrated = await BookingService.hydrateMany(bookings, { includeDeep: false });
  return sendSuccess(res, { bookings: hydrated, total, hasMore: Number(skip) + bookings.length < total });
});

export default {
  createBooking,
  submitBooking,
  getBookingStatus,
  getBookingDetail,
  acceptQuote,
  rejectQuote,
  getMyBookings,
  createQuote,
  assignAgent,
  cancelBooking,
  confirmBooking,
  listAllBookings,
  createV2Quote,
};
