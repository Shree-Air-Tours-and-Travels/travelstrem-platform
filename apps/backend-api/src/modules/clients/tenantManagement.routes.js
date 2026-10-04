import { integrationReadiness } from "./integrationReadiness.js";
import { validateBrand } from "../branding/service.js";
import express from "express";
import mongoose from "mongoose";
import User from "../auth/models/User.js";
import Client from "./models/Client.js";
import authMiddleware from "../../core/auth/authMiddleware.js";
import { inviteUser, renewInvitation } from "../tenancy/tenancy.service.js";
import { tenantConfiguration, isClientMaster } from "./configuration.js";
import { ROLE_PERMISSIONS } from "../tenancy/permissions.js";
import { audit } from "../tenancy/audit.service.js";
import integrationProfileRoutes from "../integrations/routes.js";

const router = express.Router();
const handle = (fn) => async (req, res, next) => {
    try {
        await fn(req, res);
    } catch (error) {
        next(error);
    }
};
const fail = (status, message, field) => {
    throw Object.assign(new Error(message), {
        status,
        ...(field ? { details: { [field]: message } } : {}),
    });
};
router.use(authMiddleware, (req, res, next) => {
    if (!req.tenant?.client || !isClientMaster(req.user))
        return res
            .status(403)
            .json({ status: "error", message: "Client master administrator access is required." });
    res.setHeader("Cache-Control", "private, no-store");
    next();
});
const send = (res, data) => res.json({ status: "success", componentData: { data } });
router.use("/integration-profile", integrationProfileRoutes);
router.get(
    "/integrations",
    handle(async (req, res) =>
        send(res, integrationReadiness(req.tenant.client, req.integrationProfile)),
    ),
);
router.get(
    "/",
    handle(async (req, res) => send(res, tenantConfiguration(req.tenant.client))),
);
router.patch(
    "/",
    handle(async (req, res) => {
        const { name, logoSrc, primaryColor, darkPrimaryColor, theme = {} } = req.body;
        const brand = validateBrand(req.body);
        const extraBrand = Object.fromEntries(
            ["logoDarkSrc", "faviconSrc", "windowTitle"]
                .filter((key) => brand[key] !== undefined)
                .map((key) => [`globalBrand.${key}`, brand[key]]),
        );
        if (typeof name !== "string" || !name.trim() || name.length > 200)
            fail(422, "Enter a company display name.", "name");
        let logo;
        try {
            logo = new URL(logoSrc);
        } catch {
            fail(422, "Enter a valid logo URL.", "logoSrc");
        }
        if (logo.protocol !== "https:" || logo.username || logo.password)
            fail(422, "The logo must use HTTPS.", "logoSrc");
        const colors = { primaryColor, darkPrimaryColor };
        const mode = theme.mode ?? req.tenant.client.theme?.mode ?? "light";
        const allowSwitching =
            theme.allowSwitching ?? req.tenant.client.theme?.allowSwitching ?? true;
        if (!["light", "dark"].includes(mode) || typeof allowSwitching !== "boolean")
            fail(422, "Invalid theme mode configuration.", "themeMode");
        for (const [field, value] of Object.entries(colors))
            if (!/^#[a-f\d]{6}$/i.test(value || ""))
                fail(422, "Use six-digit hexadecimal colours.", field);
        const palette = {};
        for (const mode of ["light", "dark"]) {
            palette[mode] = {};
            for (const [token, value] of Object.entries(theme[mode] || {})) {
                if (!/^--color-[a-z-]+$/.test(token) || !/^#[a-f\d]{6}$/i.test(value))
                    fail(422, "Theme entries must be colour tokens with hexadecimal values.");
                palette[mode][token] = value;
            }
        }
        const client = await Client.findOneAndUpdate(
            { _id: req.tenant.id },
            {
                $set: {
                    ...extraBrand,
                    "globalBrand.label": name.trim(),
                    "globalBrand.logoSrc": logo.href,
                    theme: { ...colors, ...palette, mode, allowSwitching },
                },
                $inc: { configVersion: 1 },
            },
            { new: true, runValidators: true },
        ).lean();
        await audit(req, {
            action: "tenant.configuration.updated",
            entityType: "Client",
            entityId: client._id,
            before: tenantConfiguration(req.tenant.client),
            after: tenantConfiguration(client),
        });
        send(res, tenantConfiguration(client));
    }),
);
router.get(
    "/members",
    handle(async (req, res) => {
        const members = await User.find({
            clientId: req.tenant.id,
            clientRole: { $in: ["client_master_admin", "client_admin", "client_agent"] },
        })
            .select("name email clientRole accountStatus productAccess permissionGrants")
            .sort({ name: 1 })
            .lean();
        send(res, {
            members,
            products: req.tenant.client.productAccess,
            roles: [
                { value: "client_admin", label: "Client admin — business operations" },
                {
                    value: "client_master_admin",
                    label: "Client master admin — company administration",
                },
            ],
            permissions: ROLE_PERMISSIONS.client_admin,
        });
    }),
);
const accessValues = (req) => {
    const { clientRole, productAccess } = req.body;
    if (!["client_master_admin", "client_admin"].includes(clientRole))
        fail(422, "Select a valid company role.", "clientRole");
    if (
        !Array.isArray(productAccess) ||
        productAccess.some((key) => !req.tenant.client.productAccess.includes(key))
    )
        fail(422, "Only enrolled products may be assigned.", "productAccess");
    if (!productAccess.length) fail(422, "Assign at least one product.", "productAccess");
    return { clientRole, productAccess: [...new Set(productAccess)] };
};
router.post(
    "/members",
    handle(async (req, res) => {
        const access = accessValues(req);
        const name = String(req.body.name || "").trim();
        if (!name || name.length > 200) fail(422, "Enter a member name.", "name");
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            fail(422, "Enter a valid email address.", "email");
        const existing = await User.findOne({ email });
        if (existing) {
            // This model belongs to the client runtime database, never the platform database.
            const updated = await User.findOneAndUpdate(
                {
                    _id: existing._id,
                    clientId: req.tenant.id,
                    role: "member",
                    clientRole: { $in: ["none"] },
                    agencyId: null,
                    accountStatus: "active",
                },
                {
                    $set: {
                        ...access,
                        role: "admin",
                        adminLevel: "standard",
                        adminApprovalStatus: "approved",
                    },
                    $inc: { tokenVersion: 1 },
                },
                { new: true, runValidators: true },
            );
            if (!updated)
                fail(
                    409,
                    "This email already belongs to a company member or an account that cannot be assigned. Manage their existing access.",
                    "email",
                );
            return send(res, { accessUpdated: true });
        }
        const result = await inviteUser({
            client: req.tenant.client,
            clientRole: access.clientRole,
            actorId: req.user.sub,
            name,
            email: req.body.email,
            productKeys: access.productAccess,
            authUrl: req.tenant.client.domains.auth,
        });
        send(res, { emailSent: result.emailSent });
    }),
);
router.post(
    "/members/:id/resend",
    handle(async (req, res) => {
        const user = await User.findOne({
            _id: req.params.id,
            clientId: req.tenant.id,
            clientRole: { $in: ["client_master_admin", "client_admin"] },
        });
        if (!user) fail(404, "Company member not found.");
        const result = await renewInvitation({
            user,
            client: req.tenant.client,
            actorId: req.user.sub,
            authUrl: req.tenant.client.domains.auth,
        });
        send(res, { emailSent: result.emailSent });
    }),
);
router.patch(
    "/members/:id",
    handle(async (req, res) => {
        const access = accessValues(req);
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                // Serialize role changes for this company to protect the last active master admin.
                await Client.updateOne(
                    { _id: req.tenant.id },
                    { $inc: { configVersion: 1 } },
                    { session },
                );
                const user = await User.findOne({
                    _id: req.params.id,
                    clientId: req.tenant.id,
                    clientRole: { $in: ["client_master_admin", "client_admin", "client_agent"] },
                }).session(session);
                if (!user) fail(404, "Company member not found.");
                const status = req.body.accountStatus || user.accountStatus;
                if (
                    !["active", "invited", "deactivated"].includes(status) ||
                    (user.accountStatus === "invited" && status === "active")
                )
                    fail(422, "An invitation must be activated by its recipient.");
                if (
                    user.clientRole === "client_master_admin" &&
                    user.accountStatus === "active" &&
                    (access.clientRole !== "client_master_admin" || status !== "active")
                ) {
                    if (
                        (await User.countDocuments({
                            clientId: req.tenant.id,
                            clientRole: "client_master_admin",
                            accountStatus: "active",
                        }).session(session)) <= 1
                    )
                        fail(409, "Keep at least one active client master administrator.");
                }
                Object.assign(user, access, {
                    role: "admin",
                    adminLevel: "standard",
                    adminApprovalStatus: "approved",
                    accountStatus: status,
                    tokenVersion: (user.tokenVersion || 0) + 1,
                });
                await user.save({ session });
            });
        } finally {
            await session.endSession();
        }
        send(res, { updated: true });
    }),
);
export default router;
