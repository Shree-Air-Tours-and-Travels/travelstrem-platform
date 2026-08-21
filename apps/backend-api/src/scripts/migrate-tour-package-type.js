#!/usr/bin/env node
/**
 * Migration: Set packageType to "fixed_departure" for all existing tours
 * and derive embedded departures from legacy startDate/endDate if present.
 *
 * Run with: node apps/backend-api/src/scripts/migrate-tour-package-type.js
 *
 * Options:
 *   --dry-run   Print what would change without writing to the database
 *   --force     Skip confirmation prompt
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/travelstrem";
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

async function connect() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to ${MONGO_URI}`);
  }
}

async function migrate() {
  await connect();

  const db = mongoose.connection.db;
  const tours = db.collection("tours");

  // Find tours that don't yet have packageType set
  const cursor = tours.find({
    packageType: { $exists: false },
    deletedAt: { $exists: false },
  });

  let count = 0;
  const updates = [];

  while (await cursor.hasNext()) {
    const tour = await cursor.next();
    count++;

    const setFields = { packageType: "fixed_departure" };

    // If the tour has startDate and endDate but no departures, derive one
    if (tour.startDate && tour.endDate && (!tour.departures || tour.departures.length === 0)) {
      const departure = {
        _id: new mongoose.Types.ObjectId(),
        label: tour.title || "Default departure",
        departureDate: tour.startDate,
        returnDate: tour.endDate,
        status: "active",
        capacity: tour.availability?.totalSeats || null,
        seatsAvailable: tour.availability?.seatsAvailable || tour.availability?.totalSeats || null,
        pricing: {
          min: tour.price?.min || 0,
          max: tour.price?.max || 0,
          currency: tour.price?.currency || "INR",
          isFinal: !!tour.price?.isFinal,
          source: tour.price?.source || "manual",
        },
        bookingOpensAt: null,
        bookingClosesAt: null,
        notes: "",
      };
      setFields.departures = [departure];
    }

    updates.push({
      updateOne: {
        filter: { _id: tour._id },
        update: { $set: setFields },
      },
    });
  }

  console.log(`Found ${count} tours to migrate.`);

  if (updates.length === 0) {
    console.log("Nothing to migrate. All tours already have packageType set.");
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Would apply the following updates:");
    for (const op of updates.slice(0, 10)) {
      console.log(`  - ${op.updateOne.filter._id}:`, JSON.stringify(op.updateOne.update.$set));
    }
    if (updates.length > 10) console.log(`  ... and ${updates.length - 10} more`);
    await mongoose.disconnect();
    return;
  }

  if (!FORCE) {
    console.log(`\nAbout to update ${updates.length} tours. Use --dry-run to preview or --force to skip this prompt.`);
    await mongoose.disconnect();
    return;
  }

  const result = await tours.bulkWrite(updates, { ordered: false });
  console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
