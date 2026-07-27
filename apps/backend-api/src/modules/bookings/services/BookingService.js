import Booking from "../models/Booking.js";
import TravellerService from "./TravellerService.js";
import QuoteService from "./QuoteService.js";
import PaymentService from "./PaymentService.js";
import DocumentService from "./DocumentService.js";
import BookingTimelineService from "./BookingTimelineService.js";
import StatusHistoryService from "./StatusHistoryService.js";
import AuditService from "./AuditService.js";
import AssignmentService from "./AssignmentService.js";

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
      const bookingAliases = {
        PAYMENT_PENDING: "AWAITING_TOKEN_PAYMENT",
        PARTIALLY_PAID: "CONFIRMED",
        PAID: "CONFIRMED",
      };
      const paymentAliases = {
        UNPAID: "TOKEN_PENDING",
        PARTIAL: "TOKEN_PAID",
        PAID: "FULLY_PAID",
      };
      doc.status = bookingAliases[doc.status] || doc.status;
      doc.paymentStatus = paymentAliases[doc.paymentStatus] || doc.paymentStatus;
      if (!Number(doc.tokenAmount || 0) && Number(doc.paymentSummary?.total || doc.priceSnapshot?.total || 0) > 0) {
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
      payments,
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
