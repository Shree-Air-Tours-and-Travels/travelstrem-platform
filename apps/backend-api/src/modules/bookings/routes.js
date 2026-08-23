import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";

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
    getCancelInfo,
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
import { getBookingWidget } from "../tours/controllers/widgetController.js";
import { downloadQuote, downloadInvoice, downloadBookingPass } from "./controllers/documentController.js";

const router = express.Router();

// PUBLIC (guest) — no auth required
router.post("/draft", createDraftBooking);
router.post("/", createBooking);

// AUTHENTICATED — require valid JWT
router.get("/", authMiddleware, listBookings);
router.get("/:id", authMiddleware, getBookingById);
router.get("/:id/widgets/:widgetFile.json", authMiddleware, getBookingWidget);
router.post("/:bookingId/travellers", authMiddleware, addTraveler);
router.post("/:bookingId/travelers", authMiddleware, addTraveler);
router.put("/:bookingId/travellers/:travellerId", authMiddleware, updateBooking);
router.put("/:bookingId/travelers/:travelerId", authMiddleware, updateBooking);
router.put("/:bookingId", authMiddleware, updateBooking);
router.patch("/:bookingId", authMiddleware, updateBooking);
router.post("/:bookingId/submit", authMiddleware, submitBooking);
router.post("/:bookingId/cancel", authMiddleware, cancelBooking);
router.get("/:bookingId/cancel-info", authMiddleware, getCancelInfo);
router.post("/:bookingId/accept-quote", authMiddleware, acceptQuote);
router.post("/:bookingId/reject-quote", authMiddleware, rejectQuote);
router.post("/:bookingId/upload", authMiddleware, uploadBookingDocument);
router.post("/:bookingId/confirm", authMiddleware, confirmBooking);
router.delete("/:bookingId/travelers/:travelerId", authMiddleware, removeTraveler);
router.delete("/:bookingId/travellers/:travelerId", authMiddleware, removeTraveler);

// AUTHENTICATED — document downloads
router.get("/:bookingId/downloads/quote", authMiddleware, downloadQuote);
router.get("/:bookingId/downloads/invoice", authMiddleware, downloadInvoice);
router.get("/:bookingId/downloads/voucher", authMiddleware, downloadBookingPass);

// ADMIN / AGENT OPERATIONS
router.get("/admin/bookings", authMiddleware, adminListBookings);
router.get("/admin/bookings/:id", authMiddleware, adminGetBookingById);
router.post("/admin/bookings/:bookingId/assign", authMiddleware, assignBooking);
router.post("/admin/bookings/:bookingId/set-price", authMiddleware, setPrice);
router.post("/admin/bookings/:bookingId/quote", authMiddleware, createQuote);
router.post("/admin/bookings/:bookingId/send-quote", authMiddleware, sendQuote);
router.post("/admin/bookings/:bookingId/status", authMiddleware, changeBookingStatus);
router.post("/admin/bookings/:bookingId/request-docs", authMiddleware, requestMoreDocs);

export default router;
