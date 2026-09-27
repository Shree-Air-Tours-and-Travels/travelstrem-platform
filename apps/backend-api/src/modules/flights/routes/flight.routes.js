import express from "express";
import { authMiddleware } from "../../../shared/auth/index.js";
import {
    cancelFlightBooking,
    createFlightEnquiry,
    createFlightBooking,
    getFlightBooking,
    getFlightBookingByPnr,
    getFlightOffer,
    getFlightResults,
    getSeatMap,
    revalidateFlight,
    searchAirports,
    searchFlights,
} from "../controllers/flight.controller.js";

const router = express.Router();

router.get("/airports/search", searchAirports);
router.post("/search", searchFlights);
router.get("/search/:searchId/results", getFlightResults);
router.get("/search/:searchId/offers/:offerId", getFlightOffer);
router.post("/revalidate", revalidateFlight);
router.post("/enquiries", authMiddleware, createFlightEnquiry);
router.get("/offers/:offerId/seat-map", getSeatMap);
router.get("/bookings/pnr/:pnr", authMiddleware, getFlightBookingByPnr);
router.post("/bookings", authMiddleware, createFlightBooking);
router.get("/bookings/:bookingId", authMiddleware, getFlightBooking);
router.post("/bookings/:bookingId/cancel", authMiddleware, cancelFlightBooking);

export default router;
