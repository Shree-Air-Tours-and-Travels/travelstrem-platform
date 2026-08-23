import React from "react";
import {
  Icon,
  MetricSummary,
  NoDataFound,
  OverviewRail,
  PlanCards,
  Preloader,
} from "@packages/trem-ui";
import "./OverviewView.scss";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function OverviewView({
  user,
  stats,
  metricsDefinition,
  recentActivity = [],
  upcomingTrips = [],
  recentEmptyState,
  upcomingEmptyState,
  planCards,
  overviewRail,
  overviewDefinitionLoading = false,
  overviewStatsLoading = false,
  onTabChange,
}) {
  const metricItems = (metricsDefinition?.items || []).map((item) => ({
    ...item,
    label: metricsDefinition.labels?.[item.labelRef] || item.label || "",
    value: stats?.[item.valueKey] ?? 0,
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));
  const recentItems = (recentActivity || []).slice(0, 5);
  const tripItems = (upcomingTrips || []).slice(0, 5);
  const showTripsPanel = Boolean(upcomingEmptyState) || tripItems.length > 0;
  const showRecentPanel = Boolean(recentEmptyState) || recentItems.length > 0;

  return (
    <div className="dov">
      <div className="dov__greeting">
        <h1>
          Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "there"} 👋{" "}
        </h1>
        <p>Here's what's happening with your travel plans</p>
      </div>

      {overviewStatsLoading || overviewDefinitionLoading ? (
        <Preloader
          variant="stats"
          count={1}
          label="Loading statistics"
          className="dov__stats-preloader"
        />
      ) : metricItems.length ? (
        <MetricSummary
          items={metricItems}
          ariaLabel={
            metricsDefinition.labels?.[metricsDefinition.ariaLabelRef] ||
            metricsDefinition.ariaLabelRef
          }
          className="dov__stats"
        />
      ) : null}

      <div className="dov__content">
        <main className="dov__main">
          {overviewDefinitionLoading ? (
            <Preloader
              variant="cards"
              count={3}
              label="Loading journey planning options"
              className="dov__plan-cards"
            />
          ) : planCards ? (
            <PlanCards {...planCards} className="dov__plan-cards" />
          ) : null}

          {showRecentPanel && (
            <section className="dov__section" aria-label="Recent bookings and enquiries">
              <h2 className="dov__section-title">Recent bookings &amp; enquiries</h2>
              {recentItems.length ? (
                <ul className="dov__recent">
                  {recentItems.map((item) => (
                    <li key={item.id || item.enquiryRef}>
                      <button
                        type="button"
                        className="dov__recent-item"
                        onClick={() => onTabChange?.("bookings")}
                        aria-label={`Open ${item.title || "enquiry"} in My Bookings`}
                      >
                        <span className="dov__recent-info">
                          <span className="dov__recent-name">
                            {item.title || "General tour enquiry"}
                          </span>
                          <span className="dov__recent-meta">
                            {item.enquiryRef && <span>{item.enquiryRef}</span>}
                            <span>{item.request?.departure || ""}</span>
                          </span>
                        </span>
                        <span className={`dov__recent-status dov__recent-status--${item.status}`}>
                          {item.statusLabel || item.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <NoDataFound
                  icon={recentEmptyState?.icon}
                  title={recentEmptyState?.title || "Nothing here yet"}
                  description={recentEmptyState?.description}
                  actionLabel={recentEmptyState?.actionLabel}
                  actionHref={recentEmptyState?.actionHref}
                  actionAriaLabel={recentEmptyState?.actionAriaLabel}
                />
              )}
            </section>
          )}
        </main>

        <div className="dov__side">
          {showTripsPanel && (
            <section className="dov__section dov__trips-panel" aria-label="Upcoming trips">
              {tripItems.length ? (
                <ul className="dov__trips">
                  {tripItems.map((trip) => (
                    <li key={trip.id || trip.enquiryRef}>
                      <button
                        type="button"
                        className="dov__trip-card"
                        onClick={() => onTabChange?.("bookings")}
                        aria-label={`Open ${trip.title} in My Bookings`}
                      >
                        <span className="dov__trip-icon">
                          <Icon name="plane" />
                        </span>
                        <span className="dov__trip-copy">
                          <strong>{trip.title}</strong>
                          <small>{trip.departureLabel}</small>
                          {trip.enquiryRef && <small>{trip.enquiryRef}</small>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <NoDataFound
                  icon={upcomingEmptyState?.icon}
                  title={upcomingEmptyState?.title || "No upcoming trips"}
                  description={upcomingEmptyState?.description}
                  actionLabel={upcomingEmptyState?.actionLabel}
                  actionHref={upcomingEmptyState?.actionHref}
                  actionAriaLabel={upcomingEmptyState?.actionAriaLabel}
                />
              )}
            </section>
          )}

          {overviewDefinitionLoading ? (
            <Preloader
              variant="stack"
              count={3}
              label="Loading travel tools"
              className="dov__rail"
            />
          ) : overviewRail ? (
            <OverviewRail {...overviewRail} className="dov__rail" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
