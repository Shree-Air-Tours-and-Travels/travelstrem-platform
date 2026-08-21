import { nanoid } from "nanoid";
import Booking from "../bookings/models/Booking.js";
import { BOOKING_STATUS } from "../../constants/enums.js";
import {
  SUPPORT_ACTION_TYPE,
  SUPPORT_CONTACT_AVAILABILITY,
  SUPPORT_ELIGIBILITY_STATUS,
  SUPPORT_REQUEST_TYPE,
  SUPPORT_TICKET_PRIORITY,
} from "@packages/trem-support-contracts";
import {
  categoryById,
  PLATFORM_CONTACT_OPTIONS,
  serviceById,
  SUPPORT_CATEGORIES,
  SUPPORT_ELIGIBILITY_CONFIG,
} from "./support.config.js";

const ACTIVE = new Set([
  BOOKING_STATUS.PAID,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.TICKETING,
  BOOKING_STATUS.TICKETED,
  BOOKING_STATUS.TRAVEL_READY,
]);
const TERMINAL = new Set([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REFUNDED]);
const CANCELLABLE = new Set([
  BOOKING_STATUS.DRAFT,
  BOOKING_STATUS.QUOTE_REQUESTED,
  BOOKING_STATUS.UNDER_REVIEW,
  BOOKING_STATUS.QUOTE_READY,
  BOOKING_STATUS.QUOTE_SENT,
  BOOKING_STATUS.CUSTOMER_ACCEPTED,
  BOOKING_STATUS.PAYMENT_PENDING,
  BOOKING_STATUS.PARTIALLY_PAID,
  ...ACTIVE,
]);

const iso = (value) => value ? new Date(value).toISOString() : null;
const dateValue = (value) => value ? new Date(value).getTime() : 0;
const publicReference = (booking) => booking.bookingRef || booking.id;
const agencyName = (booking) => booking.agencySnapshot?.displayName
  || booking.agencySnapshot?.businessName
  || booking.agencySnapshot?.name
  || "";

export function bookingTitle(booking) {
  return booking.trip?.title || booking.tour?.title || publicReference(booking);
}

export function bookingImage(booking) {
  return booking.trip?.image || booking.trip?.photos?.[0] || booking.tour?.photo || booking.tour?.photos?.[0] || "";
}

export function rankBooking(booking, now = Date.now()) {
  const start = dateValue(booking.travelWindow?.startDate);
  const end = dateValue(booking.travelWindow?.endDate);
  if (ACTIVE.has(booking.status) && start <= now && end >= now) return 0;
  if (!TERMINAL.has(booking.status) && start > now) return 1;
  if (booking.status === BOOKING_STATUS.COMPLETED) return 2;
  return 3;
}

function isEmergencyEligible(booking, now = Date.now()) {
  if (!ACTIVE.has(booking.status)) return false;
  const start = dateValue(booking.travelWindow?.startDate);
  const end = dateValue(booking.travelWindow?.endDate);
  const windowMs = SUPPORT_ELIGIBILITY_CONFIG.activeEmergencyWindowHours * 60 * 60 * 1000;
  return start <= now + windowMs && end >= now;
}

export function categoriesForBooking(booking) {
  const service = serviceById(booking.product);
  if (!service) return [];
  const categoryIds = [...service.categoryIds];
  if (agencyName(booking) && !categoryIds.includes("provider")) categoryIds.push("provider");
  return categoryIds
    .filter((id) => id !== "emergency" || isEmergencyEligible(booking))
    .map(categoryById)
    .filter(Boolean);
}

function actionForCategory(category, booking) {
  const target = `/help/new-request?bookingId=${encodeURIComponent(booking.id)}&category=${encodeURIComponent(category.id)}`;
  const special = {
    cancellation: { type: SUPPORT_ACTION_TYPE.CANCELLATION, target: `/help/cancel/${booking.id}` },
    refund: { type: SUPPORT_ACTION_TYPE.REFUND, target: `/help/refund/${booking.id}` },
    reschedule: { type: SUPPORT_ACTION_TYPE.RESCHEDULE, target: `/help/reschedule/${booking.id}` },
  }[category.id];
  return special || { type: SUPPORT_ACTION_TYPE.CREATE_TICKET, target };
}

export function supportActionsForBooking(booking) {
  return categoriesForBooking(booking).map((category) => ({
    id: `${booking.id}-${category.id}`,
    type: category.type,
    label: category.label,
    icon: category.icon,
    tone: category.tone || "neutral",
    enabled: true,
    action: actionForCategory(category, booking),
  }));
}

export function serializeSupportBooking(booking, { includeActions = true } = {}) {
  const service = serviceById(booking.product) || {};
  return {
    id: String(booking.id || booking._id),
    reference: publicReference(booking),
    title: bookingTitle(booking),
    image: bookingImage(booking),
    service: service.id ? { id: service.id, name: service.name, icon: service.icon, tone: service.tone } : null,
    dates: { start: iso(booking.travelWindow?.startDate), end: iso(booking.travelWindow?.endDate) },
    status: { id: booking.status, label: String(booking.status || "").replaceAll("_", " ") },
    provider: agencyName(booking) ? { name: agencyName(booking), label: `Provided by ${agencyName(booking)}` } : null,
    supportActions: includeActions ? supportActionsForBooking(booking) : [],
  };
}

