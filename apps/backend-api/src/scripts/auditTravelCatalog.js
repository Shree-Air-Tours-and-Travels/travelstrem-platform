import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";
import Booking from "../modules/bookings/models/Booking.js";
import TourDeparture from "../modules/tours/models/TourDeparture.js";

await mongoose.connect(config.MONGO_URI);
const [tours, bookings, departures] = await Promise.all([
  Tour.find({}).select("slug title agentRef providerName agencyRef partnerAgencyRef agentTour createdBy createdAt").sort({ createdAt: 1 }).lean(),
  Booking.countDocuments(), TourDeparture.countDocuments(),
]);
console.log(JSON.stringify({ database: mongoose.connection.name, bookings, departures, tours }, null, 2));
await mongoose.disconnect();
