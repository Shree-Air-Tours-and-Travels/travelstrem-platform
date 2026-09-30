import express from "express";
import {
    getToursHomePage,
    getToursPage,
    getTourDetailsPage,
    getCustomizeTourPage,
    getToursManagementPage,
} from "./controllers/pageController.js";
import { getWidget, getTourManagementListingWidget } from "./controllers/widgetController.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { loadAccessContext, requirePermission } from "../tenancy/policy.js";
import { PERMISSIONS } from "../tenancy/permissions.js";

const router = express.Router();

router.get("/tours-home-page.json", getToursHomePage);
router.get("/tours-page.json", getToursPage);
router.get("/tour-details-page.json", getTourDetailsPage);
router.get("/customize-tour-page.json", getCustomizeTourPage);
router.get("/tours-management-page.json", getToursManagementPage);
// Declared before the catch-all: this widget carries agent-scoped DATA and
// therefore requires the same identity/permission chain as GET /tours.json.
router.get(
    "/tour-management-listing.json",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_VIEW_OWN, PERMISSIONS.TRIP_VIEW_AGENCY),
    getTourManagementListingWidget,
);
router.get("/:widgetFile.json", getWidget);

export default router;
