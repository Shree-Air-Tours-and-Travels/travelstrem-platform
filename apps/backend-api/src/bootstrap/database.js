import { seedPlatformBrand } from "../modules/branding/seed.js";
import { assertTenantDatabaseAccess } from "../modules/clients/tenantDatabaseAccess.js";
import mongoose from "mongoose";
import { tenantModelNames, ensureTenantIndexes } from "../modules/clients/tenantModels.js";
import Client from "../modules/clients/models/Client.js";
import { startEnquiryTrash } from "../modules/forms/services/enquiryTrash.js";
import connectDB from "../config/database.js";
import config from "../config/index.js";
import { ensureDefaultPlatformProducts } from "../modules/tenancy/productCatalog.js";

export default async function initializeDatabase() {
    await connectDB();
    await seedPlatformBrand();
    if (process.env.TENANT_CLIENT_ID) {
        const tenant = await Client.findOne({
            _id: process.env.TENANT_CLIENT_ID,
            status: "active",
        }).lean();
        if (!tenant || tenant.database?.name !== mongoose.connection.name)
            throw new Error("Configured tenant database must be provisioned before startup.");
        await assertTenantDatabaseAccess(tenant, mongoose.connection);
        const names = tenantModelNames(tenant);
        for (const name of names) {
            const model = mongoose.models[name];
            if (model) await ensureTenantIndexes(model);
        }
    }
    if (!process.env.TENANT_CLIENT_ID) await ensureDefaultPlatformProducts();
    await startEnquiryTrash();
    config.logConfigSummary?.();
}
