import express from "express";
import {
    getTripHome,
    getTrips,
    getTrip,
    getTripPricing,
    getTripAvailability,
} from "./controllers/tripController.js";
import { getTripDetailsPage } from "./controllers/tripPageController.js";
import { getTripDetailsWidget } from "./controllers/tripWidgetController.js";
import { getInternationalTrips } from "./controllers/internationalTripsController.js";
import {
    listAdminTrips,
    createTrip,
    updateTrip,
    verifyTrip,
    deleteTrip,
    deleteAllTrips,
    duplicateTrip,
} from "./controllers/adminTripController.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { loadAccessContext, requirePermission } from "../tenancy/policy.js";
import { PERMISSIONS } from "../tenancy/permissions.js";

const router = express.Router();

router.get("/home.json", getTripHome);
router.get("/trips.json", getTrips);
router.get("/trips/:tripRef.json", getTrip);
router.post("/trips/:tripRef/pricing", getTripPricing);
router.get("/trips/:tripRef/availability", getTripAvailability);
router.get("/international-trips.json", getInternationalTrips);
router.get("/trip-details-page.json", getTripDetailsPage);
router.get("/trips.json/:tripRef/widgets/:widgetFile.json", getTripDetailsWidget);

router.get(
    "/admin/trips",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_VIEW_OWN, PERMISSIONS.TRIP_VIEW_AGENCY),
    listAdminTrips,
);
router.post(
    "/admin/trips",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_CREATE),
    createTrip,
);
router.put(
    "/admin/trips/:id",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY),
    updateTrip,
);
router.post(
    "/admin/trips/:id/verify",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_AGENCY),
    verifyTrip,
);
router.post(
    "/admin/trips/:id/duplicate",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_CREATE),
    duplicateTrip,
);
router.delete(
    "/admin/trips/:id",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_ARCHIVE_OWN, PERMISSIONS.TRIP_ARCHIVE_AGENCY),
    deleteTrip,
);
router.delete(
    "/admin/trips",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.AGENCY_DELETE),
    deleteAllTrips,
);

export default router;
