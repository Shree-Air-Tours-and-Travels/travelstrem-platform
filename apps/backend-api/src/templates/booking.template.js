import { detailRow, renderEmailLayout } from "./base.template.js";

/** Builds a booking confirmation from booking-domain values. */
export default function bookingTemplate({ companyName, customerName, bookingId, tripName, amount, travelDates, bookingUrl, agencyName, agentName, agentEmail, agentPhone }) {
  const rows = [
    detailRow("Booking ID", bookingId || "—"),
    detailRow("Trip", tripName || "—"),
    travelDates && detailRow("Travel dates", travelDates),
    amount != null && detailRow("Total", amount),
    agencyName && detailRow("Travel provider", agencyName),
    agentName && detailRow("Travel partner", agentName),
    agentEmail && detailRow("Partner email", agentEmail),
    agentPhone && detailRow("Partner phone", agentPhone),
  ].filter(Boolean).join("");
  return {
    subject: `Booking confirmed${bookingId ? ` · ${bookingId}` : ""}`,
    text: `Your booking${bookingId ? ` ${bookingId}` : ""} for ${tripName || "your trip"} is confirmed.`,
    html: renderEmailLayout({
      companyName,
      preheader: `Your booking for ${tripName || "your trip"} is confirmed.`,
      title: "Booking confirmed",
      intro: customerName ? `Hello ${customerName}, your reservation is confirmed.` : "Your reservation is confirmed.",
      content: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>`,
      action: bookingUrl ? { label: "View booking", url: bookingUrl } : null,
    }),
  };
}
