import mongoose from "mongoose";
import config from "../config/index.js";
import Booking from "../modules/bookings/models/Booking.js";
import "../modules/forms/models/ContactLead.js";

await mongoose.connect(config.MONGO_URI);

const bookings = await Booking.find({
  contactLead: { $ne: null },
  latestQuoteId: null,
  currentQuoteVersion: 0,
  status: { $in: ["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW", "QUOTE_READY"] },
}).populate("contactLead", "fields");

let updated = 0;
for (const booking of bookings) {
  const current = booking.priceSnapshot?.toObject?.() || booking.priceSnapshot || {};
  if (!booking.catalogEstimate && Number(current.total || 0) > 0) booking.catalogEstimate = current;
  booking.priceSnapshot = {
    ...current,
    min: 0,
    max: 0,
    perPerson: 0,
    baseTripTotal: 0,
    total: 0,
    isFinal: false,
    note: "Awaiting organiser quote",
  };
  booking.paymentSummary = {
    total: 0,
    paid: Number(booking.paymentSummary?.paid || 0),
    remaining: 0,
    refunded: Number(booking.paymentSummary?.refunded || 0),
  };
  booking.tokenAmount = 0;
  booking.paymentStatus = "UNPAID";
  booking.isTravelDateFlexible = !String(booking.contactLead?.fields?.preferredTravelDate || "").trim();
  await booking.save();
  updated += 1;
}

console.log(JSON.stringify({ database: mongoose.connection.name, scanned: bookings.length, updated }, null, 2));
await mongoose.disconnect();
