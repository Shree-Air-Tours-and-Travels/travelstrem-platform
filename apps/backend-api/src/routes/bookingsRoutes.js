import express from "express";

import {
    createBooking,
    getBookingById,
    listBookings,
    confirmBooking,
    cancelBooking,
    updateBooking,
    addTraveler,
    removeTraveler,
} from "../modules/bookings/bookingController.js";

const router = express.Router();

// CREATE booking
router.post("/", createBooking);

// LIST all bookings (role aware inside controller)
router.get("/", listBookings);

// GET single booking
router.get("/:id", getBookingById);

// UPDATE booking (partial update)
router.put("/:bookingId", updateBooking);
router.patch("/:bookingId", updateBooking);

// CONFIRM booking (payments, agent confirmation, etc.)
router.post("/:bookingId/confirm", confirmBooking);

// CANCEL booking
router.post("/:bookingId/cancel", cancelBooking);

// ADD traveler
router.post("/:bookingId/travelers", addTraveler);

// REMOVE traveler
router.delete("/:bookingId/travelers/:travelerId", removeTraveler);

export default router;
