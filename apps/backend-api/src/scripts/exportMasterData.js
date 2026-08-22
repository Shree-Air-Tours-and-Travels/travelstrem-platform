import mongoose from "mongoose";
import config from "../config/index.js";
import MasterOptionSet from "../modules/masterData/models/MasterOptionSet.js";

await mongoose.connect(config.MONGO_URI);

try {
  const optionSets = await MasterOptionSet.find({}).sort({ key: 1 }).lean();
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sourceDatabase: mongoose.connection.name,
    optionSets: optionSets.map(({ _id, __v, createdAt, updatedAt, ...optionSet }) => optionSet),
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} finally {
  await mongoose.disconnect();
}
