import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import { listNotifications, markNotificationRead } from "./controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, listNotifications);
router.post("/read-all", authMiddleware, markNotificationRead);
router.post("/:id/read", authMiddleware, markNotificationRead);

export default router;
