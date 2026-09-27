import "./DashboardLayout.scss";
import "./DashboardJourney.scss";
import React from "react";
import { Button, DashboardPanel, MetricSummary, OverviewRail, Pagination } from "@packages/trem-ui";
import { InfoWidget, ListingWidget, ProgressWidget } from "../../DashboardWidgets";
import { formatTimestamp } from "./dashboardHelpers";
export default function DashboardOperations({ model, onTabChange, isGuestDashboard = false, hasUserSnapshots = false, children }) {
  const { metrics, widgets, journey, panels, activity, rail } = model;
  return <>
      {!isGuestDashboard && !hasUserSnapshots && model.kind !== "admin" && metrics && !metrics.hidden && metrics.items.length ? (
        <MetricSummary
          className="admin-overview__metrics"
          variant="cards"
          ariaLabel={metrics.ariaLabel}
          items={metrics.items}
        />
      ) : null}

      {model.kind !== "admin" &&
      widgets &&
      [widgets.progressWidget, widgets.listingWidget, model.kind !== "partner" && widgets.infoWidget].some(Boolean) ? (
        <div className="admin-overview__widget-grid">
          {widgets.progressWidget ? <ProgressWidget {...widgets.progressWidget} /> : null}
          {widgets.listingWidget ? (
            <ListingWidget
              {...widgets.listingWidget}
              onRowClick={widgets.listingWidget.onRowClick || ((target) => onTabChange?.(target))}
            />
          ) : null}
          {model.kind !== "partner" && widgets.infoWidget ? <InfoWidget {...widgets.infoWidget} /> : null}
        </div>
      ) : null}

      {children}
      {!isGuestDashboard && !hasUserSnapshots && journey ? (
        <section className="admin-overview__journey" aria-label={journey.ariaLabel || undefined}>
          <div>
            {journey.eyebrow ? <span>{journey.eyebrow}</span> : null}
            <h2>{journey.title}</h2>
            <p>{journey.description}</p>
          </div>
          <Button
            text={journey.actionLabel}
            iconRight="chevronRight"
            variant="solid"
            color="primary"
            onClick={journey.onAction}
          />
        </section>
      ) : null}

      {!isGuestDashboard && !hasUserSnapshots && model.kind !== "admin" ? (
        <>
          {[
            panels.inventory,
            panels.workload,
            rail.platform,
            rail.quickActions?.items.length ? rail.quickActions : null,
          ].some(Boolean) ? (
            <div className="admin-overview__operations-grid">
              {panels.inventory ? (
                <DashboardPanel
                  {...panels.inventory}
                  items={panels.inventory.items.map((item) => ({
                    ...item,
                    value: item.total,
                    meta: item.meta?.join(" · "),
                  }))}
                  onItemClick={onTabChange}
                  emptyTitle={panels.inventory.emptyState?.title}
                />
              ) : null}
              {panels.workload ? (
                <DashboardPanel
                  {...panels.workload}
                  onItemClick={onTabChange}
                  emptyTitle={panels.workload.emptyState?.title}
                />
              ) : null}
              {rail.platform ? (
                <DashboardPanel {...rail.platform} items={rail.platform.rows} variant="tiles" />
              ) : null}
              {rail.quickActions?.items.length ? (
                <DashboardPanel
                  {...rail.quickActions}
                  variant="actions"
                  onItemClick={onTabChange}
                />
              ) : null}
            </div>
          ) : null}
          {activity || rail.overview ? (
            <div className="admin-overview__activity-grid">
              {activity ? (
                <div className="admin-overview__activity-stack">
                  <DashboardPanel
                    {...activity}
                    variant="feed"
                    action={activity.viewAll}
                    emptyTitle={activity.emptyState?.title}
                    onItemClick={onTabChange}
                    items={activity.items.map((item) => ({
                      ...item,
                      label: item.title,
                      meta: [
                        ...(item.meta || []),
                        item.occurredAt ? formatTimestamp(item.occurredAt) : "",
                      ]
                        .filter(Boolean)
                        .join(" · "),
                    }))}
                  />
                  {activity.pagination && activity.items.length ? (
                    <Pagination {...activity.pagination} />
                  ) : null}
                </div>
              ) : null}
              {rail.overview ? (
                <OverviewRail
                  {...rail.overview}
                  className="admin-overview__overview-rail"
                  onAction={onTabChange}
                />
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
  </>;
}
