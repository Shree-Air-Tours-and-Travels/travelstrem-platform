import { detailRow, renderEmailLayout } from "./base.template.js";

/** Builds a payment receipt email. */
export default function paymentTemplate({ companyName, customerName, bookingId, tripName, amount, transactionId, paidAt, bookingUrl }) {
  const rows = [
    detailRow("Amount paid", amount || "—"),
    bookingId && detailRow("Booking ID", bookingId),
    tripName && detailRow("Trip", tripName),
    transactionId && detailRow("Transaction ID", transactionId),
    paidAt && detailRow("Paid at", paidAt),
  ].filter(Boolean).join("");
  return {
    subject: `Payment received${bookingId ? ` · ${bookingId}` : ""}`,
    text: `Payment of ${amount || "the requested amount"} was received successfully.`,
    html: renderEmailLayout({
      companyName,
      preheader: "Your payment was received successfully.",
      title: "Payment successful",
      intro: customerName ? `Hello ${customerName}, your payment has been recorded.` : "Your payment has been recorded.",
      content: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>`,
      action: bookingUrl ? { label: "View payment details", url: bookingUrl } : null,
    }),
  };
}
