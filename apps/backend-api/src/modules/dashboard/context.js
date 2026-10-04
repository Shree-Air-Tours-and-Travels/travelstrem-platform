import { tenantConfiguration } from "../clients/configuration.js";
import { resolveAccessContext } from "../tenancy/policy.js";
import Client from "../clients/models/Client.js";
import Product from "../tenancy/models/Product.js";
import { normalizeProductKeys } from "../tenancy/productCatalog.js";
import { customerTenantId } from "../tenancy/customerScope.js";
import ApiError from "../../shared/errors/ApiError.js";
import { resolveBrand } from "../branding/service.js";

export async function resolveDashboardContext(access, requestedProduct = "") {
    const { user, agency, permissions, role } = access;
    if (!permissions.has("dashboard:view"))
        throw new ApiError(403, "Dashboard access is not allowed.");
    const client = user.clientId ? await Client.findById(user.clientId).lean() : null;
    if (user.clientId && (!client || client.status !== "active"))
        throw new ApiError(403, "Client access is not active.");
    if (user.agencyId && !agency) throw new ApiError(403, "Agency access is not active.");
    const catalogue = await Product.find({ status: "active", hidden: { $ne: true } })
        .select("key name services metadata.dashboard")
        .lean();
    const licences = client
        ? normalizeProductKeys(client.productAccess)
        : agency
          ? normalizeProductKeys(agency.productAccess)
          : catalogue.map((product) => product.key);
    const userProducts = normalizeProductKeys(user.productAccess);
    let products = catalogue.filter(
        ({ key }) =>
            licences.includes(key) &&
            (!client || !agency || normalizeProductKeys(agency.productAccess).includes(key)) &&
            (!userProducts.length || userProducts.includes(key)),
    );
    if (requestedProduct) {
        if (
            typeof requestedProduct !== "string" ||
            !products.some(({ key }) => key === requestedProduct)
        )
            throw new ApiError(403, "This product is not available to your account.");
        products = products.filter(({ key }) => key === requestedProduct);
    }
    if (client)
        products = products.map((product) => ({
            ...product,
            services: (product.services || []).filter(
                (service) =>
                    client.modules?.[product.key]?.includes(service),
            ),
        }));
    const tenantId = customerTenantId(user);
    const brand = await resolveBrand(client);
    return {
        tenantId,
        accountModules: client
            ? tenantConfiguration(client).accountModules
            : ["dashboard", "bookings", "wishlist", "profile", "notifications", "support"],
        partnerEnabled: client?.partnerEnabled || false,
        theme: client ? tenantConfiguration(client).theme : {},
        userId: String(user._id),
        products: products.map(({ key }) => key),
        services: [...new Set(products.flatMap((product) => product.services || []))],
        tenantName: client?.globalBrand?.label || client?.name || agency?.agencyName || brand.name,
        contact: {
            email: client?.contactEmail || agency?.contactEmail || "",
            phone: client?.contactPhone || agency?.contactPhone || "",
        },
        roles: [role],
        locale: client?.locale || agency?.settings?.locale || "en-IN",
        currency: client?.currency || agency?.settings?.currency || "INR",
        permissions: [...permissions],
        productDefinitions: products,
        branding: {
            ...brand,
            logo: client ? brand.logoSrc : agency?.logo || brand.logoSrc,
            displayName:
                client?.globalBrand?.label || client?.name || agency?.agencyName || brand.name,
            theme: client?.slug || "travelstrem",
        },
    };
}

export async function resolveCustomerDashboardContext(
    userId,
    permission = "booking:view",
    requestedProduct = "",
) {
    const context = await resolveDashboardContext(
        await resolveAccessContext(userId),
        requestedProduct,
    );
    if (!context.permissions.includes(permission))
        throw new ApiError(403, "This dashboard action is not allowed.");
    return context;
}
