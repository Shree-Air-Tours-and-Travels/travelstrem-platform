// seed.js
import dotenv from "dotenv";
import fs from "fs";
import connectDB from "./config/database.js";
import Tour from "./modules/tours/models/Tour.js";
import tours from "./utils/dummydata/tours.js";

// Load environment file like in server.js
const currentEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${currentEnv}`;

if (currentEnv !== "production" && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`✅ Loaded env from ${envFile}`);
} else {
  dotenv.config(); // fallback to .env
  if (currentEnv !== "production") {
    console.log(`⚠️ Loaded fallback .env (or none) for ${currentEnv}`);
  }
}

const seedTours = async () => {
  try {
    console.log("⏳ Connecting to DB...");
    await connectDB();

    console.log("🧹 Clearing existing tours...");
    await Tour.deleteMany();

    console.log("🌱 Seeding dummy tours...");

    // Remove any top-level _id that may be invalid (e.g. "t1") so MongoDB generates proper ObjectIds.
    const docsToInsert = (Array.isArray(tours) ? tours : []).map((t) => {
      // shallow clone to avoid mutating original module export
      const clone = { ...t };
      if (clone._id !== undefined) delete clone._id;
      return clone;
    });

    const createdTours = await Tour.insertMany(docsToInsert);

    console.log(`✅ Successfully seeded ${createdTours.length} tours.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding tours:");
    console.error(err.stack || err);
    process.exit(1);
  }
};

seedTours();
