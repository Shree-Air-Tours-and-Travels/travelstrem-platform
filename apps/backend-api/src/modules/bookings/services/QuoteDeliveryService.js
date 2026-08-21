import config from "../../../config/index.js";
import { sendTransactionalEmail } from "../../../services/email.service.js";
import Booking from "../models/Booking.js";
import { latestQuoteDocument, readQuoteDocument } from "./QuoteDocumentStorage.js";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const money = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-IN")}`;
  }
};

export async function deliverQuoteEmail(bookingOrId, quote) {
  const id = bookingOrId?._id || bookingOrId;
  const booking = await Booking.findById(id)
    .populate("tour")
    .populate("trip")
    .populate("assignedAgent", "name email phone");
  if (!booking) return { success: false, message: "Booking not found", code: "BOOKING_NOT_FOUND" };
  const recipient = booking.primaryContact?.email;
  if (!recipient) return { success: false, message: "Customer email is missing", code: "EMAIL_RECIPIENT_REQUIRED" };

  const product = booking.trip || booking.tour || {};
  const quoteDocument = await latestQuoteDocument(booking._id);
  if (!quoteDocument) return { success: false, message: "Final quote PDF has not been uploaded", code: "QUOTE_DOCUMENT_REQUIRED" };
  const pdf = await readQuoteDocument(quoteDocument);
  if (!pdf) return { success: false, message: "Uploaded quote PDF is unavailable", code: "QUOTE_DOCUMENT_MISSING" };
  const appUrl = `${String(config.SHELL_URL || "").replace(/\/$/, "")}/?tab=bookings&bookingId=${booking._id}`;
  const specialist = booking.assignedAgent?.name || booking.assignedAgentSnapshot?.name || config.COMPANY_NAME;
  const amount = money(quote.finalAmount, quote.currency);
  return sendTransactionalEmail({
    to: recipient,
    replyTo: booking.assignedAgent?.email || booking.assignedAgentSnapshot?.email || undefined,
    subject: `Your TravelsTREM quote ${quote.quoteRef}`,
    text: `Hi ${booking.primaryContact?.name || "Traveller"},\n\nYour final quote for ${product.title || "your trip"} is ready.\nQuote: ${quote.quoteRef}\nAmount: ${amount}\n\nReview the attached PDF, then sign in to accept or reject the quote: ${appUrl}\n\nYour travel specialist: ${specialist}\n${config.COMPANY_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h2 style="color:#173b8f">Your final travel quote is ready</h2><p>Hi ${escapeHtml(booking.primaryContact?.name || "Traveller")},</p><p><strong>${escapeHtml(specialist)}</strong> has prepared your quote for ${escapeHtml(product.title || "your trip")}.</p><p><strong>Quote:</strong> ${escapeHtml(quote.quoteRef)}<br/><strong>Total:</strong> ${escapeHtml(amount)}</p><p>The complete quote is attached as a PDF. You can also <a href="${escapeHtml(appUrl)}">open your booking</a> to review, accept, reject, or cancel it.</p><p>Thank you,<br/>${escapeHtml(config.COMPANY_NAME)}</p></div>`,
    attachments: [{
      filename: quoteDocument.fileName || `TravelsTREM-${String(quote.quoteRef || "quote").replace(/[^a-z0-9_-]/gi, "-")}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    }],
  });
}

export default { deliverQuoteEmail };
