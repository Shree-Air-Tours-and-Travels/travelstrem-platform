import express from "express";
import { getPaymentProvider } from "../../core/financial-engine/providers/registry.js";
import { authMiddleware } from "../../shared/auth/index.js";
import { getPortalScope } from "../../core/auth/portalSession.js";
import {
    createSession,
    sessionDetails,
    createOrder,
    verifyCallback,
    handleWebhook,
} from "./service.js";
import logger from "../../shared/logger/index.js";
const route = (handler) => async (req, res) => {
    try {
        res.setHeader("Cache-Control", "no-store, private");
        res.json({ status: "success", data: await handler(req) });
    } catch (error) {
        logger.error("[Payments] request failed", {
            path: req.route?.path,
            status: error.status || 500,
            message: error.message,
        });
        res.status(error.status || 500).json({
            status: "error",
            message: error.status >= 500
                ? "We cannot open payment right now. Please try again later or contact support."
                : error.status
                ? error.message
                : "Payment could not be processed. Please retry or contact support.",
        });
    }
};
export const webhookRouter = express.Router();
webhookRouter.post(
    "/:provider",
    route(async (req) => {
        const credentials = getPaymentProvider(req.params.provider).webhookCredentials(req.headers);
        await handleWebhook(
            req.params.provider,
            req.rawBody,
            credentials.signature,
            credentials.eventId,
        );
        return { received: true };
    }),
);
const router = express.Router();
router.use(authMiddleware);
router.use((req, res, next) => {
    if (req.method === "POST" && !req.is("application/json")) return res.status(415).json({ status: "error", message: "Payment requests require JSON." });
    next();
});
router.post(
    "/sessions",
    route((req) => createSession(req.body, req.user, getPortalScope(req))),
);
router.get(
    "/sessions/:id",
    route((req) => sessionDetails(req.params.id, req.user)),
);
router.post(
    "/sessions/:id/order",
    route((req) => createOrder(req.params.id, req.user)),
);
router.post(
    "/sessions/:id/callback",
    route((req) => verifyCallback(req.params.id, req.user, req.body)),
);
export default router;
