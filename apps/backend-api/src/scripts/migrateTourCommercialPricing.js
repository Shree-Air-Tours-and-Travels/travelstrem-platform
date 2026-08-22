import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";

const apply = process.argv.includes("--apply");
await mongoose.connect(config.MONGO_URI);
try {
  const query = { $or: [{ commercial: { $exists: false } }, { "commercial.version": { $exists: false } }] };
  const legacyCount = await Tour.countDocuments(query);
  const componentCount = await Tour.countDocuments({ "commercial.version": "COMPONENTS_V1" });
  console.log(JSON.stringify({ mode: apply ? "apply" : "audit", legacyToursToMark: legacyCount, componentPricedTours: componentCount }, null, 2));
  if (apply && legacyCount) {
    const result = await Tour.updateMany(query, { $set: { commercial: { version: "LEGACY" } } });
    console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount }, null, 2));
  }
  if (!apply) console.log("No records changed. Re-run with --apply after reviewing the audit.");
} finally {
  await mongoose.disconnect();
}
