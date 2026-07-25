import mongoose from "mongoose";
import config from "../config/index.js";
import trevioTripService from "../modules/trevio/services/trevioTripService.js";

async function seedTrevioTrips() {
  await mongoose.connect(config.MONGO_URI);
  const result = await trevioTripService.seedTrips();
  console.log(`Seeded ${result.seeded} Trevio trip(s).`);
  await mongoose.disconnect();
}

seedTrevioTrips().catch(async (error) => {
  console.error("Error seeding Trevio trips:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
