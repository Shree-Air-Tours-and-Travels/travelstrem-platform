import Booking from "../../bookings/models/Booking.js";
import BookingService from "../../bookings/services/BookingService.js";
import BookingTimelineService from "../../bookings/services/BookingTimelineService.js";
import MessageService from "../../bookings/services/MessageService.js";
import User from "../../auth/models/User.js";

const asDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

function travelWindow(lead, entity) {
  const raw = String(lead.fields?.preferredTravelDate || "");
  const [rawStart, rawEnd] = raw.split("|");
  const startDate = asDate(rawStart) || asDate(entity?.startDate) || new Date();
  const endDate = asDate(rawEnd) || asDate(entity?.endDate) || startDate;
  return { startDate, endDate: endDate < startDate ? startDate : endDate };
}

function priceSnapshot(entity, guestsCount) {
  const amount = Number(entity?.price?.amount ?? entity?.price?.min ?? entity?.price ?? 0) || 0;
  const total = amount * Math.max(1, guestsCount);
  return {
    min: Number(entity?.price?.min ?? amount) || 0,
    max: Number(entity?.price?.max ?? amount) || 0,
    currency: entity?.price?.currency || entity?.currency || "INR",
    isFinal: false,
    source: "manual",
    perPerson: amount,
    baseTripTotal: total,
    total,
  };
}

export async function ensureBookingForEnquiry(lead, entity) {
  if (!lead?._id) return null;
  if (lead.bookingId) {
    const existing = await Booking.findById(lead.bookingId);
    if (existing) return existing;
  }

  const byLead = await Booking.findOne({ contactLead: lead._id });
  if (byLead) {
    lead.bookingId = byLead._id;
    if (!lead.enquiryRef) lead.enquiryRef = `ENQ-${String(lead._id).slice(-6).toUpperCase()}`;
    await lead.save();
    return byLead;
  }

  const guestsCount = Math.max(1, Number(lead.fields?.travellerCount || 1));
  const assignedAgent = lead.ownerAgent || entity?.ownerAgent || entity?.createdBy || null;
  const agent = assignedAgent
    ? await User.findById(assignedAgent).select("name email phone agentRef agencyRef partnerAgencyRef agencyId").lean()
    : null;
  const snapshot = priceSnapshot(entity, guestsCount);
  const product = lead.product === "trevio" ? "trevio" : "trevista";
  const booking = new Booking({
    user: lead.claimedBy || null,
    contactLead: lead._id,
    enquiryRef: lead.enquiryRef,
    tour: product === "trevista" ? entity?._id || null : null,
    trip: product === "trevio" ? entity?._id || null : null,
    product,
    assignedAgent,
    assignedAgentRef: agent?.agentRef || "",
    assignedAgencyRef: agent?.agencyRef || "",
    assignedPartnerAgencyRef: agent?.partnerAgencyRef || "",
    agencyId: lead.agencyId || entity?.agencyId || agent?.agencyId || null,
    travelWindow: travelWindow(lead, entity),
    isTravelDateFlexible: !String(lead.fields?.preferredTravelDate || "").trim(),
    tripSelection: {
      adultCount: guestsCount,
      childCount: 0,
      infantCount: 0,
      currency: snapshot.currency,
      specialRequirements: lead.fields?.message || "",
    },
    tripPreferences: {
      addFlights: lead.fields?.flightPreference === "with_flights" ? "yes" : "no",
      specialRequests: lead.fields?.message || "",
    },
    primaryContact: {
      name: lead.fields?.name || "",
      email: lead.fields?.email || "",
      phone: lead.fields?.phone || "",
    },
    guestsCount,
    seatsReserved: 0,
    catalogEstimate: snapshot,
    priceSnapshot: { ...snapshot, min: 0, max: 0, perPerson: 0, baseTripTotal: 0, total: 0, note: "Awaiting organiser quote" },
    paymentSummary: { total: 0, paid: 0, remaining: 0, refunded: 0 },
    status: "QUOTE_REQUESTED",
    ...BookingService.priorityDueDates("MEDIUM"),
    sourceAttribution: { source: "enquiry" },
    createdBy: assignedAgent,
    updatedBy: assignedAgent,
    assignedAgentSnapshot: agent ? {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      ref: agent.agentRef,
    } : lead.agentSnapshot,
  });

  try {
    await booking.save();
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const raced = await Booking.findOne({ contactLead: lead._id });
    if (!raced) throw error;
    lead.bookingId = raced._id;
    await lead.save();
    return raced;
  }

  lead.bookingId = booking._id;
  await lead.save();
  await Promise.all([
    BookingTimelineService.record({
      bookingId: booking._id,
      actor: { id: assignedAgent, type: "system" },
      action: "enquiry_received",
      metadata: { enquiryRef: lead.enquiryRef, product },
    }),
    MessageService.send({
      bookingId: booking._id,
      senderType: "system",
      senderName: "System",
      content: `Enquiry ${lead.enquiryRef} received. A travel specialist will prepare your quote.`,
      messageType: "system",
    }),
  ]);
  return booking;
}

export async function claimEnquiryBooking(lead, userId, entity) {
  const booking = await ensureBookingForEnquiry(lead, entity);
  if (!booking) return null;
  if (booking.user && String(booking.user) !== String(userId)) {
    const error = new Error("This enquiry is already linked to another account.");
    error.status = 409;
    throw error;
  }
  booking.user = userId;
  booking.updatedBy = userId;
  await booking.save();
  lead.claimedBy = userId;
  lead.bookingId = booking._id;
  await lead.save();
  return booking;
}

export default { ensureBookingForEnquiry, claimEnquiryBooking };