export async function findOwnedBooking(userId, bookingId) {
  if (!bookingId?.match(/^[a-f\d]{24}$/i)) return null;
  return Booking.findOne({ _id: bookingId, user: userId, deletedAt: null })
    .populate("tour", "title slug city photo photos")
    .populate("trip", "title slug location image photos duration");
}

export async function listSupportBookings(userId) {
  const completedAfter = new Date(Date.now() - SUPPORT_ELIGIBILITY_CONFIG.recentlyCompletedDays * 86400000);
  const bookings = await Booking.find({
    user: userId,
    deletedAt: null,
    $or: [
      { status: { $ne: BOOKING_STATUS.COMPLETED } },
      { status: BOOKING_STATUS.COMPLETED, "travelWindow.endDate": { $gte: completedAfter } },
    ],
  })
    .populate("tour", "title slug city photo photos")
    .populate("trip", "title slug location image photos duration")
    .limit(50);
  return bookings.sort((a, b) => rankBooking(a) - rankBooking(b) || dateValue(a.travelWindow?.startDate) - dateValue(b.travelWindow?.startDate));
}

export function contactOptionsForBooking(booking) {
  const options = PLATFORM_CONTACT_OPTIONS.map((option) => ({ ...option, metadata: { ...option.metadata } }));
  const name = agencyName(booking || {});
  if (booking && name) {
    options.unshift({
      id: `agency-${booking.id}`,
      type: "AGENCY",
      label: `Contact ${name}`,
      description: "Send a request to the provider responsible for this booking.",
      availability: SUPPORT_CONTACT_AVAILABILITY.AVAILABLE,
      icon: "building2",
      action: { type: SUPPORT_ACTION_TYPE.CREATE_TICKET, target: `/help/new-request?bookingId=${booking.id}&category=provider` },
      metadata: { providerName: name },
    });
  }
  return options;
}

export function buildEligibility(booking, type) {
  const totalPaid = Number(booking.paymentSummary?.paid || 0);
  const alreadyRefunded = Number(booking.paymentSummary?.refunded || 0);
  const future = dateValue(booking.travelWindow?.startDate) > Date.now();
  const base = {
    booking: serializeSupportBooking(booking, { includeActions: false }),
    type,
    reasonOptions: SUPPORT_CATEGORIES.filter((category) => category.id === type.toLowerCase()).map((category) => ({ id: category.id, label: category.label })),
    policy: { summary: "Your request will be reviewed against the booking and provider policy accepted at checkout." },
  };
  if (type === SUPPORT_REQUEST_TYPE.CANCELLATION) {
    const eligible = CANCELLABLE.has(booking.status) && future;
    return { ...base, status: eligible ? SUPPORT_ELIGIBILITY_STATUS.ELIGIBLE : SUPPORT_ELIGIBILITY_STATUS.INELIGIBLE, eligible, impact: { amount: null, fee: null, currency: booking.priceSnapshot?.currency || "INR", calculatedBy: "support-team-review" }, explanation: eligible ? "This booking can be submitted for cancellation review." : "This booking is not currently eligible for cancellation." };
  }
  if (type === SUPPORT_REQUEST_TYPE.REFUND) {
    const eligible = totalPaid > alreadyRefunded && booking.status !== BOOKING_STATUS.REFUNDED;
    return { ...base, status: eligible ? SUPPORT_ELIGIBILITY_STATUS.ELIGIBLE : SUPPORT_ELIGIBILITY_STATUS.INELIGIBLE, eligible, impact: { amount: null, paidAmount: totalPaid, alreadyRefunded, fee: null, currency: booking.priceSnapshot?.currency || "INR", calculatedBy: "support-team-review" }, explanation: eligible ? "A refund review can be requested for this booking." : "No refundable payment is currently recorded for this booking." };
  }
  const eligible = future && !TERMINAL.has(booking.status) && booking.status !== BOOKING_STATUS.COMPLETED;
  return { ...base, status: eligible ? SUPPORT_ELIGIBILITY_STATUS.ELIGIBLE : SUPPORT_ELIGIBILITY_STATUS.INELIGIBLE, eligible, options: [], impact: { priceDifference: null, fee: null, currency: booking.priceSnapshot?.currency || "INR", calculatedBy: "support-team-review" }, explanation: eligible ? "Submit a reschedule request and the support team will confirm available inventory and pricing." : "This booking is not currently eligible for rescheduling." };
}

export const createReference = (prefix) => `${prefix}-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
export const defaultTicketPriority = (categoryId) => categoryById(categoryId)?.priority || SUPPORT_TICKET_PRIORITY.NORMAL;
export const validCategory = (categoryId) => Boolean(categoryById(categoryId));
