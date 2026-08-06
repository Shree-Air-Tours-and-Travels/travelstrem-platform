import mongoose from "mongoose";
import config from "../config/index.js";
import Role from "../modules/tenancy/models/Role.js";
import { ROLE_PERMISSIONS } from "../modules/tenancy/permissions.js";
import { ensureDefaultPlatformProducts } from "../modules/tenancy/productCatalog.js";

await mongoose.connect(config.MONGO_URI);
await ensureDefaultPlatformProducts();
await Promise.all([
  ...Object.entries(ROLE_PERMISSIONS).map(([key, permissions]) => Role.updateOne({ key }, { $set: { name: key.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "), permissions, system: true } }, { upsert: true })),
]);
console.log("Seeded products, roles, and default permissions.");
await mongoose.disconnect();
