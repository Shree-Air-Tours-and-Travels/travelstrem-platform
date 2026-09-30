import connectDB from "../config/database.js";
import config from "../config/index.js";
import { ensureDefaultPlatformProducts } from "../modules/tenancy/productCatalog.js";

export default async function initializeDatabase() {
    await connectDB();
    await ensureDefaultPlatformProducts();
    config.logConfigSummary?.();
}
