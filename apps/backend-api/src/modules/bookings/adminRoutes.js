import express from "express";

import {
    adminGetBookingById,
    adminListBookings,
    assignBooking,
    changeBookingStatus,
    createQuote,
    recordPayment,
    refundBooking,
    requestMoreDocs,
    sendQuote,
    setPrice,
} from "./controllers/bookingController.js";

const router = express.Router();

router.get("/", adminListBookings);
router.get("/:id", adminGetBookingById);
router.post("/:bookingId/assign", assignBooking);
router.post("/:bookingId/set-price", setPrice);
router.post("/:bookingId/quote", createQuote);
router.post("/:bookingId/send-quote", sendQuote);
router.post("/:bookingId/status", changeBookingStatus);
router.post("/:bookingId/payment", recordPayment);
router.post("/:bookingId/request-docs", requestMoreDocs);
router.post("/:bookingId/refund", refundBooking);

export default router;
