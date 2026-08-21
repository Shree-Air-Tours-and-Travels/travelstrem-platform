import Booking from "../models/Booking.js";
import TravellerService from "./TravellerService.js";
import QuoteService from "./QuoteService.js";
import PaymentService from "./PaymentService.js";
import DocumentService from "./DocumentService.js";
import BookingTimelineService from "./BookingTimelineService.js";
import StatusHistoryService from "./StatusHistoryService.js";
import AuditService from "./AuditService.js";
import AssignmentService from "./AssignmentService.js";
import { DOCUMENT_TYPE } from "../../../constants/enums.js";

const resolveProofUrl = (value) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return /^\[object Object\](?:\.html)?$/i.test(normalized) ? "" : normalized;
  }
  if (!value || typeof value !== "object") return "";
  for (const key of ["secure_url", "secureUrl", "url", "href", "path", "downloadUrl", "receiptUrl", "paymentScreenshot", "file", "asset", "data"]) {
    const resolved = resolveProofUrl(value[key]);
    if (resolved) return resolved;
  }
  return "";
};

export const BookingService = {
  priorityDueDates(priority = "MEDIUM") {
    const now = Date.now();
    const quoteHours = { LOW: 48, MEDIUM: 24, HIGH: 8, URGENT: 2 };
    const responseHours = { LOW: 24, MEDIUM: 8, HIGH: 2, URGENT: 1 };
    return {
      responseDueAt: new Date(now + (responseHours[priority] || 8) * 60 * 60 * 1000),
      quoteDueAt: new Date(now + (quoteHours[priority] || 24) * 60 * 60 * 1000),
      followupAt: new Date(now + 24 * 60 * 60 * 1000),
    };
  },

  async hydrate(booking, { includeDeep = true } = {}) {
    if (!booking) return null;
    const rawDoc = typeof booking.toJSON === "function" ? booking.toJSON() : booking;
    const doc = { ...rawDoc };
    if (doc.product === "trevio") {
      const tokenStage = ["AWAITING_TOKEN_PAYMENT", "PAYMENT_PENDING", "PARTIALLY_PAID", "PAID", "CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY", "COMPLETED"].includes(doc.status);
      if (tokenStage && !Number(doc.tokenAmount || 0) && Number(doc.paymentSummary?.total || doc.priceSnapshot?.total || 0) > 0) {
        doc.tokenAmount = Math.round(Number(doc.paymentSummary?.total || doc.priceSnapshot?.total) * 0.15);
      }
    }
    const bookingId = booking._id || booking.id;
    const [travelers, quotes, payments, documents, timeline, statusHistory, auditLogs, assignments] = await Promise.all([
      TravellerService.list(bookingId),
      QuoteService.list(bookingId),
      PaymentService.list(bookingId),
      DocumentService.list(bookingId),
      includeDeep ? BookingTimelineService.list(bookingId, 25) : Promise.resolve([]),
      includeDeep ? StatusHistoryService.list(bookingId, 25) : Promise.resolve([]),
      includeDeep ? AuditService.list(bookingId, 25) : Promise.resolve([]),
      includeDeep ? AssignmentService.list(bookingId) : Promise.resolve([]),
    ]);
    const latestQuote = quotes[0] || null;
    const quoteFile = documents.find((document) => document.type === DOCUMENT_TYPE.QUOTE) || null;
    const normalizedQuoteFile = quoteFile && (typeof quoteFile.toJSON === "function" ? quoteFile.toJSON() : { ...quoteFile });
    const normalizedPayments = payments.map((payment) => {
      const record = typeof payment?.toJSON === "function" ? payment.toJSON() : { ...payment };
      const storedProofUrl = resolveProofUrl(record.paymentScreenshot)
        || resolveProofUrl(record.receiptUrl)
        || resolveProofUrl(record.raw?.paymentScreenshot)
        || resolveProofUrl(record.raw?.receiptUrl);
      return {
        ...record,
        paymentScreenshot: storedProofUrl,
        receiptUrl: storedProofUrl,
        proofAvailable: Boolean(storedProofUrl),
      };
    });
    const BOOKING_PROCEED_HIDE_STATUSES = ["CANCELLED", "COMPLETED", "REFUNDED"];
    const isProceedHide = BOOKING_PROCEED_HIDE_STATUSES.includes(doc.status);
    return {
      ...doc,
      bookingStatus: doc.status,
      remainingAmount: doc.paymentSummary?.remaining || 0,
      isProceedHide,
      startDate: doc.startDate || doc.travelWindow?.startDate,
      endDate: doc.endDate || doc.travelWindow?.endDate,
      travelers,
      travellers: travelers,
      quotes,
      currentQuote: latestQuote,
      quoteDocument: normalizedQuoteFile ? {
        available: true,
        id: normalizedQuoteFile.id || normalizedQuoteFile._id,
        filename: normalizedQuoteFile.fileName || `quote-${doc.bookingRef || bookingId}.pdf`,
        downloadUrl: `/bookings/${bookingId}/downloads/quote`,
        uploadedAt: normalizedQuoteFile.uploadedAt,
        quoteAmount: normalizedQuoteFile.quoteAmount,
        currency: normalizedQuoteFile.currency || doc.priceSnapshot?.currency || "INR",
      } : null,
      payments: normalizedPayments,
      payment: {
        amountPaid: doc.paymentSummary?.paid || 0,
        currency: doc.priceSnapshot?.currency || "INR",
      },
      documents,
      timeline,
      statusHistory,
      auditLogs,
      assignments,
    };
  },

  async hydrateMany(bookings, options = {}) {
    return Promise.all(bookings.map((booking) => this.hydrate(booking, options)));
  },
};

export default BookingService;
