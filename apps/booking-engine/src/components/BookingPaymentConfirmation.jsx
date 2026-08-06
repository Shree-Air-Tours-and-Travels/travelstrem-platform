import React from "react";

const CHANNEL_URL = process.env.REACT_APP_TREVIO_CHANNEL_URL || process.env.REACT_APP_WHATSAPP_GROUP_URL;
const CHANNEL_QR_URL = process.env.REACT_APP_TREVIO_CHANNEL_QR_URL;
const CHANNEL_NAME = process.env.REACT_APP_TREVIO_CHANNEL_NAME;

const money = (amount, currency = "INR") => {
  if (amount == null || amount === "") return null;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }
};

export default function BookingPaymentConfirmation({ booking, product, onGoToDashboard }) {
  const title = booking?.trip?.title || booking?.tour?.title || "Your trip";
  const reference = booking?.bookingRef || booking?.id || booking?._id || "—";
  const tokenAmount = money(booking?.tokenAmount, booking?.priceSnapshot?.currency);
  const isTrevio = product === "trevio";

  return (
    <div className="be-confirmation">
      <header className="be-confirmation__header">
        <div className="be-confirmation__icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="m8.5 16.3 4.7 4.7 10.3-10.4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span className="be-confirmation__eyebrow">Request received</span>
          <h2 className="be-confirmation__title">{isTrevio ? "Your booking is created" : "Your booking request is created"}</h2>
          <p className="be-confirmation__subtitle">
            {isTrevio
              ? <><strong>{title}</strong> is reserved while you complete the token payment.</>
              : <><strong>{title}</strong> is saved — our travel specialist will prepare a personalized quote for you.</>}
          </p>
        </div>
      </header>

      <div className={`be-confirmation__layout ${CHANNEL_URL || CHANNEL_QR_URL ? "" : "be-confirmation__layout--single"}`}>
        <section className="be-confirmation__summary" aria-label="Booking summary">
          <div className="be-confirmation__reference">
            <span>Booking reference</span>
            <strong>{reference}</strong>
          </div>

          <div className="be-confirmation__status-list">
            <div>
              <span className="be-confirmation__status-icon is-complete" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="m3 7.2 2.4 2.4L11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span><small>Booking</small><strong>Created successfully</strong></span>
            </div>
            <div>
              <span className="be-confirmation__status-icon is-pending" aria-hidden="true" />
              <span><small>Next step</small><strong>{isTrevio ? "Upload token payment proof" : "Awaiting your personalized quote"}</strong></span>
              {isTrevio && tokenAmount ? <b>{tokenAmount}</b> : null}
            </div>
            <div>
              <span className="be-confirmation__status-icon" aria-hidden="true" />
              <span><small>Confirmation</small><strong>After admin verification</strong></span>
            </div>
          </div>

          <p className="be-confirmation__help">
            {isTrevio
              ? "Payment details and the one-step proof upload are available in your dashboard."
              : "Track your quote and payment status in your dashboard."}
          </p>

          {onGoToDashboard && (
            <button type="button" className="be-confirmation__btn be-confirmation__btn--dashboard" onClick={onGoToDashboard}>
              {isTrevio ? "Continue to payment" : "Track booking status"}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.75 9h10.5M10 4.75 14.25 9 10 13.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </section>

        {(CHANNEL_URL || CHANNEL_QR_URL) && (
          <aside className="be-confirmation__channel" aria-label={`${CHANNEL_NAME} WhatsApp channel`}>
            <span className="be-confirmation__channel-eyebrow">Stay connected</span>
            <div className="be-confirmation__channel-brand">
              <span className="be-confirmation__whatsapp" aria-hidden="true">
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.45L3 20.5l1.32-4.76A8.5 8.5 0 1 1 20.5 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M8.1 7.65c.2-.45.42-.46.75-.47h.4c.13 0 .3.05.4.35l.58 1.4c.08.2.04.34-.07.5l-.43.54c-.13.14-.26.28-.1.56.47.84 1.13 1.53 1.94 2.03.26.15.42.13.58-.05l.72-.85c.17-.2.34-.16.55-.08l1.35.64c.23.1.38.16.43.27.06.11.06.64-.15 1.23-.21.6-1.2 1.13-1.66 1.2-.43.06-.98.09-1.58-.1-.37-.12-.85-.28-1.47-.55-2.58-1.1-4.27-3.72-4.4-3.9-.12-.18-1.05-1.4-1.05-2.67 0-1.26.66-1.88.9-2.14.12-.13.22-.23.3-.35Z" fill="currentColor" /></svg>
              </span>
              <span><strong>{CHANNEL_NAME}</strong><small>Official WhatsApp channel</small></span>
            </div>
            {CHANNEL_QR_URL && (
              <div className="be-confirmation__qr">
                <img src={CHANNEL_QR_URL} alt={`QR code to join the ${CHANNEL_NAME} WhatsApp channel`} />
              </div>
            )}
            <p>Join our official channel for trip updates, travel inspiration and important announcements.</p>
            {CHANNEL_URL && (
              <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="be-confirmation__channel-link">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.45L3 20.5l1.32-4.76A8.5 8.5 0 1 1 20.5 11.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8.1 7.65c.2-.45.42-.46.75-.47h.4c.13 0 .3.05.4.35l.58 1.4c.08.2.04.34-.07.5l-.43.54c-.13.14-.26.28-.1.56.47.84 1.13 1.53 1.94 2.03.26.15.42.13.58-.05l.72-.85c.17-.2.34-.16.55-.08l1.35.64c.23.1.38.16.43.27.06.11.06.64-.15 1.23-.21.6-1.2 1.13-1.66 1.2-.43.06-.98.09-1.58-.1-.37-.12-.85-.28-1.47-.55-2.58-1.1-4.27-3.72-4.4-3.9-.12-.18-1.05-1.4-1.05-2.67 0-1.26.66-1.88.9-2.14.12-.13.22-.23.3-.35Z" fill="currentColor" /></svg>
                Join our WhatsApp channel
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3h7v7M13 3 5.5 10.5M11 9v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            )}
          </aside>
        )}
      </div>

      <footer className="be-confirmation__footer">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" /><path d="M9 8.1v4M9 5.55v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span>Keep your booking reference handy. We’ll update the status as soon as your proof is verified.</span>
      </footer>
    </div>
  );
}
