import connectDB from "../config/database.js";
import config from "../config/index.js";

export default async function initializeDatabase() {
  await connectDB();
  config.logConfigSummary?.();
}
