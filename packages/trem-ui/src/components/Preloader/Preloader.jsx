import React from "react";
import PropTypes from "prop-types";
import "./Preloader.styles.scss";

const VARIANTS = ["cards", "stack", "stats", "hero", "featured", "filters", "grid",
  "dashboard", "dashboardAnalytics", "dashboardServices", "dashboardWidget", "dashboardTable", "dashboardDetail"];

export default function Preloader({
  variant = "cards",
  count = 4,
  label = "Loading content",
  className = "",
}) {
  const isCardLike = variant === "cards" || variant === "stack" || variant === "stats";
  const showMultiple =
    variant === "cards" || variant === "stack" || variant === "stats" || variant === "grid";
  const dashboardVariant = variant.startsWith("dashboard");

  return (
    <section
      className={`trem-preloader trem-preloader--${variant}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {dashboardVariant ? (
        <div className="trem-preloader__dashboard" aria-hidden="true">
          {variant === "dashboard" || variant === "dashboardAnalytics" ? <>
            {variant === "dashboard" ? <div className="trem-preloader__dashboard-hero">
              <span className="trem-preloader__dashboard-copy is-kicker" />
              <span className="trem-preloader__dashboard-copy is-title" />
              <span className="trem-preloader__dashboard-copy is-description" />
              <span className="trem-preloader__dashboard-copy is-control" />
            </div> : null}
            <div className="trem-preloader__dashboard-metrics">
              {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
            </div>
            <div className="trem-preloader__dashboard-panels">
              <span className="is-chart" /><span className="is-donut" />
            </div>
          </> : variant === "dashboardServices" ? <div className="trem-preloader__dashboard-services">
            {Array.from({ length: Math.max(2, count) }, (_, index) => <div key={index}><i /><span /><small /></div>)}
          </div> : variant === "dashboardTable" ? <div className="trem-preloader__dashboard-table">
            <div className="trem-preloader__dashboard-table-head"><span /><span /></div>
            {Array.from({ length: Math.max(3, count) }, (_, index) => <div className="trem-preloader__dashboard-row" key={index}>
              <i /><span /><span /><span />
            </div>)}
          </div> : variant === "dashboardDetail" ? <div className="trem-preloader__dashboard-detail">
            <span className="is-heading" />
            {Array.from({ length: Math.max(4, count) }, (_, index) => <div key={index}><i /><span /><strong /></div>)}
          </div> : <div className="trem-preloader__dashboard-widget">
            <div className="trem-preloader__dashboard-widget-head"><span /><i /></div>
            {Array.from({ length: Math.max(3, count) }, (_, index) => <div className="trem-preloader__dashboard-widget-row" key={index}><i /><span /><strong /></div>)}
          </div>}
        </div>
      ) : variant === "hero" ? (
        <div className="trem-preloader__hero" aria-hidden="true">
          <div className="trem-preloader__hero-body">
            <span className="trem-preloader__hero-line trem-preloader__hero-line--sm" />
            <span className="trem-preloader__hero-line trem-preloader__hero-line--lg" />
            <span className="trem-preloader__hero-line trem-preloader__hero-line--md" />
            <div className="trem-preloader__hero-actions">
              <span className="trem-preloader__hero-btn" />
              <span className="trem-preloader__hero-btn" />
            </div>
          </div>
          <div className="trem-preloader__hero-media" />
        </div>
      ) : variant === "featured" ? (
        <div className="trem-preloader__featured" aria-hidden="true">
          <div className="trem-preloader__featured-card">
            <span className="trem-preloader__featured-media" />
            <span className="trem-preloader__featured-body">
              <span className="trem-preloader__featured-line trem-preloader__featured-line--lg" />
              <span className="trem-preloader__featured-line trem-preloader__featured-line--md" />
              <span className="trem-preloader__featured-line trem-preloader__featured-line--sm" />
              <span className="trem-preloader__featured-line trem-preloader__featured-line--xs" />
            </span>
          </div>
          <div className="trem-preloader__featured-dots">
            <span className="trem-preloader__featured-dot" />
            <span className="trem-preloader__featured-dot" />
            <span className="trem-preloader__featured-dot" />
          </div>
        </div>
      ) : variant === "filters" ? (
        <div className="trem-preloader__filters" aria-hidden="true">
          <span className="trem-preloader__heading" />
          <div className="trem-preloader__filter-chips">
            {Array.from({ length: count }, (_, index) => (
              <span className="trem-preloader__filter-chip" key={index} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <span className="trem-preloader__heading" aria-hidden="true" />
          <div className="trem-preloader__grid" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
              <div className="trem-preloader__item" key={index}>
                {isCardLike && variant !== "stats" ? (
                  <span className="trem-preloader__media" />
                ) : null}
                <span className="trem-preloader__body">
                  <span className="trem-preloader__line trem-preloader__line--strong" />
                  <span className="trem-preloader__line" />
                  {isCardLike && variant !== "stats" ? (
                    <span className="trem-preloader__line trem-preloader__line--short" />
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

Preloader.propTypes = {
  variant: PropTypes.oneOf(VARIANTS),
  count: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string,
};
