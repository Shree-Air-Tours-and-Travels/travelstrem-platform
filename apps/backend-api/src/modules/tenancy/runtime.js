import { assertTenantDatabaseAccess } from "../clients/tenantDatabaseAccess.js";
import { resolveBrand } from "../branding/service.js";
import mongoose from "mongoose";
import Client from "../clients/models/Client.js";
import { tenantDeployment } from "../clients/configuration.js";
import {
    loadTenantIntegrationProfile,
    runWithTenantIntegrationContext,
} from "../integrations/runtime.js";

// A backend runtime owns exactly one physical database. Browser input never selects it.
export async function resolveRuntimeTenant(req, res, next) {
    try {
        if (!process.env.TENANT_CLIENT_ID) {
            req.tenant = { id: "travelstrem", platform: true };
            req.brand = await resolveBrand();
            return runWithTenantIntegrationContext(
                { client: null, profile: null, tenantId: "travelstrem" },
                next,
            );
        }
        const client = await Client.findOne({
            _id: process.env.TENANT_CLIENT_ID,
            status: "active",
        }).lean();
        if (!client || (client.database?.name && client.database.name !== mongoose.connection.name))
            return res
                .status(503)
                .json({ status: "error", message: "Tenant configuration is unavailable." });
        // Recheck grants when platform-owned entitlements change.
        const accessVersion = JSON.stringify([client.configVersion, client.partnerEnabled, client.productAccess, client.modules, client.accountModules]);
        if (mongoose.connection.tenantAccessVersion !== accessVersion) {
            await assertTenantDatabaseAccess(client, mongoose.connection);
            mongoose.connection.tenantAccessVersion = accessVersion;
        }
        req.tenant = { id: String(client._id), platform: false, client };
        req.brand = await resolveBrand(client);
        const deployment = tenantDeployment(client);
        if (
            process.env.TENANT_PRODUCT &&
            (deployment.mode !== "standalone" || deployment.product !== process.env.TENANT_PRODUCT)
        )
            return res.status(403).json({
                status: "error",
                message: "This tenant must use its configured App Shell deployment.",
            });
        if (req.query.clientId && req.query.clientId !== String(client._id))
            return res
                .status(403)
                .json({ status: "error", message: "Tenant switching is not allowed." });
        const path = req.path.replace(/^\/api/, "");
        if (/^\/(clients|test\/email)(\/|$)/.test(path))
            return res.status(403).json({
                status: "error",
                message: "This operation is available on the platform only.",
            });
        const builderProduct = /^\/tours(?:\.json)?\/(?:builder(?:\/|$)|upload(?:-url)?$)/.test(
            path,
        )
            ? req.query.product || req.body?.productKey || "trevista"
            : null;
        if (builderProduct && !["trevio", "trevista"].includes(builderProduct))
            return res
                .status(403)
                .json({ status: "error", message: "This builder product is not supported." });
        const pageAliasProduct =
            /^\/(?:tours?-|tour-|customize-tour-|quick-filters|listing|filters).*\.json$/.test(path)
                ? "trevista"
                : null;
        const product =
            builderProduct ||
            pageAliasProduct ||
            (/^\/(tours(?:\.json)?|trevista|filters|customize-tour-page\.json)(\/|$)/.test(path)
                ? "trevista"
                : /^\/(trips|trevio)(\/|$)/.test(path)
                  ? "trevio"
                  : /^\/(trehub|flights|hotels)(\/|$)/.test(path)
                    ? "trehub"
                    : null);
        const pageProduct =
            /^\/pages\/(trevio|trevista|trehub|trecare|tours)(?:-remote)?(?:\/|$)/.exec(path)?.[1];
        const requested = [
            product,
            pageProduct === "tours" ? "trevista" : pageProduct,
            req.query.product,
            req.query.productKey,
            ({ "tours-remote": "trevista", "trevio-remote": "trevio", "trehub-remote": "trehub" })[String(req.query.pageKey || "").split("/")[0]],
            req.body?.product,
            req.body?.productKey,
            ...(["trevio", "trevista", "trehub", "trecare"].includes(req.query.app)
                ? [req.query.app]
                : []),
        ].filter(Boolean);
        if (requested.some((key) => typeof key !== "string" || !client.productAccess.includes(key)))
            return res
                .status(403)
                .json({ status: "error", message: "This product is not enabled for this tenant." });
        req.tenantProducts = requested;
        const service = /^\/(?:trehub\/)?(?:flights(?:\.json)?|flight-journey\.json)(\/|$)/.test(
            path,
        )
            ? "flights"
            : /^\/(?:trehub\/)?hotels(?:\.json)?(\/|$)/.test(path)
              ? "hotels"
              : product === "trevista"
                ? "tours"
                : product === "trevio"
                  ? "trips"
                  : null;
        if (
            service &&
            (!client.productAccess.includes(product) ||
                !client.modules?.[product]?.includes(service))
        )
            return res
                .status(403)
                .json({ status: "error", message: "This service is not enabled for this tenant." });
        if (req.method !== "GET" && /^\/tenancy\/products(?:\/|$)/.test(path))
            return res.status(403).json({
                status: "error",
                message: "Only the platform master admin can change product licensing.",
            });
        if (
            !client.partnerEnabled &&
            /^\/tenancy\/(agencies|partnership|users|deletion-requests|customers|reports|product-access-requests)/.test(path)
        )
            return res
                .status(403)
                .json({ status: "error", message: "Partner agency workflows are not enabled." });
        if (!client.partnerEnabled && /^\/auth\/(partner-agencies|agents)(\/|$)/.test(path))
            return res
                .status(403)
                .json({ status: "error", message: "Partner agency workflows are not enabled." });
        if (/^\/auth\/admins(\/|$)/.test(path))
            return res.status(403).json({
                status: "error",
                message: "Platform administrators are managed on the platform only.",
            });
        const accountModule = /\/(?:notifications)(\/|$)/.test(path)
            ? "notifications"
            : /\/(?:wishlist|favorites|favorite)(\/|$)/.test(path)
              ? "wishlist"
              : path.startsWith("/support")
            ? "support"
            : path.startsWith("/dashboard")
              ? "dashboard"
              : null;
        if (
            accountModule &&
            accountModule !== "dashboard" &&
            client.accountModules &&
            !client.accountModules.includes(accountModule)
        )
            return res
                .status(403)
                .json({ status: "error", message: "This module is not enabled for this tenant." });
        if (
            [
                req.query.service,
                req.body?.service,
                ...({ flight: ["flights"], hotel: ["hotels"], tour: ["tours"], trip: ["trips"] }[
                    req.body?.journeyType
                ] || []),
            ]
                .filter(Boolean)
                .some(
                    (serviceKey) =>
                        !Object.entries(client.modules || {}).some(
                            ([key, services]) =>
                                client.productAccess.includes(key) &&
                                (!requested.length || requested.includes(key)) &&
                                services.includes(serviceKey),
                        ),
                )
        )
            return res
                .status(403)
                .json({ status: "error", message: "This service is not enabled for this tenant." });
        const integrationProfile = await loadTenantIntegrationProfile(client);
        req.integrationProfile = integrationProfile;
        return runWithTenantIntegrationContext(
            { client, profile: integrationProfile, tenantId: String(client._id) },
            next,
        );
    } catch (error) {
        next(error);
    }
}
