import mongoose from "mongoose";
import config from "../config/index.js";
import Booking from "../modules/bookings/models/Booking.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";

await mongoose.connect(config.MONGO_URI);
const [bookings, quotes] = await Promise.all([Booking.countDocuments(), BookingQuote.countDocuments()]);
console.log(JSON.stringify({ database: mongoose.connection.name, bookings, quotes }));
await mongoose.disconnect();
