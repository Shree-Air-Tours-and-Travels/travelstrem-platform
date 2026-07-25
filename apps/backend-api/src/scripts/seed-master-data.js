import mongoose from "mongoose";
import config from "../config/index.js";
import masterDataService from "../modules/masterData/services/masterDataService.js";

async function seedMasterData() {
  await mongoose.connect(config.MONGO_URI);
  const result = await masterDataService.seedDefaults();
  console.log(`Seeded ${result.seeded} master option set(s).`);
  await mongoose.disconnect();
}

seedMasterData().catch(async (error) => {
  console.error("Error seeding master data:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
