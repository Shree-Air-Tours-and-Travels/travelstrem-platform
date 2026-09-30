import express from "express";
import {
    getAppHeaderConfig,
    getHeaderConfig,
    getNavigationConfig,
    getPageConfig,
    getSession,
    getSidebarConfig,
    getUserSession,
} from "./controllers/portalController.js";

const router = express.Router();

router.get("/session", getSession);
router.get("/header-config", getHeaderConfig);
router.get("/sidebar-config", getSidebarConfig);
router.get("/app-header-config", getAppHeaderConfig);
router.get("/navigation-config", getNavigationConfig);
router.get("/page-config", getPageConfig);

router.get("/user-session.json", getUserSession);
router.get("/header.json", getHeaderConfig);
router.get("/sidebar.json", getSidebarConfig);
router.get("/app-header.json", getAppHeaderConfig);
router.get("/navigation.json", getNavigationConfig);

export default router;
