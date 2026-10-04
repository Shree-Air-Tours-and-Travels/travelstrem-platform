import { ensureTenantIndexes } from "./tenantModels.js";
import { resolveMongoConnectionUri } from "../../config/dns.js";
import { tenantRuntimeConfiguration } from "./configuration.js";
import { migrateTenantConfiguration } from "./migrateTenantConfiguration.js";
import mongoose from "mongoose";
import config from "../../config/env.js";
import Client, { tenantConfigurationSchema } from "./models/Client.js";
import User from "../auth/models/User.js";
import Invitation from "../tenancy/models/Invitation.js";
import Product from "../tenancy/models/Product.js";
import { inviteUser } from "../tenancy/tenancy.service.js";
import ApiError from "../../shared/errors/ApiError.js";

export function tenantDatabaseUri(client) {
    const { secretRef, name } = client.database || {};
    if (
        !/^TENANT_DB_[A-Z0-9_]+$/.test(secretRef || "") ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(name || "")
    )
        throw new ApiError(400, "A database secret reference and database name are required.");
    const raw = process.env[secretRef];
    if (!raw || !/^mongodb(?:\+srv)?:\/\//.test(raw))
        throw new ApiError(400, "The tenant database secret is not configured on this server.");
    const target = new URL(raw);
    target.pathname = `/${name}`;
    const platform = new URL(config.MONGO_URI);
    if (
        !process.env.TENANT_CLIENT_ID &&
        target.host === platform.host &&
        target.pathname === platform.pathname
    )
        throw new ApiError(400, "A tenant cannot use the platform database.");
    return target.toString();
}
export async function withTenantDatabase(client, action) {
    const connection = await mongoose
        .createConnection(await resolveMongoConnectionUri(tenantDatabaseUri(client)), {
            serverSelectionTimeoutMS: 15000,
            autoCreate: false,
            autoIndex: false,
        })
        .asPromise();
    try {
        await migrateTenantConfiguration(connection, client._id);
        const models = Object.fromEntries(
            [Client, User, Invitation, Product].map((model) => [
                model.modelName,
                connection.model(
                    model.modelName,
                    model.modelName === "Client" ? tenantConfigurationSchema : model.schema,
                    model.modelName === "Client" ? "tenantconfigurations" : model.collection.name,
                ),
            ]),
        );
        for (const model of Object.values(models)) await ensureTenantIndexes(model);
        return await action(models, connection);
    } finally {
        await connection.close();
    }
}

export async function provisionClient(
    client,
    actorId,
    { invite = true, syncConfiguration = true } = {},
) {
    const catalogue = await Product.find({}).lean();
    if (
        catalogue.filter(
            (product) => client.productAccess.includes(product.key) && product.status === "active",
        ).length !== client.productAccess.length
    )
        throw new ApiError(400, "One or more assigned products are unavailable.");
    return withTenantDatabase(client, async (models) => {
        if (await models.Client.exists({ _id: { $ne: client._id } }))
            throw new ApiError(409, "This database already contains a different tenant.");
        const current = await models.Client.findById(client._id).lean();
        const copy = tenantRuntimeConfiguration(client);
        // Once provisioned, company identity and theme are owned by the tenant.
        // Licence synchronization must also preserve edits made before this change.
        if (current) {
            copy.globalBrand = current.globalBrand ?? copy.globalBrand;
            copy.theme = current.theme ?? copy.theme;
        }
        copy.configVersion = Math.max(copy.configVersion || 1, (current?.configVersion || 0) + 1);
        if (syncConfiguration || !current)
            await models.Client.replaceOne({ _id: client._id }, copy, {
                upsert: true,
                runValidators: true,
            });
        for (const { _id, ...product } of catalogue.filter((item) =>
            client.productAccess.includes(item.key),
        ))
            await models.Product.updateOne(
                { key: product.key },
                {
                    $set: {
                        ...product,
                        services: (product.services || []).filter(
                            (service) =>
                                client.modules?.get?.(product.key)?.includes(service) ||
                                client.modules?.[product.key]?.includes(service),
                        ),
                        status: "active",
                        hidden: false,
                    },
                },
                { upsert: true, runValidators: true },
            );
        await models.Product.updateMany(
            { key: { $nin: client.productAccess } },
            { $set: { status: "inactive" } },
        );
        // Upgrade only the original company administrator once; later promotions belong to company management.
        if (
            !(await models.User.exists({ clientId: client._id, clientRole: "client_master_admin" }))
        ) {
            await models.User.updateOne(
                {
                    clientId: client._id,
                    email: client.administrator?.email?.trim().toLowerCase(),
                    clientRole: "client_admin",
                },
                { $set: { clientRole: "client_master_admin" }, $inc: { tokenVersion: 1 } },
            );
        }
        if (!invite) {
            const master = await models.User.findOne({
                clientId: client._id,
                clientRole: "client_master_admin",
            });
            if (
                master &&
                JSON.stringify([...(master.productAccess || [])].sort()) !==
                    JSON.stringify([...(client.productAccess || [])].sort())
            ) {
                master.productAccess = client.productAccess;
                master.tokenVersion = (master.tokenVersion || 0) + 1;
                await master.save();
            }
            return { emailSent: false, alreadyActive: master?.accountStatus === "active" };
        }
        const email = client.administrator?.email?.trim().toLowerCase();
        const existing = await models.User.findOne({ email });
        if (existing) {
            if (
                String(existing.clientId) !== String(client._id) ||
                existing.agencyId ||
                existing.adminLevel === "master"
            )
                throw new ApiError(
                    409,
                    "The administrator email belongs to another account scope.",
                );
            if (!["active", "invited"].includes(existing.accountStatus))
                throw new ApiError(
                    409,
                    "This administrator account is not eligible for assignment.",
                );
            existing.role = "admin";
            existing.clientRole = "client_master_admin";
            existing.adminLevel = "standard";
            existing.adminApprovalStatus = "approved";
            existing.productAccess = client.productAccess;
            existing.tokenVersion = (existing.tokenVersion || 0) + 1;
            await existing.save();
            if (existing.accountStatus === "active")
                return { emailSent: false, alreadyActive: true };
            // Preserve the existing account and use the same invitation issuance path.
            const { renewInvitation } = await import("../tenancy/tenancy.service.js");
            return renewInvitation({
                user: existing,
                client,
                actorId,
                models,
                authUrl: client.domains.auth,
            });
        }
        const result = await inviteUser({
            client,
            actorId,
            name: client.administrator.name,
            email,
            productKeys: client.productAccess,
            models,
            authUrl: client.domains.auth,
        });
        return { emailSent: result.emailSent, userId: result.user.id };
    });
}
