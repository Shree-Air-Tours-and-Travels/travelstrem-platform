import express from "express";
import { getHeaderConfig, getPageConfig, getSession, getUserSession } from "./controller.js";

const router = express.Router();

router.get("/session", getSession);
router.get("/header-config", getHeaderConfig);
router.get("/page-config", getPageConfig);

router.get("/user-session.json", getUserSession);
router.get("/header.json", getHeaderConfig);

export default router;
