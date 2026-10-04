import { PlatformBrand, resolveBrand, validateBrand } from "../branding/service.js";
import express from "express";
import {
    getClients,
    getClient,
    deleteClient,
    uploadClientLogo,
    getClientBySlug,
    listClientMembers,
    assignClientMember,
    removeClientMember,
} from "./controllers/clientController.js";
import { upload } from "../../services/cloudinary.js";
import authMiddleware from "../../shared/auth/middleware.js";
import User from "../auth/models/User.js";

import * as registration from "./registration.controller.js";
import { provisionClient } from "./tenantDatabase.service.js";
import Client from "./models/Client.js";

const router = express.Router();

const requirePlatformAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?.sub || req.user?.id)
            .select("role adminLevel clientId accountStatus tokenVersion")
            .lean();
        if (
            !user ||
            user.role !== "admin" ||
            (user.accountStatus || "active") !== "active" ||
            user.adminLevel !== "master" ||
            user.clientId ||
            process.env.TENANT_CLIENT_ID ||
            Number(user.tokenVersion || 0) !== Number(req.user?.tokenVersion || 0)
        )
            return res.status(403).json({ status: "error", message: "Access denied" });
        return next();
    } catch (error) {
        return next(error);
    }
};

router.get("/by-slug/:slug", getClientBySlug);
router.use(authMiddleware, requirePlatformAdmin);
router.get("/platform-brand", async (req, res, next) => {
    try {
        res.setHeader("Cache-Control", "no-store");
        res.json({ status: "success", componentData: { data: await resolveBrand() } });
    } catch (error) {
        next(error);
    }
});
router.patch("/platform-brand", async (req, res, next) => {
    try {
        await PlatformBrand.updateOne(
            { _id: "platform" },
            { $set: { ...validateBrand(req.body || {}), updatedBy: req.user.sub } },
            { runValidators: true },
        );
        res.json({ status: "success", componentData: { data: await resolveBrand() } });
    } catch (error) {
        next(error);
    }
});
router.get("/registrations", registration.listRegistrations);
router.post("/registrations", registration.startRegistration);
router.get("/registrations/:registrationId", registration.getRegistration);
router.delete("/registrations/:registrationId", registration.deleteRegistration);
router.patch("/registrations/:registrationId", registration.saveRegistration);
router.post("/registrations/:registrationId/provision", registration.finishRegistration);
router.post("/:id/provision", async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ status: "error", message: "Client not found." });
        const result = await provisionClient(client, req.user.sub);
        client.provisioning = { status: "ready", emailSent: result.emailSent };
        await client.save();
        res.json({
            status: "success",
            componentData: {
                data: { emailSent: result.emailSent, alreadyActive: result.alreadyActive || false },
            },
        });
    } catch (error) {
        next(error);
    }
});
router.get("/", getClients);
router.get("/:id/members", listClientMembers);
router.post("/:id/members", assignClientMember);
router.delete("/:id/members/:userId", removeClientMember);
router.get("/:id", getClient);
router.delete("/:id", deleteClient);
router.post("/:id/logo", upload.single("image"), uploadClientLogo);

export default router;
