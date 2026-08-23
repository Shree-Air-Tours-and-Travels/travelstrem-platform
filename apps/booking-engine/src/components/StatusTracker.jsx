import React from "react";
import StatusBadge from "@packages/trem-ui/components/StatusBadge/StatusBadge.jsx";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";
import QuoteDisplay from "@packages/trem-ui/components/QuoteDisplay/QuoteDisplay.jsx";
import Button from "@packages/trem-ui/components/Button/Button.jsx";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_MESSAGES = {
  DRAFT: { text: "Your booking is being prepared. Please review and submit.", icon: "edit" },
  QUOTE_REQUESTED: { text: "Booking submitted! Our travel specialist will prepare a personalized quote for you shortly.", icon: "clock" },
  UNDER_REVIEW: { text: "Your booking is being reviewed by our team.", icon: "search" },
  QUOTE_READY: { text: "A new quote is ready for your review.", icon: "file" },
  QUOTE_SENT: { text: "Your quote has been sent. Please review the details and accept or reject.", icon: "send" },
  CUSTOMER_ACCEPTED: { text: "Quote accepted! Please complete the payment to confirm your booking.", icon: "check" },
  PAYMENT_PENDING: { text: "Payment is pending. Please complete the payment to proceed.", icon: "creditCard" },
  AWAITING_TOKEN_PAYMENT: { text: "Your booking is created. Pay the token manually and upload the payment proof below.", icon: "creditCard" },
  PARTIALLY_PAID: { text: "Partial payment received. The remaining balance is due.", icon: "creditCard" },
  PAID: { text: "Payment complete! Your booking is now confirmed.", icon: "checkCircle" },
  CONFIRMED: { text: "Booking confirmed! You're all set for your trip.", icon: "checkCircle" },
  TICKETING: { text: "Your tickets are being processed.", icon: "ticket" },
  TICKETED: { text: "Your tickets are ready!", icon: "ticket" },
  TRAVEL_READY: { text: "Everything is set for your trip. Have a wonderful journey!", icon: "mapPin" },
  COMPLETED: { text: "Trip completed. We hope you had a great experience!", icon: "star" },
  CANCELLED: { text: "This booking has been cancelled.", icon: "xCircle" },
  CUSTOMER_REJECTED: { text: "You have rejected the quote.", icon: "xCircle" },
};

