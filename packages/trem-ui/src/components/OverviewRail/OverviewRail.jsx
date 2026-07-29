import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import NoDataFound from "../NoDataFound/NoDataFound.jsx";
import "./OverviewRail.styles.scss";

function linkRel(target, rel) {
  return rel || (target === "_blank" ? "noopener noreferrer" : undefined);
}

export function UpcomingTripCard({
  title,
  detailsLabel,
  detailsHref,
  detailsAriaLabel = "",
  emptyState,
  trip = null,
}) {
  return (
    <section className="trem-rail-card trem-upcoming-trip">
      <header className="trem-rail-card__header">
        <h2>{title}</h2>
        {trip ? (
          <a href={detailsHref} aria-label={detailsAriaLabel || detailsLabel}>
            {detailsLabel}
            <Icon name="arrowUpRight" size={18} />
          </a>
        ) : null}
      </header>
      {trip ? (
        <>
          <div className="trem-upcoming-trip__media">
            <img src={trip.image} alt={trip.imageAlt || ""} loading="lazy" />
            {trip.productName ? <span>{trip.productName}</span> : null}
          </div>
          <h3>{trip.title}</h3>
          <div className="trem-upcoming-trip__meta">
            <span><Icon name="calendar" size={17} />{trip.dateRange}</span>
            <strong>{trip.duration}</strong>
          </div>
        </>
      ) : (
        <NoDataFound {...emptyState} compact />
      )}
    </section>
  );
}

export function QuickActionsCard({ title, items = [] }) {
  return (
    <section className="trem-rail-card trem-quick-actions">
      <header className="trem-rail-card__header"><h2>{title}</h2></header>
      <nav aria-label={title}>
        {items.map((item) => {
          const Tag = item.disabled ? "div" : "a";
          return (
            <Tag
              key={item.id}
              href={item.disabled ? undefined : item.href}
              target={item.disabled ? undefined : (item.target || "_self")}
              rel={item.disabled ? undefined : linkRel(item.target, item.rel)}
              aria-label={item.ariaLabel || item.title}
              aria-disabled={item.disabled || undefined}
              className={item.disabled ? "is-disabled" : ""}
            >
              <span className="trem-quick-actions__icon"><Icon name={item.icon} size={20} /></span>
              <span className="trem-quick-actions__copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              {!item.disabled ? <Icon name="chevronRight" size={20} aria-hidden="true" /> : null}
            </Tag>
          );
        })}
      </nav>
    </section>
  );
}

export function ExclusiveOfferCard({
  title,
  headline,
  description,
  codeLabel,
  code,
  image,
  imageAlt = "",
  href,
  target = "_self",
  rel = "",
  ariaLabel = "",
  available = true,
  emptyState,
}) {
  return (
    <section className="trem-rail-card trem-exclusive-offer">
      <header className="trem-rail-card__header"><h2>{title}</h2></header>
      {available ? (
        <a
          className="trem-exclusive-offer__content"
          href={href}
          target={target}
          rel={linkRel(target, rel)}
          aria-label={ariaLabel || headline}
        >
          <span className="trem-exclusive-offer__copy">
            <strong>{headline}</strong>
            <span>{description}</span>
            <span className="trem-exclusive-offer__code"><em>{codeLabel}</em> {code}</span>
          </span>
          <img src={image} alt={imageAlt} loading="lazy" />
        </a>
      ) : (
        <NoDataFound {...emptyState} compact />
      )}
    </section>
  );
}

const WIDGET_COMPONENTS = {
  upcomingTrip: UpcomingTripCard,
  quickActions: QuickActionsCard,
  exclusiveOffer: ExclusiveOfferCard,
};

export default function OverviewRail({ widgets = [], ariaLabel = "", className = "" }) {
  if (!widgets.length) return null;

  return (
    <aside
      className={`trem-overview-rail${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      {widgets.map(({ id, type, ...props }) => {
        const Widget = WIDGET_COMPONENTS[type];
        return Widget ? <Widget key={id} {...props} /> : null;
      })}
    </aside>
  );
}

const actionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
});

QuickActionsCard.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(actionShape),
};

UpcomingTripCard.propTypes = {
  title: PropTypes.string.isRequired,
  detailsLabel: PropTypes.string,
  detailsHref: PropTypes.string,
  detailsAriaLabel: PropTypes.string,
  emptyState: PropTypes.object.isRequired,
  trip: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    imageAlt: PropTypes.string,
    dateRange: PropTypes.string,
    duration: PropTypes.string,
    productName: PropTypes.string,
  }),
};

ExclusiveOfferCard.propTypes = {
  title: PropTypes.string.isRequired,
  headline: PropTypes.string.isRequired,
  description: PropTypes.string,
  codeLabel: PropTypes.string,
  code: PropTypes.string,
  image: PropTypes.string.isRequired,
  imageAlt: PropTypes.string,
  href: PropTypes.string.isRequired,
  target: PropTypes.string,
  rel: PropTypes.string,
  ariaLabel: PropTypes.string,
  available: PropTypes.bool,
  emptyState: PropTypes.object,
};

OverviewRail.propTypes = {
  widgets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.keys(WIDGET_COMPONENTS)).isRequired,
  })),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};
