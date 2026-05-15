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
    const doc = typeof booking.toJSON === "function" ? booking.toJSON() : booking;
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
    return {
      ...doc,
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
