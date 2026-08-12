import mongoose from "mongoose";
import config from "../config/index.js";
import Booking from "../modules/bookings/models/Booking.js";
import BookingAssignment from "../modules/bookings/models/BookingAssignment.js";
import BookingAuditLog from "../modules/bookings/models/BookingAuditLog.js";
import BookingDocument from "../modules/bookings/models/BookingDocument.js";
import BookingMessage from "../modules/bookings/models/BookingMessage.js";
import BookingPayment from "../modules/bookings/models/BookingPayment.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";
import BookingStatusHistory from "../modules/bookings/models/BookingStatusHistory.js";
import BookingTimeline from "../modules/bookings/models/BookingTimeline.js";
import BookingTraveller from "../modules/bookings/models/BookingTraveller.js";
import TrevioTrip from "../modules/trevio/models/TrevioTrip.js";

await mongoose.connect(config.MONGO_URI);

const bookingIds = await Booking.distinct("_id");
const reservations = await Booking.aggregate([
  { $match: { trip: { $ne: null }, seatsReserved: { $gt: 0 } } },
  { $group: { _id: "$trip", seats: { $sum: "$seatsReserved" } } },
]);

for (const reservation of reservations) {
  await TrevioTrip.updateOne(
    { _id: reservation._id },
    [{ $set: { "availability.seatsAvailable": {
      $cond: [
        { $ne: ["$availability.totalSeats", null] },
        { $min: ["$availability.totalSeats", { $add: [{ $ifNull: ["$availability.seatsAvailable", 0] }, reservation.seats] }] },
        "$availability.seatsAvailable",
      ],
    } } }],
  );
}

const linked = { bookingId: { $in: bookingIds } };
const results = {};
for (const [name, model] of [
  ["assignments", BookingAssignment], ["auditLogs", BookingAuditLog],
  ["documents", BookingDocument], ["messages", BookingMessage],
  ["payments", BookingPayment], ["statusHistory", BookingStatusHistory],
  ["timelines", BookingTimeline], ["travellers", BookingTraveller],
]) results[name] = (await model.deleteMany(linked)).deletedCount;

// Includes both booking-linked legacy quotes and unconsumed V2 checkout quotes.
results.quotes = (await BookingQuote.deleteMany({})).deletedCount;
results.bookings = (await Booking.deleteMany({ _id: { $in: bookingIds } })).deletedCount;

console.log(JSON.stringify({ database: mongoose.connection.name, restoredTripReservations: reservations.length, deleted: results }, null, 2));
await mongoose.disconnect();
