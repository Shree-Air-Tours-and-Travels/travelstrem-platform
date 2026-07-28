import { customAlphabet } from "nanoid";
import TrevioBooking from "../models/TrevioBooking.js";
import trevioTripService from "../services/trevioTripService.js";
import { calculateTrevioPricing } from "./trevioController.js";

const code = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 10);
export const createTrevioBooking = async (req, res) => {
  let tripRef = "";
  let travellerCount = 0;
  try {
    const body = req.body || {};
    tripRef = String(body.tripRef || body.trip?.slug || body.tripId || "").trim().toLowerCase();
    const trip = await trevioTripService.findBySlug(tripRef);
    if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });
    const bookingRef = `TRV-${code()}`;
    const quoteId = `TRV-Q-${code()}`;
    const travellers = body.travellers || body.travelers || [];
    travellerCount = Math.max(1, travellers.length || Number(body.values?.travellers || 1));
    const availableTrip = await trevioTripService.checkAvailability(tripRef, travellerCount);
    if (!availableTrip) return res.status(409).json({ status: "error", message: "The selected trip no longer has enough seats available." });
    const { pricing } = calculateTrevioPricing(availableTrip, body);
    const document = await TrevioBooking.create({
      bookingRef, quoteId, tripRef, trip: trevioTripService.normalize(availableTrip),
      travelWindow: { startDate: body.startDate || body.values?.startDate, endDate: body.endDate || body.values?.endDate },
      travellers, addons: body.addons || [], pricing, contact: body.contact || {},
      agentRef: body.agentRef || body.values?.agentRef || "",
      assignedAgentRef: body.assignedAgentRef || body.agentRef || "",
      assignedAgencyRef: body.assignedAgencyRef || "",
      paymentSummary: { total: pricing.grandTotal || pricing.total || 0, paid: 0, remaining: pricing.remainingBalance ?? pricing.grandTotal ?? pricing.total ?? 0 },
    });
    return res.status(201).json({ status: "success", componentData: { data: document.toJSON() }, message: "Trevio quote created" });
  } catch (error) {
    console.error("createTrevioBooking error:", error);
    return res.status(500).json({ status: "error", message: "Failed to create Trevio booking" });
  }
};

export const getTrevioBooking = async (req, res) => {
  const booking = await TrevioBooking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ status: "error", message: "Booking not found" });
  return res.status(200).json({ status: "success", componentData: { data: booking.toJSON() } });
};

export const recordTrevioPayment = async (req, res) => {
  const booking = await TrevioBooking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ status: "error", message: "Booking not found" });
  const amount = Number(req.body?.amount || 0);
  booking.paymentSummary = { ...(booking.paymentSummary || {}), paid: amount, remaining: Math.max(0, Number(booking.paymentSummary?.total || 0) - amount) };
  booking.status = booking.paymentSummary.remaining ? "PARTIALLY_PAID" : "CONFIRMED";
  await booking.save();
  return res.status(200).json({ status: "success", componentData: { data: booking.toJSON() }, message: "Payment recorded" });
};
