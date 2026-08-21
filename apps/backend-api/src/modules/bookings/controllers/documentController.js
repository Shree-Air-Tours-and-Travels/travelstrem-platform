import BookingRepository from "../repositories/BookingRepository.js";
import BookingService from "../services/BookingService.js";
import { QuoteService } from "../services/QuoteService.js";
import { PaymentService } from "../services/PaymentService.js";
import TravellerService from "../services/TravellerService.js";
import { generateInvoicePdf, generateBookingPassPdf } from "../../../services/pdfService.js";
import User from "../../auth/models/User.js";
import { latestQuoteDocument, readQuoteDocument, getQuoteDocumentSignedUrl } from "../services/QuoteDocumentStorage.js";

function sendError(res, message, status = 400) {
  return res.status(status).json({ status: "error", message });
}

function notFound(res) {
  return sendError(res, "Booking not found", 404);
}

async function loadBooking(id) {
  const booking = await BookingRepository.findById(id)
    .populate("tour")
    .populate("trip")
    .populate("user", "name email role")
    .populate("assignedAgent", "name email role");
  if (!booking) return null;
  return BookingService.hydrate(booking, {});
}

async function canAccess(req, booking) {
  const userId = req.user?.sub || req.user?.id || req.user?._id;
  if (!userId) return false;
  if (String(booking.user?._id || booking.user?.id || booking.user || "") === String(userId)) return true;
  const role = String(req.user?.role || "").toLowerCase();
  if (role === "admin" && req.user?.adminLevel === "master") return true;
  if (role !== "agent") return false;
  const agent = await User.findById(userId).select("agencyId agencyRole").lean();
  if (String(booking.assignedAgent?._id || booking.assignedAgent?.id || booking.assignedAgent || "") === String(userId)) return true;
  if (!agent?.agencyId || String(booking.agencyId?._id || booking.agencyId?.id || booking.agencyId || "") !== String(agent.agencyId)) return false;
  return agent.agencyRole === "partner_admin" || String(booking.assignedAgent?._id || booking.assignedAgent || "") === String(userId);
}

export async function downloadQuote(req, res) {
  try {
    const booking = await loadBooking(req.params.bookingId || req.params.id);
    if (!booking) return notFound(res);
    if (!(await canAccess(req, booking))) return sendError(res, "Not authorized to download this quote", 403);

    const bookingId = booking._id || booking.id;
    const quote = await QuoteService.latest(bookingId);
    if (!quote) return sendError(res, "No quote found for this booking", 404);
    const quoteDocument = await latestQuoteDocument(bookingId);
    if (!quoteDocument) return sendError(res, "The final quote PDF has not been uploaded yet", 404);
    const pdf = await readQuoteDocument(quoteDocument);
    if (!pdf) return sendError(res, "The uploaded quote PDF is unavailable", 404);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Content-Disposition", `attachment; filename="${String(quoteDocument.fileName || `quote-${booking.bookingRef}.pdf`).replace(/[\r\n"]/g, "-")}"`);
    res.end(pdf);
  } catch (err) {
    console.error("downloadQuote error:", err);
    sendError(res, "Failed to download quote PDF", 500);
  }
}

export async function downloadQuoteSignedUrl(req, res) {
  try {
    const booking = await loadBooking(req.params.bookingId || req.params.id);
    if (!booking) return notFound(res);
    if (!(await canAccess(req, booking))) return sendError(res, "Not authorized to download this quote", 403);

    const bookingId = booking._id || booking.id;
    const quoteDocument = await latestQuoteDocument(bookingId);
    if (!quoteDocument) return sendError(res, "The final quote PDF has not been uploaded yet", 404);

    const signedUrl = await getQuoteDocumentSignedUrl(quoteDocument);
    if (!signedUrl) return sendError(res, "Unable to generate download URL", 500);

    return res.json({
      status: "success",
      data: {
        url: signedUrl.url,
        expiresIn: signedUrl.expiresIn,
        fileName: quoteDocument.fileName || `quote-${booking.bookingRef}.pdf`,
      },
    });
  } catch (err) {
    console.error("downloadQuoteSignedUrl error:", err);
    sendError(res, "Failed to generate quote download URL", 500);
  }
}

// Quote-centric customer endpoint. It intentionally returns only a short-lived URL,
// never the R2 object key or any storage credentials.
export async function getQuotePdfSignedUrl(req, res) {
  try {
    const quote = await QuoteService.byId(req.params.quoteId);
    if (!quote) return sendError(res, "Quote not found", 404);
    const booking = await loadBooking(quote.bookingId);
    if (!booking) return notFound(res);
    if (!(await canAccess(req, booking))) return sendError(res, "Not authorized to download this quote", 403);
    const quoteDocument = await latestQuoteDocument(booking._id || booking.id, quote.version);
    if (!quoteDocument || quoteDocument.storageProvider !== "R2" || !quoteDocument.storageKey) return sendError(res, "The generated quote PDF is unavailable", 404);
    const signedUrl = await getQuoteDocumentSignedUrl(quoteDocument);
    if (!signedUrl) return sendError(res, "Unable to generate download URL", 500);
    return res.json({ status: "success", data: { url: signedUrl.url, expiresIn: signedUrl.expiresIn, fileName: quoteDocument.fileName } });
  } catch (err) {
    console.error("getQuotePdfSignedUrl error:", err);
    return sendError(res, "Failed to generate quote download URL", 500);
  }
}

export async function downloadInvoice(req, res) {
  try {
    const booking = await loadBooking(req.params.bookingId || req.params.id);
    if (!booking) return notFound(res);
    if (!(await canAccess(req, booking))) return sendError(res, "Not authorized to download this invoice", 403);

    const payments = await PaymentService.list(booking._id || booking.id);
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
    const booking = await loadBooking(req.params.bookingId || req.params.id);
    if (!booking) return notFound(res);
    if (!(await canAccess(req, booking))) return sendError(res, "Not authorized to download this voucher", 403);

    const travelers = await TravellerService.list(booking._id || booking.id);
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
