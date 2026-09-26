import React from "react";
import PropTypes from "prop-types";
import CardWithSubEntity from "../CardWithSubEntity/CardWithSubEntity.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import MetricSummary from "../MetricSummary/MetricSummary.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./TourPerformance.styles.scss";

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

export default function TourPerformance({
  data,
  title = "Tour performance",
  description = "See how travellers engage with your published tours and packages.",
  onTourClick,
  onViewAll,
}) {
  if (!data?.schemaVersion) return null;
  const summary = data.summary || {};
  const policy = data.trendingPolicy || {};

  return (
    <section className="trem-tour-performance" aria-labelledby="tour-performance-title">
      <header className="trem-tour-performance__heading">
        <div>
          <span>Traveller engagement</span>
          <h2 id="tour-performance-title">{title}</h2>
          <p>{description}</p>
        </div>
        {onViewAll ? (
          <button type="button" onClick={onViewAll}>Tracking &amp; events</button>
        ) : null}
      </header>

      <MetricSummary
        variant="cards"
        ariaLabel="Tour engagement summary"
        items={[
          { id: "views", label: "Tracked views", value: formatNumber(summary.views), icon: "eye" },
          { id: "enquiries", label: "Enquiries", value: formatNumber(summary.enquiries), icon: "messageCircle" },
          { id: "bookings", label: "Bookings", value: formatNumber(summary.bookings), icon: "calendar" },
          { id: "trending", label: "Trending tours", value: formatNumber(summary.trendingTours), icon: "sparkles" },
        ]}
      />

      {(data.topTours || []).length ? (
        <div className="trem-tour-performance__list">
          {data.topTours.map((tour) => (
            <button
              type="button"
              className="trem-tour-performance__tour"
              key={tour.id}
              onClick={() => onTourClick?.(tour)}
              disabled={!onTourClick}
            >
              <span className="trem-tour-performance__tour-title">
                <strong>{tour.title}</strong>
                <small>{tour.trending ? "Trending automatically" : `${tour.trendScore || 0}/100 trend score`}</small>
              </span>
              <span><b>{formatNumber(tour.views)}</b><small>Views</small></span>
              <span><b>{formatNumber(tour.enquiries)}</b><small>Enquiries</small></span>
              <span><b>{formatNumber(tour.bookings)}</b><small>Bookings</small></span>
              <StatusBadge value={tour.trending ? "trending" : tour.status} size="sm" />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="map"
          title="No tour engagement yet"
          description="Views and traveller actions will appear after a published tour is opened."
        />
      )}

      <CardWithSubEntity
        className="trem-tour-performance__policy"
        eyebrow="Automatic ranking"
        title="How a tour becomes trending"
        subtitle={policy.description}
        items={[
          { label: "Tracked views", value: `${policy.minimumViews || 0}+` },
          { label: "Enquiries or bookings", value: `${policy.minimumEnquiries || 0}+ enquiries or ${policy.minimumBookings || 0}+ booking` },
          { label: "Recent trend score", value: `${policy.minimumTrendScore || 0}/100` },
        ]}
      />
    </section>
  );
}

TourPerformance.propTypes = {
  data: PropTypes.object,
  title: PropTypes.string,
  description: PropTypes.string,
  onTourClick: PropTypes.func,
  onViewAll: PropTypes.func,
};
