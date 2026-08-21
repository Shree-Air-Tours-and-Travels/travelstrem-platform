import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";

import {
    adminGetBookingById,
    adminListBookings,
    assignBooking,
    changeBookingStatus,
    createQuote,
    generateAndSendQuote,
    recordPayment,
    refundBooking,
    requestMoreDocs,
    sendQuote,
    setPrice,
    uploadQuoteDocument,
} from "./controllers/bookingController.js";
import { downloadQuoteSignedUrl } from "./controllers/documentController.js";
import { r2HealthCheck } from "./controllers/r2HealthController.js";
import quoteUpload from "./middleware/quoteUpload.js";
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
router.post("/:bookingId/quote-document", quoteUpload.single("quote"), uploadQuoteDocument);
router.post("/:bookingId/quote", createQuote);
router.post("/:bookingId/quote/generate-and-send", generateAndSendQuote);
router.post("/:bookingId/send-quote", sendQuote);
router.get("/:bookingId/quote-document-url", downloadQuoteSignedUrl);
router.post("/:bookingId/status", changeBookingStatus);
router.post("/:bookingId/request-docs", requestMoreDocs);

if (process.env.NODE_ENV !== "production") {
    router.get("/r2-test", r2HealthCheck);
}

export default router;
