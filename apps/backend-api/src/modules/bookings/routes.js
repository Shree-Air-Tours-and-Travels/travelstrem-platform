import express from "express";

import {
    acceptQuote,
    adminGetBookingById,
    adminListBookings,
    assignBooking,
    changeBookingStatus,
    createBooking,
    createDraftBooking,
    createQuote,
    getBookingById,
    listBookings,
    confirmBooking,
    cancelBooking,
    updateBooking,
    addTraveler,
    removeTraveler,
    recordPayment,
    refundBooking,
    rejectQuote,
    requestMoreDocs,
    sendQuote,
    setPrice,
    submitBooking,
    uploadBookingDocument,
} from "./controllers/bookingController.js";

const router = express.Router();

// CUSTOMER BOOKING FLOW
router.post("/draft", createDraftBooking);
router.post("/", createBooking);

// ADMIN / AGENT OPERATIONS (keep before /:id routes)
router.get("/admin/bookings", adminListBookings);
router.get("/admin/bookings/:id", adminGetBookingById);
router.post("/admin/bookings/:bookingId/assign", assignBooking);
router.post("/admin/bookings/:bookingId/set-price", setPrice);
router.post("/admin/bookings/:bookingId/quote", createQuote);
router.post("/admin/bookings/:bookingId/send-quote", sendQuote);
router.post("/admin/bookings/:bookingId/status", changeBookingStatus);
router.post("/admin/bookings/:bookingId/payment", recordPayment);
router.post("/admin/bookings/:bookingId/request-docs", requestMoreDocs);
router.post("/admin/bookings/:bookingId/refund", refundBooking);

router.post("/:bookingId/travellers", addTraveler);
router.post("/:bookingId/travelers", addTraveler);
router.put("/:bookingId/travellers/:travellerId", updateBooking);
router.put("/:bookingId/travelers/:travelerId", updateBooking);
router.post("/:bookingId/submit", submitBooking);
router.post("/:bookingId/cancel", cancelBooking);
router.post("/:bookingId/accept-quote", acceptQuote);
router.post("/:bookingId/reject-quote", rejectQuote);
router.post("/:bookingId/upload", uploadBookingDocument);
router.get("/", listBookings);
router.get("/:id", getBookingById);
router.put("/:bookingId", updateBooking);
router.patch("/:bookingId", updateBooking);
router.delete("/:bookingId/travelers/:travelerId", removeTraveler);
router.delete("/:bookingId/travellers/:travelerId", removeTraveler);

// LEGACY / SHORT ADMIN ACTIONS USED BY EXISTING UI
router.post("/:bookingId/confirm", confirmBooking);

export default router;
