import mongoose from "mongoose";
import config from "../config/index.js";
import { API_ROUTES } from "../shared/constants/index.js";
import authRoutes from "../modules/auth/routes.js";
import tourRoutes from "../modules/tours/routes.js";
import formsRouter from "../modules/forms/routes.js";
import filtersRoutes from "../modules/tours/filtersRoutes.js";
import chatRoutes from "../modules/chat/routes.js";
import quoteRoutes from "../modules/bookings/quoteRoutes.js";
import portalRoutes from "../modules/portal/routes.js";
import pageDefinitionRoutes from "../modules/pageDefinitions/routes.js";
import toursPageRoutes from "../modules/tours/pageRoutes.js";
import trevioRoutes from "../modules/trevio/routes.js";
import trevistaRoutes from "../modules/trevista/routes.js";
import masterDataRoutes from "../modules/masterData/routes.js";
import clientRoutes from "../modules/clients/routes.js";
import searchRoutes from "../modules/search/routes.js";
import testEmailRoutes from "../modules/email/routes.js";
import tenancyRoutes from "../modules/tenancy/routes.js";
import supportRoutes from "../modules/support/routes.js";
import locationRoutes from "../modules/locations/routes.js";

const getDbHealth = () => {
    const readyState = mongoose.connection.readyState;
    return {
        readyState,
        status:
            ["disconnected", "connected", "connecting", "disconnecting"][readyState] || "unknown",
        name: mongoose.connection.name || null,
    };
};

export default function registerRoutes(app) {
    app.get("/health", (req, res) =>
        res.status(200).json({
            status: "ok",
            env: config.NODE_ENV,
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        }),
    );
    app.get("/health/live", (req, res) => res.status(200).json({ status: "ok" }));
    app.get("/health/ready", (req, res) => {
        const db = getDbHealth();
        return res.status(db.readyState === 1 ? 200 : 503).json({
            status: db.readyState === 1 ? "ready" : "not_ready",
            env: config.NODE_ENV,
            db,
        });
    });
    app.get("/", (req, res) => res.send(`${config.APP_NAME} API is running`));
    app.get("/api/breadcrumb.json", (req, res) =>
        res.json({
            status: "success",
            message: "OK",
            componentData: {
                root: { label: "Trevista", path: "/trevista" },
            },
        }),
    );

    app.use(API_ROUTES.AUTH, authRoutes);
    app.use(API_ROUTES.API, portalRoutes);
    app.use(API_ROUTES.API, searchRoutes);
    app.use("/api/test/email", testEmailRoutes);
    app.use("/api/tenancy", tenancyRoutes);
    app.use("/api/support", supportRoutes);
    app.use("/api/locations", locationRoutes);
    app.use("/api/pages", pageDefinitionRoutes);
    app.use(API_ROUTES.TOURS, tourRoutes);
    app.use("/api/trevio", trevioRoutes);
    app.use("/api/trevista", trevistaRoutes);
    app.use("/api/master-data", masterDataRoutes);
    app.use(API_ROUTES.CHAT, chatRoutes);
    app.use(API_ROUTES.API, formsRouter);
    app.use(API_ROUTES.API, filtersRoutes);
    app.use(API_ROUTES.API, toursPageRoutes);
    app.use("/api/quotes", quoteRoutes);
    app.use(API_ROUTES.CLIENTS, clientRoutes);
}
