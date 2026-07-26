import React from "react";
import "./QuoteDisplay.styles.scss";

export default function QuoteDisplay({
  quote = {},
  status = "SENT",
  onAccept,
  onReject,
  showActions = true,
  className = "",
}) {
  const items = quote.items || [];
  const breakdown = [
    { label: "Base Price", amount: quote.basePrice },
    { label: "Hotel", amount: quote.hotelPrice },
    { label: "Flights", amount: quote.flightPrice },
    { label: "Visa", amount: quote.visaFee },
    { label: "Insurance", amount: quote.insuranceFee },
    { label: "Taxes & Fees", amount: quote.taxes },
    { label: "Service Fee", amount: quote.serviceFee },
    { label: "Agent Markup", amount: quote.agentMarkup },
  ].filter((row) => row.amount > 0);

  const isPending = ["SENT", "READY"].includes(status);
  const isAccepted = status === "ACCEPTED";
  const isRejected = status === "REJECTED";

  return (
    <div className={`quote-display ${isAccepted ? "quote-display--accepted" : ""} ${isRejected ? "quote-display--rejected" : ""} ${className}`}>
      <div className="quote-display__header">
        <div className="quote-display__header-left">
          <span className="quote-display__ref">{quote.quoteRef || ""}</span>
          <span className="quote-display__version">Version {quote.version || 1}</span>
        </div>
        {quote.expirationDate && (
          <span className="quote-display__expiry">
            Valid until {new Date(quote.expirationDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="quote-display__body">
        {breakdown.length > 0 && (
          <div className="quote-display__breakdown">
            {breakdown.map((row) => (
              <div key={row.label} className="quote-display__row">
                <span className="quote-display__row-label">{row.label}</span>
                <span className="quote-display__row-amount">₹{row.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="quote-display__items">
            {items.map((item, idx) => (
              <div key={item._id || idx} className="quote-display__row">
                <span className="quote-display__row-label">{item.label}</span>
                <span className="quote-display__row-amount">₹{(item.amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {(quote.discount > 0 || quote.couponDiscount > 0) && (
          <div className="quote-display__discount">
            {(quote.discount > 0) && (
              <div className="quote-display__row quote-display__row--discount">
                <span className="quote-display__row-label">Discount</span>
                <span className="quote-display__row-amount">-₹{quote.discount.toLocaleString()}</span>
              </div>
            )}
            {(quote.couponDiscount > 0) && (
              <div className="quote-display__row quote-display__row--discount">
                <span className="quote-display__row-label">Coupon</span>
                <span className="quote-display__row-amount">-₹{quote.couponDiscount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <div className="quote-display__total">
          <span className="quote-display__total-label">Total</span>
          <span className="quote-display__total-amount">₹{(quote.finalAmount || 0).toLocaleString()}</span>
        </div>

        {quote.notes && <p className="quote-display__notes">{quote.notes}</p>}
      </div>

      {showActions && isPending && (
        <div className="quote-display__actions">
          <button className="quote-display__btn quote-display__btn--reject" onClick={onReject} type="button">
            Decline
          </button>
          <button className="quote-display__btn quote-display__btn--accept" onClick={onAccept} type="button">
            Accept Quote
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="quote-display__status-banner quote-display__status-banner--accepted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Quote Accepted
        </div>
      )}

      {isRejected && (
        <div className="quote-display__status-banner quote-display__status-banner--rejected">
          Quote Declined
        </div>
      )}
    </div>
  );
}
