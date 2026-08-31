import React from "react";
import {
  Button,
  Icon,
  MetricSummary,
  NoDataFound,
  OverviewRail,
  PlanCards,
  StatusBadge,
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
  copy = {},
  journeyStage = "discover",
  journeyHero,
  sections = {},
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
    label: item.label || "",
    value: stats?.[item.valueKey] ?? 0,
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));
  const recentItems = (recentActivity || []).slice(0, sections.recent?.limit || 5);
  const tripItems = (upcomingTrips || []).slice(0, sections.upcoming?.limit || 5);
  const showTripsPanel = Boolean(upcomingEmptyState) || tripItems.length > 0;
  const showRecentPanel = Boolean(recentEmptyState) || recentItems.length > 0;
  const heroState = journeyHero?.states?.[journeyStage] || journeyHero?.states?.discover;
  const greetingKey = `greeting${getTimeOfDay().replace(/^./, (value) => value.toUpperCase())}`;
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || copy.greetingFallbackName || "";
  const greetingText = [copy[greetingKey], firstName].filter(Boolean).join(", ");

  const renderHeroAction = (action, variant) => {
    if (!action?.label) return null;
    return (
      <Button
        key={`${variant}-${action.targetTab || action.href || action.label}`}
        text={action.label}
        iconLeft={action.icon}
        iconRight={variant === "solid" ? "chevronRight" : null}
        variant={variant}
        color="primary"
        href={action.href}
        onClick={action.targetTab ? () => onTabChange?.(action.targetTab) : undefined}
        className="dov__hero-action"
      />
    );
  };

  return (
    <div className="dov">
      {heroState ? (
        <section className="dov__hero" aria-label={journeyHero?.ariaLabel}>
          <div className="dov__hero-copy">
            <span className="dov__hero-eyebrow">
              <Icon name="sparkles" size={16} />
              {journeyHero?.eyebrow}
            </span>
            {greetingText ? (
              <p className="dov__hero-greeting">
                {greetingText} <span aria-hidden="true">👋</span>
              </p>
            ) : null}
            <h1>{heroState.title}</h1>
            <p className="dov__hero-description">{heroState.description}</p>
            <div className="dov__hero-actions">
              {renderHeroAction(heroState.primaryAction, "solid")}
              {renderHeroAction(heroState.secondaryAction, "outline")}
            </div>
          </div>
          <div className="dov__hero-visual" aria-hidden="true">
            <span className="dov__hero-orbit dov__hero-orbit--outer" />
            <span className="dov__hero-orbit dov__hero-orbit--inner" />
            <span className="dov__hero-plane"><Icon name="plane" size={34} /></span>
            <span className="dov__hero-pin dov__hero-pin--one"><Icon name="destination" size={18} /></span>
            <span className="dov__hero-pin dov__hero-pin--two"><Icon name="heart" size={17} /></span>
          </div>
          <div className="dov__hero-trust">
            {(journeyHero?.trustItems || []).map((item) => (
              <span key={item.id}>
                <Icon name={item.icon} size={15} />
                {item.label}
              </span>
            ))}
          </div>
        </section>
      ) : !overviewDefinitionLoading && greetingText ? (
        <div className="dov__greeting">
          <h1>{greetingText}</h1>
          {copy.greetingDescription ? <p>{copy.greetingDescription}</p> : null}
        </div>
      ) : null}

      {!overviewStatsLoading && !overviewDefinitionLoading && metricItems.length ? (
        <MetricSummary
          items={metricItems}
          ariaLabel={metricsDefinition.ariaLabel}
          className="dov__stats"
        />
      ) : null}

      <div className="dov__content">
        <main className="dov__main">
          {planCards ? (
            <PlanCards
              {...planCards}
              className="dov__plan-cards"
              onSelect={(item) => onTabChange?.(item.targetTab, item)}
            />
          ) : null}

          {showRecentPanel && (
            <section className="dov__section dov__activity" aria-label={copy.recentSectionAriaLabel}>
              <div className="dov__section-heading">
                <span className="dov__section-icon"><Icon name="clock" size={18} /></span>
                <h2 className="dov__section-title">{copy.recentBookingsTitle}</h2>
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
                          <span className="dov__recent-name">
                            {item.activityTitle || item.title || copy.recentDefaultTitle}
                          </span>
                          {item.description ? (
                            <span className="dov__recent-description">{item.description}</span>
                          ) : null}
                          <span className="dov__recent-meta">
                            {item.enquiryRef && <span>{item.enquiryRef}</span>}
                            <span>{item.title || item.request?.departure || ""}</span>
                          </span>
                        </span>
                        <StatusBadge value={item.statusLabel || item.status} size="sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <NoDataFound
                  icon={recentEmptyState?.icon}
                  title={recentEmptyState?.title}
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
                  title={upcomingEmptyState?.title}
                  description={upcomingEmptyState?.description}
                  actionLabel={upcomingEmptyState?.actionLabel}
                  actionHref={upcomingEmptyState?.actionHref}
                  actionAriaLabel={upcomingEmptyState?.actionAriaLabel}
                />
              )}
            </section>
          )}

          {overviewRail ? (
            <OverviewRail
              {...overviewRail}
              className="dov__rail"
              onAction={(targetTab) => onTabChange?.(targetTab)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