export default function StatusTracker({ booking, product, onAcceptQuote, onRejectQuote, onPay, onCancel }) {
  const timeline = booking?.timeline || [];
  const status = booking?.status;
  const latestQuote = booking?.latestQuote;
  const payments = booking?.payments || [];
  const tokenAmount = booking?.tokenAmount || 0;
  const totalAmount = booking?.paymentSummary?.total || 0;
  const paidAmount = booking?.paymentSummary?.paid || 0;
  const remainingAmount = booking?.paymentSummary?.remaining || 0;
  const cancellationPolicy = booking?.cancellationPolicy || "";

  const tourData = product === "trevio" ? booking?.trip : booking?.tour;
  const tripTitle = tourData?.title || tourData?.name || "";
  const tripImage = tourData?.photo || tourData?.image || "";
  const tripLocation = tourData?.city || tourData?.location || "";
  const tripDuration = tourData?.duration || "";

  const showPayButton = product !== "trevio" && ["PAYMENT_PENDING", "PARTIALLY_PAID"].includes(status);

  const showAcceptQuote = ["QUOTE_SENT", "QUOTE_READY"].includes(status) && product === "trevista";
  const showCancel = ["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT", "AWAITING_TOKEN_PAYMENT", "PAYMENT_PENDING", "CONFIRMED"].includes(status);

  const statusInfo = STATUS_MESSAGES[status] || { text: "", icon: "info" };

  const payAmount = product === "trevio"
    ? (paidAmount === 0 ? tokenAmount : remainingAmount)
    : remainingAmount;

  const travelStart = booking?.travelWindow?.startDate;
  const travelEnd = booking?.travelWindow?.endDate;
  const guestsCount = booking?.guestsCount || 1;

  return (
    <div className="be-status">
      {/* ── Hero / Status Banner ── */}
      <div className="be-status__hero">
        <div className="be-status__hero-icon">
          {status === "CANCELLED" || status === "CUSTOMER_REJECTED" ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
          ) : ["PAID", "CONFIRMED", "TICKETED", "TRAVEL_READY", "COMPLETED"].includes(status) ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          )}
        </div>
        <div className="be-status__hero-text">
          <div className="be-status__hero-badge">
            <StatusBadge value={status} size="md" />
          </div>
          {statusInfo.text && <p className="be-status__hero-message">{statusInfo.text}</p>}
        </div>
      </div>

      {/* ── Booking Ref + Trip Summary ── */}
      <div className="be-status__info-grid">
        <div className="be-status__card be-status__card--ref">
          <span className="be-status__card-label">Booking Reference</span>
          <span className="be-status__card-value be-status__card-value--mono">{booking?.bookingRef || "—"}</span>
        </div>
        <div className="be-status__card be-status__card--date">
          <span className="be-status__card-label">Booked On</span>
          <span className="be-status__card-value">{formatDate(booking?.createdAt)}</span>
        </div>
        {travelStart && (
          <div className="be-status__card be-status__card--date">
            <span className="be-status__card-label">Travel Dates</span>
            <span className="be-status__card-value">{formatDate(travelStart)}{travelEnd ? ` — ${formatDate(travelEnd)}` : ""}</span>
          </div>
        )}
        <div className="be-status__card be-status__card--date">
          <span className="be-status__card-label">Guests</span>
          <span className="be-status__card-value">{guestsCount} {guestsCount === 1 ? "Guest" : "Guests"}</span>
        </div>
      </div>

      {/* ── Trip Card ── */}
      {tripTitle && (
        <div className="be-status__trip-card">
          {tripImage && (
            <div className="be-status__trip-image">
              <img src={tripImage} alt={tripTitle} />
            </div>
          )}
          <div className="be-status__trip-info">
            <h4 className="be-status__trip-title">{tripTitle}</h4>
            <div className="be-status__trip-meta">
              {tripLocation && (
                <span className="be-status__trip-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {tripLocation}
                </span>
              )}
              {tripDuration && (
                <span className="be-status__trip-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {tripDuration}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      <div className="be-status__section">
        <h4 className="be-status__section-title">Booking Progress</h4>
        <div className="be-status__timeline">
          <TimelineStepper steps={timeline} />
        </div>
      </div>

      {/* ── Quote ── */}
      {showAcceptQuote && latestQuote && (
        <div className="be-status__section">
          <h4 className="be-status__section-title">Your Quote</h4>
          <QuoteDisplay
            quote={latestQuote}
            status={latestQuote.status}
            onAccept={onAcceptQuote}
            onReject={onRejectQuote}
          />
        </div>
      )}

      {/* ── Payment Summary ── */}
      {paidAmount > 0 && (
        <div className="be-status__section">
          <h4 className="be-status__section-title">Payment Summary</h4>
          <div className="be-status__payment-card">
            <div className="be-status__payment-row">
              <span>Total Amount</span><span className="be-status__payment-amount">{formatMoney(totalAmount)}</span>
            </div>
            <div className="be-status__payment-row be-status__payment-row--paid">
              <span>Paid</span><span className="be-status__payment-amount">{formatMoney(paidAmount)}</span>
            </div>
            {remainingAmount > 0 && (
              <div className="be-status__payment-row be-status__payment-row--remaining">
                <span>Remaining</span><span className="be-status__payment-amount">{formatMoney(remainingAmount)}</span>
              </div>
            )}
          </div>
          {payments.length > 0 && (
            <div className="be-status__payment-history">
              {payments.map((p, i) => (
                <div key={p._id || i} className="be-status__payment-item">
                  <span className="be-status__payment-item-label">
                    <span className="be-status__payment-dot" />
                    {p.type === "deposit" ? "Token Payment" : "Payment"} — {p.provider || "—"}
                  </span>
                  <span className="be-status__payment-item-amount">{formatMoney(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Cancellation Policy ── */}
      {cancellationPolicy && (
        <div className="be-status__section">
          <h4 className="be-status__section-title">Cancellation Policy</h4>
          <div className="be-status__policy">
            <div className="be-status__policy-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p className="be-status__policy-text">{cancellationPolicy}</p>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="be-status__actions">
        {showPayButton && (
          <Button
            variant="solid"
            color="primary"
            text={`Pay ${formatMoney(payAmount)}`}
            onClick={onPay}
          />
        )}
        {showCancel && (
          <Button
            variant="outline"
            color="danger"
            text="Cancel Booking"
            onClick={onCancel}
          />
        )}
      </div>
    </div>
  );
}
