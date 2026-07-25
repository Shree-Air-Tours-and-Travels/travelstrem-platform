import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./BookingJourneyCard.styles.scss";

const STATUS_LABEL = (s) =>
  String(s || "PENDING")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 ? 2 : 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
};

const toDateLabel = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const TIMELINE_LIMIT = 6;

export default function BookingJourneyCard({
  booking = {},
  onViewTour,
  onDownloadQuote,
  onDownloadInvoice,
  onDownloadBookingPass,
  className,
}) {
  const tour = booking.tour || {};
  const status = String(booking.status || "").toUpperCase();
  const currency = booking.priceSnapshot?.currency || "INR";

  const price = useMemo(() => {
    const ps = booking.priceSnapshot || {};
    const pay = booking.paymentSummary || {};
    const perPerson = typeof ps.perPerson === "number" ? ps.perPerson : 0;
    const total = typeof ps.total === "number" ? ps.total : perPerson * (booking.guestsCount || 1);
    return {
      perPerson: formatCurrency(perPerson, currency),
      total: formatCurrency(total, currency),
      paid: formatCurrency(pay.paid, currency),
      remaining: formatCurrency(pay.remaining, currency),
      isFinal: Boolean(ps.isFinal || booking.currentQuote),
    };
  }, [booking, currency]);

  const timeline = useMemo(() => {
    const items = booking.timeline || booking.statusHistory || [];
    return items.slice(0, TIMELINE_LIMIT);
  }, [booking]);

  const photo = tour.photo || tour.photos?.[0] || "";
  const cityRoute = tour.city?.from && tour.city?.to ? `${tour.city.from} → ${tour.city.to}` : "";
  const guests = booking.guestsCount || booking.travelers?.length || 1;

  return (
    <article className={`bjc ${className || ""}`.trim()}>
      {photo ? (
        <div className="bjc__hero">
          <img src={photo} alt={tour.title || "Tour"} />
          <span className={`bjc__status bjc__status--${status.toLowerCase()}`}>
            {STATUS_LABEL(status)}
          </span>
          {booking.bookingRef ? (
            <span className="bjc__ref">{booking.bookingRef}</span>
          ) : null}
        </div>
      ) : (
        <div className="bjc__hero bjc__hero--empty">
          <span className={`bjc__status bjc__status--${status.toLowerCase()}`}>
            {STATUS_LABEL(status)}
          </span>
          {booking.bookingRef ? (
            <span className="bjc__ref">{booking.bookingRef}</span>
          ) : null}
        </div>
      )}

      <div className="bjc__body">
        <div className="bjc__header">
          <h3 className="bjc__title">{tour.title || "Untitled Tour"}</h3>
          {cityRoute ? <span className="bjc__route">{cityRoute}</span> : null}
          {tour.desc ? <p className="bjc__desc">{tour.desc}</p> : null}
        </div>

        <div className="bjc__meta">
          {booking.startDate ? (
            <div className="bjc__meta-item">
              <Icon name="calendar" size={14} />
              <span>{toDateLabel(booking.startDate)}{booking.endDate ? ` → ${toDateLabel(booking.endDate)}` : ""}</span>
            </div>
          ) : null}
          <div className="bjc__meta-item">
            <Icon name="users" size={14} />
            <span>{guests} {guests === 1 ? "guest" : "guests"}</span>
          </div>
          {booking.assignedAgent?.name ? (
            <div className="bjc__meta-item">
              <Icon name="user" size={14} />
              <span>{booking.assignedAgent.name}</span>
            </div>
          ) : null}
        </div>

        <div className="bjc__pricing">
          <div className="bjc__price-row">
            <span>{price.isFinal ? "Per person" : "Est. per person"}</span>
            <strong>{price.perPerson}</strong>
          </div>
          <div className="bjc__price-row bjc__price-row--total">
            <span>{price.isFinal ? "Total" : "Est. total"}</span>
            <strong>{price.total}</strong>
          </div>
          {(booking.paymentSummary?.paid || 0) > 0 ? (
            <>
              <div className="bjc__price-row">
                <span>Paid</span>
                <strong className="bjc__paid">{price.paid}</strong>
              </div>
              <div className="bjc__price-row">
                <span>Remaining</span>
                <strong>{price.remaining}</strong>
              </div>
            </>
          ) : null}
        </div>

        {timeline.length ? (
          <div className="bjc__timeline">
            <h4 className="bjc__timeline-title">Journey Timeline</h4>
            <div className="bjc__timeline-track">
              {timeline.map((item, index) => (
                <div
                  key={item.id || item._id || item.createdAt || index}
                  className={`bjc__timeline-step ${index === 0 ? "is-current" : ""}`}
                >
                  <div className="bjc__timeline-dot" />
                  <div className="bjc__timeline-content">
                    <strong>{item.action || STATUS_LABEL(item.to)}</strong>
                    <time>{toDateLabel(item.createdAt) || "N/A"}</time>
                  </div>
                  {index < timeline.length - 1 ? <div className="bjc__timeline-line" /> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bjc__actions">
          {onViewTour ? (
            <button type="button" className="bjc__action bjc__action--primary" onClick={() => onViewTour(booking)}>
              <Icon name="externalLink" size={14} />
              View Tour
            </button>
          ) : null}
          {onDownloadQuote ? (
            <button type="button" className="bjc__action bjc__action--outline" onClick={() => onDownloadQuote(booking)}>
              <Icon name="download" size={14} />
              Quote
            </button>
          ) : null}
          {onDownloadInvoice ? (
            <button type="button" className="bjc__action bjc__action--outline" onClick={() => onDownloadInvoice(booking)}>
              <Icon name="download" size={14} />
              Invoice
            </button>
          ) : null}
          {onDownloadBookingPass ? (
            <button type="button" className="bjc__action bjc__action--outline" onClick={() => onDownloadBookingPass(booking)}>
              <Icon name="download" size={14} />
              Booking Pass
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

BookingJourneyCard.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    bookingRef: PropTypes.string,
    status: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    guestsCount: PropTypes.number,
    assignedAgent: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
    tour: PropTypes.shape({
      title: PropTypes.string,
      desc: PropTypes.string,
      photo: PropTypes.string,
      photos: PropTypes.arrayOf(PropTypes.string),
      city: PropTypes.shape({ from: PropTypes.string, to: PropTypes.string }),
    }),
    priceSnapshot: PropTypes.shape({
      currency: PropTypes.string,
      perPerson: PropTypes.number,
      total: PropTypes.number,
      isFinal: PropTypes.bool,
    }),
    paymentSummary: PropTypes.shape({
      total: PropTypes.number,
      paid: PropTypes.number,
      remaining: PropTypes.number,
      refunded: PropTypes.number,
    }),
    currentQuote: PropTypes.any,
    travelers: PropTypes.arrayOf(PropTypes.object),
    timeline: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      action: PropTypes.string,
      to: PropTypes.string,
      createdAt: PropTypes.string,
    })),
    statusHistory: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      action: PropTypes.string,
      to: PropTypes.string,
      createdAt: PropTypes.string,
    })),
  }).isRequired,
  onViewTour: PropTypes.func,
  onDownloadQuote: PropTypes.func,
  onDownloadInvoice: PropTypes.func,
  onDownloadBookingPass: PropTypes.func,
  className: PropTypes.string,
};

BookingJourneyCard.defaultProps = {
  onViewTour: null,
  onDownloadQuote: null,
  onDownloadInvoice: null,
  onDownloadBookingPass: null,
  className: "",
};
