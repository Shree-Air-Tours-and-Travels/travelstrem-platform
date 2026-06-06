import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env.production") });

const MONGO_URI = (process.env.MONGO_URI || "").trim();

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env.production");
  process.exit(1);
}

import Tour from "../modules/tours/models/Tour.js";
import Service from "../modules/services/models/Service.js";
import tours from "../utils/dummydata/tours.js";
import servicesData from "../utils/dummydata/services.js";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // --- Seed tours ---
    console.log("Clearing existing tours...");
    await Tour.deleteMany();

    const tourDocs = tours.map((t) => {
      const { _id, ...rest } = t;
      return rest;
    });

    const createdTours = await Tour.insertMany(tourDocs);
    console.log(`Seeded ${createdTours.length} tours.`);

    // --- Seed services ---
    console.log("Clearing existing services...");
    await Service.deleteMany();

    const serviceDocs = servicesData.map((s) => {
      const { ...rest } = s;
      return rest;
    });

    const createdServices = await Service.insertMany(serviceDocs);
    console.log(`Seeded ${createdServices.length} services.`);

    console.log("Production seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
