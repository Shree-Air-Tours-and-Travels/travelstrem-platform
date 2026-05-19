import express from "express";
import { getToursPage, getTourDetailsPage, getBookingPage, getBookingSummaryPage, getBookingCheckoutPage } from "./controllers/pageController.js";
import { getWidget } from "./controllers/widgetController.js";

const router = express.Router();

router.get("/tours-page.json", getToursPage);
router.get("/tour-details-page.json", getTourDetailsPage);
router.get("/booking-page.json", getBookingPage);
router.get("/booking-summary-page.json", getBookingSummaryPage);
router.get("/booking-checkout-page.json", getBookingCheckoutPage);
router.get("/:widgetFile.json", getWidget);

export default router;
