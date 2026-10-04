import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../../core/auth/authMiddleware.js";
import { loadAccessContext } from "../tenancy/policy.js";
import { customerScopeQuery } from "../tenancy/customerScope.js";
import Notification from "../tenancy/models/Notification.js";
import Favorite from "../tours/models/Favorite.js";
import { resolveDashboardContext } from "./context.js";
import { buildDashboardHome, buildDashboardPage, navigationFor } from "./service.js";
import { buildOverviewWidget } from "./overview.js";

const router = express.Router();
router.use(authMiddleware, loadAccessContext);
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    next();
});
const handle = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};
router.get(
    "/home",
    handle(async (req, res) => {
        const data = await buildDashboardHome(req.access, req.query.product);
        res.json({ status: "success", success: true, data });
    }),
);
router.get(
    "/overview/widgets/:widget",
    handle(async (req, res) => {
        const context = await resolveDashboardContext(req.access, req.query.product);
        const data = await buildOverviewWidget(
            context,
            navigationFor(context),
            req.access.user,
            req.params.widget,
            req.query.period,
        );
        res.json({ status: "success", success: true, data });
    }),
);
router.get(
    "/pages/:section",
    handle(async (req, res) => {
        const data = await buildDashboardPage(req.access, req.params.section, req.query.product);
        res.json({ status: "success", success: true, data });
    }),
);
router.patch(
    "/notifications/:id/read",
    handle(async (req, res) => {
        const context = await resolveDashboardContext(req.access);
        if (!context.permissions.includes("notifications:view")) return res.sendStatus(403);
        if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
        const result = await Notification.updateOne(
            {
                ...customerScopeQuery(context),
                _id: req.params.id,
                userId: context.userId,
                portal: "customer",
            },
            { $set: { readAt: new Date() } },
        );
        if (!result.matchedCount) return res.sendStatus(404);
        res.json({ status: "success", success: true });
    }),
);
router.delete(
    "/wishlist/:id",
    handle(async (req, res) => {
        const context = await resolveDashboardContext(req.access);
        if (!context.permissions.includes("wishlist:view")) return res.sendStatus(403);
        if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
        const result = await Favorite.deleteOne({
            ...customerScopeQuery(context),
            _id: req.params.id,
            userId: context.userId,
            product: { $in: context.products },
        });
        if (!result.deletedCount) return res.sendStatus(404);
        res.json({ status: "success", success: true });
    }),
);
export default router;
