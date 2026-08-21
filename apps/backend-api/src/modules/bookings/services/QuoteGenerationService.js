import BookingRepository from "../repositories/BookingRepository.js";
import TravellerService from "./TravellerService.js";
import DocumentService from "./DocumentService.js";
import DocumentStorageService from "../../../services/r2/DocumentStorageService.js";
import { generateQuotePdf, pdfDocumentToBuffer } from "../../../services/pdfService.js";

// The sole generated-quote path: existing PDF DocGen -> existing R2 DocumentStorageService -> BookingDocument metadata.
export async function generateQuoteDocument({ bookingId, quote, actor }) {
  if (!DocumentStorageService.isConfigured()) throw new Error("Cloudflare R2 document storage is not configured");
  const booking = await BookingRepository.findById(bookingId).populate("tour").populate("trip");
  if (!booking) throw new Error("Booking not found");
  const travellers = await TravellerService.list(booking._id);
  const pdf = await pdfDocumentToBuffer(generateQuotePdf(booking, quote, booking.trip || booking.tour || {}, travellers));
  return DocumentService.uploadQuoteToR2({
    bookingId: booking._id,
    agencyId: booking.agencyId,
    version: quote.version,
    buffer: pdf,
    fileName: `TravelsTREM-${String(quote.quoteRef).replace(/[^a-z0-9_-]/gi, "-")}.pdf`,
    quoteAmount: quote.finalAmount,
    currency: quote.currency,
    actor,
  });
}

export default { generateQuoteDocument };
