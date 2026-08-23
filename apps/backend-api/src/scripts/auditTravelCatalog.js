import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";
import TourDeparture from "../modules/tours/models/TourDeparture.js";

await mongoose.connect(config.MONGO_URI);
const [tours, departures] = await Promise.all([
    Tour.find({})
        .select(
            "slug title agentRef providerName agencyRef partnerAgencyRef agentTour createdBy createdAt",
        )
        .sort({ createdAt: 1 })
        .lean(),
    TourDeparture.countDocuments(),
]);
console.log(JSON.stringify({ database: mongoose.connection.name, departures, tours }, null, 2));
await mongoose.disconnect();
