import express from "express";
import { listNotifications, markNotificationRead } from "../modules/notifications/notificationController.js";

const router = express.Router();

router.get("/", listNotifications);
router.post("/read-all", markNotificationRead);
router.post("/:id/read", markNotificationRead);

export default router;
