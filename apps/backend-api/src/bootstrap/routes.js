import mongoose from "mongoose";
import config from "../config/index.js";
import { API_ROUTES } from "../constants/routes.js";
import authRoutes from "../modules/auth/routes.js";
import tourRoutes from "../modules/tours/routes.js";
import heroRoutes from "../modules/portal/heroRoutes.js";
import serviceRoutes from "../modules/services/routes.js";
import formsRouter from "../modules/forms/routes.js";
import filtersRoutes from "../modules/tours/filtersRoutes.js";
import chatRoutes from "../modules/chat/routes.js";
import bookingRoutes from "../modules/bookings/routes.js";
import adminBookingRoutes from "../modules/bookings/adminRoutes.js";
import notificationRoutes from "../modules/notifications/routes.js";
import portalRoutes from "../modules/portal/routes.js";
import pageDefinitionRoutes from "../modules/pageDefinitions/routes.js";

const getDbHealth = () => {
  const readyState = mongoose.connection.readyState;
  return {
    readyState,
    status: ["disconnected", "connected", "connecting", "disconnecting"][readyState] || "unknown",
    name: mongoose.connection.name || null,
  };
};

export default function registerRoutes(app) {
  app.get("/health", (req, res) => res.status(200).json({
    status: "ok",
    env: config.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }));
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

  app.use(API_ROUTES.AUTH, authRoutes);
  app.use(API_ROUTES.API, portalRoutes);
  app.use("/api/pages", pageDefinitionRoutes);
  app.use(API_ROUTES.TOURS, tourRoutes);
  app.use(API_ROUTES.HERO, heroRoutes);
  app.use(API_ROUTES.SERVICES, serviceRoutes);
  app.use(API_ROUTES.CHAT, chatRoutes);
  app.use(API_ROUTES.API, formsRouter);
  app.use(API_ROUTES.API, filtersRoutes);
  app.use(API_ROUTES.BOOKINGS, bookingRoutes);
  app.use(API_ROUTES.ADMIN_BOOKINGS, adminBookingRoutes);
  app.use(API_ROUTES.NOTIFICATIONS, notificationRoutes);
}
