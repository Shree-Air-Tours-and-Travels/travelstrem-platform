import express from "express";
import { getTrevioHome, getTrevioTrips, getTrevioTrip, getTrevioPricing, getTrevioAvailability } from "./controllers/trevioController.js";
import { getTripDetailsPage } from "./controllers/tripPageController.js";
import { getTripDetailsWidget } from "./controllers/tripWidgetController.js";
import { getInternationalTrips } from "./controllers/internationalTripsController.js";
import { createTrevioBooking, getTrevioBooking, recordTrevioPayment } from "./controllers/trevioBookingController.js";
import { listAdminTrips, createTrip, updateTrip, deleteTrip, deleteAllTrips } from "./controllers/adminTripController.js";
import authMiddleware from "../../shared/auth/middleware.js";

const router = express.Router();

router.get("/home.json", getTrevioHome);
router.get("/trips.json", getTrevioTrips);
router.get("/trips/:tripRef.json", getTrevioTrip);
router.post("/trips/:tripRef/pricing", getTrevioPricing);
router.get("/trips/:tripRef/availability", getTrevioAvailability);
router.post("/bookings", createTrevioBooking);
router.get("/bookings/:bookingId", getTrevioBooking);
router.post("/bookings/:bookingId/payment", recordTrevioPayment);
router.get("/international-trips.json", getInternationalTrips);
router.get("/trip-details-page.json", getTripDetailsPage);
router.get("/trips.json/:tripRef/widgets/:widgetFile.json", getTripDetailsWidget);

router.get("/admin/trips", authMiddleware, listAdminTrips);
router.post("/admin/trips", authMiddleware, createTrip);
router.put("/admin/trips/:id", authMiddleware, updateTrip);
router.delete("/admin/trips/:id", authMiddleware, deleteTrip);
router.delete("/admin/trips", authMiddleware, deleteAllTrips);

export default router;
