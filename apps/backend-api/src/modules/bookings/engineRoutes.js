import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import {
  createBooking,
  submitBooking,
  getBookingStatus,
  getBookingDetail,
  acceptQuote,
  rejectQuote,
  requestQuoteChanges,
  getMyBookings,
  createQuote,
  assignAgent,
  cancelBooking,
  confirmBooking,
  listAllBookings,
  getTrevistaPricing,
  createV2Quote,
  updateTravellers,
} from "./controllers/bookingEngineController.js";
import { upload } from "../../services/cloudinary.js";
import {
  downloadPaymentProof,
  getPaymentSettings,
  submitTokenProof,
} from "./controllers/paymentWorkflowController.js";

const router = express.Router();

// PUBLIC — create booking (requires auth via header but no middleware)
router.post("/create", authMiddleware, createBooking);

// PUBLIC — trevista tour pricing (computed server-side, no client price input)
router.post("/pricing", getTrevistaPricing);
router.post("/quotes", createV2Quote);

// AUTHENTICATED — booking lifecycle
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/admin/bookings", authMiddleware, listAllBookings);
router.get("/payment-settings", authMiddleware, getPaymentSettings);

router.get("/:id/status", authMiddleware, getBookingStatus);
router.get("/:id/detail", authMiddleware, getBookingDetail);
router.post("/:id/submit", authMiddleware, submitBooking);
router.post("/:id/cancel", authMiddleware, cancelBooking);
router.post("/:id/confirm", authMiddleware, confirmBooking);

// QUOTE
router.post("/:id/quote/accept", authMiddleware, acceptQuote);
router.post("/:id/quote/reject", authMiddleware, rejectQuote);
router.post("/:id/quote/request-changes", authMiddleware, requestQuoteChanges);

// OFFLINE PAYMENT PROOF
router.post("/:id/payments/token-proof", authMiddleware, upload.single("paymentScreenshot"), submitTokenProof);
router.get("/:bookingId/payments/:paymentId/proof", authMiddleware, downloadPaymentProof);

// TRAVELLERS
router.put("/:id/travellers", authMiddleware, updateTravellers);

// ADMIN
router.post("/:id/quote/create", authMiddleware, createQuote);
router.post("/:id/assign-agent", authMiddleware, assignAgent);

export default router;
