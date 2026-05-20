import BookingRepository from "../repositories/BookingRepository.js";
import BookingService from "../services/BookingService.js";
import { QuoteService } from "../services/QuoteService.js";
import { PaymentService } from "../services/PaymentService.js";
import TravellerService from "../services/TravellerService.js";
import { generateQuotePdf, generateInvoicePdf, generateBookingPassPdf } from "../../../services/pdfService.js";

function sendError(res, message, status = 400) {
  return res.status(status).json({ status: "error", message });
}

function notFound(res) {
  return sendError(res, "Booking not found", 404);
}

async function loadBooking(id) {
  const booking = await BookingRepository.findById(id)
    .populate("tour")
    .populate("user", "name email role")
    .populate("assignedAgent", "name email role");
  if (!booking) return null;
  return BookingService.hydrate(booking, {});
}

export async function downloadQuote(req, res) {
  try {
    const booking = await loadBooking(req.params.id);
    if (!booking) return notFound(res);

    const quote = await QuoteService.latest(booking._id);
    if (!quote) return sendError(res, "No quote found for this booking", 404);

    const travelers = await TravellerService.list(booking._id);
    const tour = booking.tour || {};

    const doc = generateQuotePdf(booking, quote, tour, travelers);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="quote-${booking.bookingRef}.pdf"`);
    doc.pipe(res);
  } catch (err) {
    console.error("downloadQuote error:", err);
    sendError(res, "Failed to generate quote PDF", 500);
  }
}

export async function downloadInvoice(req, res) {
  try {
    const booking = await loadBooking(req.params.id);
    if (!booking) return notFound(res);

    const payments = await PaymentService.list(booking._id);
    if (!payments?.length) return sendError(res, "No payments found for this booking", 404);

    const tour = booking.tour || {};

    const doc = generateInvoicePdf(booking, payments, tour);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${booking.bookingRef}.pdf"`);
    doc.pipe(res);
  } catch (err) {
    console.error("downloadInvoice error:", err);
    sendError(res, "Failed to generate invoice PDF", 500);
  }
}

export async function downloadBookingPass(req, res) {
  try {
    const booking = await loadBooking(req.params.id);
    if (!booking) return notFound(res);

    const travelers = await TravellerService.list(booking._id);
    const tour = booking.tour || {};

    const doc = generateBookingPassPdf(booking, travelers, tour);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="voucher-${booking.bookingRef}.pdf"`);
    doc.pipe(res);
  } catch (err) {
    console.error("downloadBookingPass error:", err);
    sendError(res, "Failed to generate booking pass PDF", 500);
  }
}
