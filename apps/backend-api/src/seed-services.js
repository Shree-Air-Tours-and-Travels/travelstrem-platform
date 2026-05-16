import dotenv from "dotenv";
import fs from "fs";
import connectDB from "./config/database.js";
import Service from "./modules/services/models/Service.js";
import services from "./utils/dummydata/services.js";

const currentEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${currentEnv}`;

if (currentEnv !== "production" && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`Loaded env from ${envFile}`);
} else {
  dotenv.config();
  if (currentEnv !== "production") {
    console.log(`Loaded fallback .env (or none) for ${currentEnv}`);
  }
}

const seedServices = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();

    console.log("Clearing existing services...");
    await Service.deleteMany();

    console.log("Seeding dummy services...");

    const docsToInsert = (Array.isArray(services) ? services : []).map((s) => {
      const clone = { ...s };
      return clone;
    });

    const createdServices = await Service.insertMany(docsToInsert);

    console.log(`Successfully seeded ${createdServices.length} services.`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding services:");
    console.error(err.stack || err);
    process.exit(1);
  }
};

seedServices();
