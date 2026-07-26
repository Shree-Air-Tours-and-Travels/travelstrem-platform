import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import {
  createBooking,
  submitBooking,
  getBookingStatus,
  getBookingDetail,
  payToken,
  payFullAmount,
  acceptQuote,
  rejectQuote,
  getMyBookings,
  createQuote,
  assignAgent,
  cancelBooking,
  confirmBooking,
  listAllBookings,
} from "./controllers/bookingEngineController.js";
import { sendMessage, getMessages } from "./controllers/messageController.js";

const router = express.Router();

// PUBLIC — create booking (requires auth via header but no middleware)
router.post("/create", authMiddleware, createBooking);

// AUTHENTICATED — booking lifecycle
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/admin/bookings", authMiddleware, listAllBookings);

router.get("/:id/status", authMiddleware, getBookingStatus);
router.get("/:id/detail", authMiddleware, getBookingDetail);
router.post("/:id/submit", authMiddleware, submitBooking);
router.post("/:id/cancel", authMiddleware, cancelBooking);
router.post("/:id/confirm", authMiddleware, confirmBooking);

// QUOTE
router.post("/:id/quote/accept", authMiddleware, acceptQuote);
router.post("/:id/quote/reject", authMiddleware, rejectQuote);

// PAYMENT
router.post("/:id/pay-token", authMiddleware, payToken);
router.post("/:id/pay-full", authMiddleware, payFullAmount);

// MESSAGING
router.post("/:id/message", authMiddleware, sendMessage);
router.get("/:id/messages", authMiddleware, getMessages);

// ADMIN
router.post("/:id/quote/create", authMiddleware, createQuote);
router.post("/:id/assign-agent", authMiddleware, assignAgent);

export default router;
