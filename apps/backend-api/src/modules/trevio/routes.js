import express from "express";
import { getTrevioHome, getTrevioTrips } from "./controllers/trevioController.js";
import { getTripDetailsPage } from "./controllers/tripPageController.js";
import { getTripDetailsWidget } from "./controllers/tripWidgetController.js";
import { getInternationalTrips } from "./controllers/internationalTripsController.js";

const router = express.Router();

router.get("/home.json", getTrevioHome);
router.get("/trips.json", getTrevioTrips);
router.get("/international-trips.json", getInternationalTrips);
router.get("/trip-details-page.json", getTripDetailsPage);
router.get("/trips.json/:tripRef/widgets/:widgetFile.json", getTripDetailsWidget);

export default router;
