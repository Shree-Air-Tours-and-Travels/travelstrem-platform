import React from "react";
import {
  Button,
  Icon,
  MetricSummary,
  NoDataFound,
  OverviewRail,
  StatusBadge,
} from "@packages/trem-ui";
import "./OverviewView.scss";

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function DashboardView({
  user,
  stats,
  copy = {},
  journeyStage = "discover",
  journeyHero,
  sections = {},
  metricsDefinition,
  recentActivity = [],
  upcomingTrips = [],
  recentEmptyState,
  upcomingEmptyState,
  overviewRail,
  overviewDefinitionLoading = false,
  overviewStatsLoading = false,
  onTabChange,
}) {
  const metricItems = (metricsDefinition?.items || []).map((item) => ({
    ...item,
    label: item.label || "",
    value: stats?.[item.valueKey] ?? 0,
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));
  const recentItems = recentActivity.slice(0, sections.recent?.limit || 5);
  const tripItems = upcomingTrips.slice(0, sections.upcoming?.limit || 5);
  const showTripsPanel = Boolean(upcomingEmptyState) || tripItems.length > 0;
  const showRecentPanel = Boolean(recentEmptyState) || recentItems.length > 0;
  const statusState = journeyStage === "discover" ? null : journeyHero?.states?.[journeyStage];
  const greetingKey = `greeting${getTimeOfDay().replace(/^./, (value) => value.toUpperCase())}`;
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || copy.greetingFallbackName || "";
  const greetingText = [copy[greetingKey], firstName].filter(Boolean).join(", ");

  return (
    <div className="dov dov-dashboard">
      <section className="dov-dashboard__welcome" aria-label={copy.dashboardAriaLabel}>
        <div>
          <span className="dov-dashboard__eyebrow">
            <Icon name="management" size={16} />
            {copy.dashboardEyebrow}
          </span>
          <h1>{greetingText || copy.dashboardTitle}</h1>
          <p>{copy.dashboardDescription}</p>
        </div>
        <Button
          text={copy.dashboardBookingsAction}
          iconLeft="calendarDays"
          iconRight="chevronRight"
          variant="solid"
          color="primary"
          onClick={() => onTabChange?.("bookings")}
        />
      </section>

      {!overviewStatsLoading && !overviewDefinitionLoading && metricItems.length ? (
        <MetricSummary items={metricItems} ariaLabel={metricsDefinition.ariaLabel} className="dov__stats" />
      ) : null}

      {statusState ? (
        <section className="dov__bookings-hero" aria-label={journeyHero?.bookingsSectionTitle}>
          <div>
            <span className="dov__bookings-eyebrow">{journeyHero?.bookingsSectionTitle}</span>
            <h2>{statusState.title}</h2>
            <p>{statusState.description}</p>
          </div>
          <Button
            text={journeyHero?.bookingsActionLabel}
            iconRight="chevronRight"
            variant="solid"
            color="primary"
            onClick={() => onTabChange?.("bookings")}
          />
        </section>
      ) : null}

      <div className="dov__content">
        <main className="dov__main">
          {showRecentPanel ? (
            <section className="dov__section dov__activity" aria-label={copy.recentSectionAriaLabel}>
              <div className="dov__section-heading">
                <span className="dov__section-icon"><Icon name="clock" size={18} /></span>
                <h2 className="dov__section-title">{copy.recentBookingsTitle}</h2>
                <Button
                  text={copy.dashboardViewAllBookings}
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => onTabChange?.("bookings")}
                />
              </div>
              {recentItems.length ? (
                <ul className="dov__recent">
                  {recentItems.map((item) => (
                    <li key={item.id || item.enquiryRef}>
                      <button
                        type="button"
                        className="dov__recent-item"
                        onClick={() => onTabChange?.(sections.recent?.targetTab)}
                        aria-label={`${copy.recentOpenAction}: ${item.title || copy.recentDefaultTitle}`}
                      >
                        <span className="dov__recent-icon" aria-hidden="true">
                          <Icon name={item.icon || "clock"} size={18} />
                        </span>
                        <span className="dov__recent-info">
                          <span className="dov__recent-name">{item.activityTitle || item.title || copy.recentDefaultTitle}</span>
                          {item.description ? <span className="dov__recent-description">{item.description}</span> : null}
                          <span className="dov__recent-meta">
                            {item.enquiryRef ? <span>{item.enquiryRef}</span> : null}
                            <span>{item.title || item.request?.departure || ""}</span>
                          </span>
                        </span>
                        <StatusBadge value={item.statusLabel || item.status} size="sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <NoDataFound {...recentEmptyState} />
              )}
            </section>
          ) : null}
        </main>

        <aside className="dov__side">
          {showTripsPanel ? (
            <section className="dov__section dov__trips-panel" aria-label={copy.upcomingSectionAriaLabel}>
              <div className="dov__section-heading">
                <span className="dov__section-icon"><Icon name="calendarDays" size={18} /></span>
                <h2 className="dov__section-title">{copy.upcomingTripsTitle}</h2>
              </div>
              {tripItems.length ? (
                <ul className="dov__trips">
                  {tripItems.map((trip) => (
                    <li key={trip.id || trip.enquiryRef}>
                      <button
                        type="button"
                        className="dov__trip-card"
                        onClick={() => onTabChange?.(sections.upcoming?.targetTab)}
                        aria-label={`${copy.upcomingOpenAction}: ${trip.title}`}
                      >
                        <span className="dov__trip-icon"><Icon name="plane" /></span>
                        <span className="dov__trip-copy">
                          <strong>{trip.title}</strong>
                          <small>{trip.departureLabel}</small>
                          {trip.enquiryRef ? <small>{trip.enquiryRef}</small> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <NoDataFound {...upcomingEmptyState} />
              )}
            </section>
          ) : null}
          {overviewRail ? (
            <OverviewRail {...overviewRail} className="dov__rail" onAction={(target) => onTabChange?.(target)} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
