import mongoose from "mongoose";
import config from "../config/index.js";
import Booking from "../modules/bookings/models/Booking.js";
import BookingPayment from "../modules/bookings/models/BookingPayment.js";

async function migrate() {
  await mongoose.connect(config.MONGO_URI);

  const bookingMappings = [
    [
      { product: "trevio", tokenAmount: { $lte: 0 }, "priceSnapshot.total": { $gt: 0 } },
      [{ $set: { tokenAmount: { $round: [{ $multiply: ["$priceSnapshot.total", 0.15] }, 0] } } }],
    ],
    [{ product: "trevio", status: "PAYMENT_PENDING" }, { status: "AWAITING_TOKEN_PAYMENT" }],
    [{ product: "trevio", status: { $in: ["PARTIALLY_PAID", "PAID"] } }, { status: "CONFIRMED" }],
    [{ product: "trevio", paymentStatus: "UNPAID" }, { paymentStatus: "TOKEN_PENDING" }],
    [{ product: "trevio", paymentStatus: "PARTIAL" }, { paymentStatus: "TOKEN_PAID" }],
    [{ product: "trevio", paymentStatus: "PAID" }, { paymentStatus: "FULLY_PAID" }],
  ];

  const bookingResults = [];
  for (const [filter, update] of bookingMappings) {
    bookingResults.push(await Booking.updateMany(filter, Array.isArray(update) ? update : { $set: update }));
  }

  const trevioBookingIds = await Booking.find({ product: "trevio" }).distinct("_id");
  const paymentResults = await Promise.all([
    BookingPayment.updateMany(
      { bookingId: { $in: trevioBookingIds }, type: "deposit" },
      { $set: { type: "TOKEN", paymentMethod: "UPI" } }
    ),
    BookingPayment.updateMany(
      { bookingId: { $in: trevioBookingIds }, type: { $in: ["partial", "remaining"] } },
      { $set: { type: "BALANCE", paymentMethod: "BANK" } }
    ),
    BookingPayment.updateMany(
      { bookingId: { $in: trevioBookingIds }, type: "refund" },
      { $set: { type: "REFUND", paymentMethod: "BANK" } }
    ),
  ]);

  const modifiedBookings = bookingResults.reduce((total, result) => total + result.modifiedCount, 0);
  const modifiedPayments = paymentResults.reduce((total, result) => total + result.modifiedCount, 0);
  console.log(`Migrated ${modifiedBookings} Trevio booking state value(s) and ${modifiedPayments} payment record(s).`);
}

migrate()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error("Trevio offline payment migration failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
