import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";

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
import {
    approveTokenProof,
    downloadPaymentProof,
    getPaymentSettings,
    listPaymentVerifications,
    markBalancePaid,
    markTokenPaid,
    refundPayment,
    rejectTokenProof,
    updatePaymentSettings,
} from "./controllers/paymentWorkflowController.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", adminListBookings);
router.get("/payment-settings", getPaymentSettings);
router.put("/payment-settings", updatePaymentSettings);
router.get("/payment-verifications", listPaymentVerifications);
router.get("/:bookingId/payments/:paymentId/proof", downloadPaymentProof);
router.post("/:bookingId/payments/:paymentId/approve", approveTokenProof);
router.post("/:bookingId/payments/:paymentId/reject", rejectTokenProof);
router.post("/:bookingId/payments/token-paid", markTokenPaid);
router.post("/:bookingId/payments/balance-paid", markBalancePaid);
router.post("/:bookingId/payments/refund", refundPayment);
router.get("/:id", adminGetBookingById);
router.post("/:bookingId/assign", assignBooking);
router.post("/:bookingId/set-price", setPrice);
router.post("/:bookingId/quote", createQuote);
router.post("/:bookingId/send-quote", sendQuote);
router.post("/:bookingId/status", changeBookingStatus);
router.post("/:bookingId/request-docs", requestMoreDocs);

export default router;
