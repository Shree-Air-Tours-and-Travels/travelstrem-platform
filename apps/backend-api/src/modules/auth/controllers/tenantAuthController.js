import Client from "../../clients/models/Client.js";
import Product from "../../tenancy/models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../../../shared/middleware/asyncHandler.js";
import ApiError from "../../../shared/errors/ApiError.js";
import { safeReturnUrl } from "../services/returnUrl.service.js";

const tenantExperience = async () => {
    if (!process.env.TENANT_CLIENT_ID) return null;
    const client = await Client.findOne({
        _id: process.env.TENANT_CLIENT_ID,
        status: "active",
    }).lean();
    if (!client) throw new ApiError(403, "This tenant or product is not active.");
    return client;
};

export const getExperience = asyncHandler(async (req, res) => {
    const client = await tenantExperience();
    const product = await Product.findOne({
        key: req.query.app || process.env.TENANT_PRODUCT,
        status: "active",
        hidden: { $ne: true },
    })
        .select("key name services")
        .lean();
    const companyName = req.brand.name;
    const partnerEnabled =
        !client ||
        (client.partnerEnabled &&
            client.productAccess.some((key) => ["trevio", "trevista"].includes(key)));
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
        status: "success",
        data: {
            ...req.brand,
            ...(client
                ? {
                      tenant: client.slug,
                      products: client.productAccess,
                      modules: client.modules,
                      name: companyName,
                      logoSrc: client.globalBrand?.logoSrc,
                      faviconSrc: client.globalBrand?.faviconSrc,
                      windowTitle: client.globalBrand?.windowTitle,
                  }
                : product
                  ? { product: product.key, name: product.name, services: product.services }
                  : { name: companyName }),
            header: {
                brand: {
                    ...req.brand,
                    subtitle: "Your journey starts here",
                },
                navigation: [],
            },
            accessRequest: partnerEnabled
                ? {
                      prompt: "Own or manage a travel agency?",
                      label: `Partner with ${companyName}`,
                      href: "/partnership",
                  }
                : null,
        },
    });
});

export const resolveReturn = asyncHandler(async (req, res) => {
    const client = await tenantExperience();
    if (client) {
        const user = await User.findById(req.user.sub).select("clientId").lean();
        if (String(user?.clientId) !== String(client._id))
            throw new ApiError(403, "This account does not belong to this tenant.");
    }
    res.json({
        status: "success",
        data: {
            returnTo: safeReturnUrl(req.body?.returnTo, req.user.portal || "customer"),
        },
    });
});
