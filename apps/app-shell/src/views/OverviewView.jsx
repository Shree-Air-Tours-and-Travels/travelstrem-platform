import React from "react";
import {
  NoDataFound,
  MetricSummary,
  OverviewRail,
  PlanCards,
  Preloader,
  Spinner,
} from "@packages/trem-ui";
import "./OverviewView.scss";

function normalizeStatus(status) {
  if (!status) return "Draft";
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusKey(status) {
  return String(status || "").toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

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
  planCards,
  overviewRail,
  overviewDefinitionLoading = false,
  overviewStatsLoading = false,
  bookingsLoading = false,
  recentBookingsEmptyState,
  recentBookings,
  onTabChange,
  onViewBooking,
}) {
  const metricItems = (metricsDefinition?.items || []).map((item) => ({
    ...item,
    label: metricsDefinition.labels?.[item.labelRef] || item.label || "",
    value: stats?.[item.valueKey] ?? 0,
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));

  return (
    <div className="dov">
      <div className="dov__greeting">
        <h1>Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "there"} 👋 </h1>
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
          ariaLabel={metricsDefinition.labels?.[metricsDefinition.ariaLabelRef]}
          className="dov__stats"
        />
      ) : null}

      <div className={`dov__content${overviewRail || overviewDefinitionLoading ? "" : " dov__content--single"}`}>
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

          <div className="dov__section">
            <h2 className="dov__section-title">Recent Bookings</h2>
            {bookingsLoading ? (
              <div className="dov__bookings-loading">
                <Spinner size="lg" label="Loading bookings" />
              </div>
            ) : recentBookings && recentBookings.length > 0 ? (
              <div className="dov__recent">
                {recentBookings.slice(0, 5).map((b, i) => {
                  const tour = b.tour || {};
                  const tripName = tour.title || b.trip?.title || b.tripSelection?.packageId || "Trip";
                  const product = b.product || "trevista";

                  return (
                    <div key={b.id || b._id || i} className="dov__recent-item" onClick={() => onViewBooking?.(b)}>
                      <div className="dov__recent-info">
                        <span className="dov__recent-name">{tripName}</span>
                        <div className="dov__recent-meta">
                          <span className={`dov__recent-product dov__recent-product--${product}`}>
                            {product === "trevio" ? "Trevio" : "Trevista"}
                          </span>
                          <span>{formatDate(b.createdAt)}</span>
                        </div>
                      </div>
                      <span className={`dov__recent-status dov__recent-status--${statusKey(b.status)}`}>
                        {normalizeStatus(b.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              recentBookingsEmptyState ? <NoDataFound {...recentBookingsEmptyState} /> : null
            )}
          </div>
        </main>

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
  );
}
