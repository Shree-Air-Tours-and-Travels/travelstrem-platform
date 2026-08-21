import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./Support.styles.scss";

const activate = (handler, disabled) => (event) => {
  if (disabled) return;
  if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  handler?.();
};

export function SupportActionCard({ action, onSelect, className = "" }) {
  const disabled = action?.enabled === false;
  return (
    <button type="button" className={`trem-support-action trem-support-action--${action?.tone || "neutral"} ${className}`} onClick={() => !disabled && onSelect?.(action)} disabled={disabled} aria-label={action?.label}>
      <span className="trem-support-action__icon"><Icon name={action?.icon || "support"} size={20} /></span>
      <span>{action?.label}</span>
    </button>
  );
}

export function SupportActionGrid({ actions = [], onSelect, className = "" }) {
  if (!actions.length) return null;
  return <div className={`trem-support-actions ${className}`}>{actions.map((action) => <SupportActionCard key={action.id} action={action} onSelect={onSelect} />)}</div>;
}

export function SupportBookingCard({ booking, onSelect, onAction, className = "" }) {
  return (
    <article className={`trem-support-booking ${className}`}>
      <div className="trem-support-booking__main" role="button" tabIndex={0} onClick={() => onSelect?.(booking)} onKeyDown={activate(() => onSelect?.(booking), false)} aria-label={`Get help with ${booking?.title}`}>
        {booking?.image ? <img className="trem-support-booking__image" src={booking.image} alt="" /> : <span className={`trem-support-booking__fallback trem-support-booking__fallback--${booking?.service?.tone || "neutral"}`}><Icon name={booking?.service?.icon || "support"} size={28} /></span>}
        <div className="trem-support-booking__copy">
          {booking?.service?.name ? <span className="trem-support-booking__service">{booking.service.name}</span> : null}
          <h3>{booking?.title}</h3>
          {booking?.dateLabel ? <p>{booking.dateLabel}</p> : null}
          {booking?.provider?.label ? <small>{booking.provider.label}</small> : null}
        </div>
        {booking?.status ? <StatusBadge value={booking.status.label || booking.status.id} tone={booking.status.tone} size="sm" /> : null}
      </div>
      <SupportActionGrid actions={booking?.supportActions} onSelect={(action) => onAction?.(action, booking)} />
    </article>
  );
}

export function SupportCategoryCard({ item, onSelect, className = "" }) {
  if (!item || item.hide) return null;
  return (
    <button type="button" className={`trem-support-category ${className}`} onClick={() => onSelect?.(item)}>
      <span className={`trem-support-category__icon trem-support-category__icon--${item?.tone || "neutral"}`}><Icon name={item?.icon || "support"} size={22} /></span>
      <span className="trem-support-category__copy"><strong>{item?.label || item?.name || item?.title}</strong>{item?.description ? <small>{item.description}</small> : null}</span>
      <Icon name="chevronRight" size={18} />
    </button>
  );
}

export function SupportTopicRow({ topic, onSelect, className = "" }) {
  return <SupportCategoryCard item={{ ...topic, label: topic?.title }} onSelect={onSelect} className={`trem-support-topic ${className}`} />;
}

export function SupportContactMethod({ option, onSelect, className = "" }) {
  const disabled = option?.availability === "UNAVAILABLE";
  return (
    <button type="button" className={`trem-support-contact ${className}`} disabled={disabled} onClick={() => !disabled && onSelect?.(option)}>
      <span className="trem-support-contact__icon"><Icon name={option?.icon || "support"} size={23} /></span>
      <span className="trem-support-contact__copy"><strong>{option?.label}</strong>{option?.description ? <small>{option.description}</small> : null}{option?.availabilityLabel ? <em>{option.availabilityLabel}</em> : null}</span>
      <Icon name="chevronRight" size={18} />
    </button>
  );
}

export function SupportTicketCard({ ticket, onSelect, className = "" }) {
  const status = typeof ticket?.status === "object" ? ticket.status : { id: ticket?.status, label: ticket?.statusLabel || ticket?.status };
  return (
    <button type="button" className={`trem-support-ticket ${className}`} onClick={() => onSelect?.(ticket)}>
      <span className="trem-support-ticket__copy">
        <span className="trem-support-ticket__reference">{ticket?.reference}</span>
        <strong>{ticket?.subject}</strong>
        {ticket?.bookingLabel ? <small>{ticket.bookingLabel}</small> : null}
        {ticket?.updatedLabel ? <small>{ticket.updatedLabel}</small> : null}
      </span>
      <span className="trem-support-ticket__meta">
        {ticket?.unreadByCustomer ? <span className="trem-support-ticket__unread" aria-label="Unread response" /> : null}
        {status?.label ? <StatusBadge value={status.label} tone={status.tone} size="sm" /> : null}
        <Icon name="chevronRight" size={18} />
      </span>
    </button>
  );
}

export function SupportSkeleton({ rows = 3, className = "" }) {
  return <div className={`trem-support-skeleton ${className}`} aria-label="Loading support content" aria-busy="true">{Array.from({ length: rows }, (_, index) => <span key={index} className="trem-support-skeleton__row" />)}</div>;
}
