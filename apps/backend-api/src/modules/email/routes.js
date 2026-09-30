import express from "express";
import config from "../../config/env.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import { sendWelcomeEmail } from "../../services/email.service.js";

const router = express.Router();

/** Temporary local/test endpoint. It is disabled in production to prevent abuse. */
router.post(
    "/",
    asyncHandler(async (req, res) => {
        if (config.IS_PRODUCTION) {
            return res.status(404).json({ status: "error", message: "Not found" });
        }

        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ status: "error", message: "A valid email is required" });
        }

        const result = await sendWelcomeEmail({
            to: email,
            customerName: req.body?.customerName || "Traveller",
            dashboardUrl: config.SHELL_URL,
        });

        return res.status(result.success ? 200 : 502).json({
            status: result.success ? "success" : "error",
            message: result.message,
            ...(result.messageId ? { messageId: result.messageId } : {}),
            ...(!result.success ? { code: result.code, details: result.details } : {}),
        });
    }),
);

export default router;
