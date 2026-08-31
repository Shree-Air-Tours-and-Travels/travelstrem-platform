import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon, MetricSummary, NoDataFound, Pagination, StatusBadge, TourPerformance } from "@packages/trem-ui";
import {
  REALTIME_EVENTS,
  useEnquiryRealtime,
  useRealtimeEvent,
  useRealtimeStatus,
  useTourCatalogRealtime,
} from "@packages/trem-events";
import "./PartnerDashboard.scss";

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);
const formatActivityTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

function DashboardSkeleton() {
  return (
    <div className="partner-dashboard partner-dashboard--loading" aria-label="Loading dashboard">
      <div className="partner-dashboard__skeleton partner-dashboard__skeleton--hero" />
      <div className="partner-dashboard__skeleton-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="partner-dashboard__skeleton" key={item} />
        ))}
      </div>
      <div className="partner-dashboard__skeleton partner-dashboard__skeleton--body" />
    </div>
  );
}

export default function PartnerDashboard({
  data,
  loading,
  error,
  onRefresh,
  onActivityPageChange,
}) {
  const navigate = useNavigate();
  const { isConnected, isReconnecting } = useRealtimeStatus();
  const refreshFromRealtime = useCallback(() => onRefresh?.({ preserveData: true }), [onRefresh]);
  useEnquiryRealtime(refreshFromRealtime);
  useTourCatalogRealtime(refreshFromRealtime);
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, refreshFromRealtime);

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) {
    return (
      <section className="partner-dashboard__error" role="alert">
        <span><Icon name="alertTriangle" size={28} /></span>
        <div>
          <h1>Dashboard unavailable</h1>
          <p>{error}</p>
        </div>
        <Button text="Try again" iconLeft="refreshCw" onClick={onRefresh} />
      </section>
    );
  }
  if (!data?.schemaVersion) {
    return (
      <NoDataFound
        title="Dashboard data is unavailable"
        description="Refresh the workspace to load the latest agency operations."
        actionLabel="Refresh"
        onAction={onRefresh}
      />
    );
  }

  const open = (target) => target && navigate(target);

  return (
    <section className="partner-dashboard">
      {error ? (
        <div className="partner-dashboard__stale-notice" role="status">
          <Icon name="alertTriangle" size={18} />
          <span>{error} Showing the last available dashboard data.</span>
          <Button text="Retry" variant="text" onClick={onRefresh} />
        </div>
      ) : null}
      <header className="partner-dashboard__hero">
        <div className="partner-dashboard__hero-copy">
          <div className="partner-dashboard__eyebrow">
            <span><Icon name="building2" size={16} /></span>
            {data.hero?.eyebrow}
          </div>
          <h1>{data.hero?.title}</h1>
          <p>{data.hero?.description}</p>
          <div className="partner-dashboard__agency-meta">
            <strong>{data.agency?.name}</strong>
            <StatusBadge value={data.agency?.status || "active"} size="sm" />
            <span>{data.viewer?.roleLabel}</span>
          </div>
        </div>
        <div className="partner-dashboard__hero-actions">
          <span
            className={`partner-dashboard__live-status${isConnected ? " is-connected" : ""}`}
            title={isReconnecting ? "Realtime updates are reconnecting" : undefined}
          >
            <i aria-hidden="true" />
            {isConnected ? "Live updates" : isReconnecting ? "Reconnecting" : "Updates on refresh"}
          </span>
          <Button
            text={loading ? "Refreshing" : "Refresh"}
            iconLeft="refreshCw"
            variant="outline"
            disabled={loading}
            onClick={onRefresh}
          />
        </div>
      </header>

      <MetricSummary
        variant="cards"
        className="partner-dashboard__metric-summary"
        ariaLabel={data.kpiAriaLabel || "Operational summary"}
        items={(data.kpis || []).map((metric) => ({
          ...metric,
          value: formatNumber(metric.value),
          trailingIcon: metric.target ? "arrowUpRight" : "",
          onClick: metric.target ? () => open(metric.target) : undefined,
        }))}
      />

      <TourPerformance
        data={data.tourAnalytics}
        onTourClick={() => open("/agent/services/tours")}
      />

      <div className="partner-dashboard__primary-grid">
        <section className="partner-dashboard__panel partner-dashboard__workload">
          <header className="partner-dashboard__panel-heading">
            <div>
              <span>Today&apos;s focus</span>
              <h2>Operational workload</h2>
              <p>Items that need attention across your current scope.</p>
            </div>
          </header>
          <div className="partner-dashboard__workload-list">
            {(data.workload || []).map((item) => (
              <button type="button" key={item.id} onClick={() => open(item.target)}>
                <span className="partner-dashboard__row-icon"><Icon name={item.icon} size={18} /></span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <em>{formatNumber(item.value)}</em>
                <Icon name="chevronRight" size={18} />
              </button>
            ))}
          </div>
        </section>

        <section className="partner-dashboard__panel partner-dashboard__products">
          <header className="partner-dashboard__panel-heading">
            <div>
              <span>Inventory</span>
              <h2>Product overview</h2>
              <p>Publishing health across enabled TravelsTREM products.</p>
            </div>
          </header>
          <div className="partner-dashboard__product-list">
            {(data.products || []).map((product) => (
              <button type="button" key={product.key} onClick={() => open(product.target)}>
                <span className="partner-dashboard__product-icon"><Icon name={product.icon} size={22} /></span>
                <span className="partner-dashboard__product-copy">
                  <strong>{product.label}</strong>
                  <small>{product.description}</small>
                  <span className="partner-dashboard__product-stats">
                    <em><b>{formatNumber(product.published)}</b> Published</em>
                    <em><b>{formatNumber(product.draft)}</b> Drafts</em>
                    <em><b>{formatNumber(product.pending)}</b> Pending</em>
                    <em><b>{formatNumber(product.upcoming)}</b> Upcoming</em>
                  </span>
                </span>
                <span className="partner-dashboard__product-total">
                  <strong>{formatNumber(product.total)}</strong>
                  <small>Total</small>
                  <Icon name="chevronRight" size={18} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="partner-dashboard__secondary-grid">
        <section className="partner-dashboard__panel partner-dashboard__activity">
          <header className="partner-dashboard__panel-heading">
            <div>
              <span>Latest changes</span>
              <h2>Recent activity</h2>
              <p>Updates from products, enquiries and customer records.</p>
            </div>
          </header>
          {(data.recentActivity || []).length ? (
            <>
              <div className="partner-dashboard__activity-list">
                {data.recentActivity.map((item) => (
                  <button type="button" key={item.id} onClick={() => open(item.target)}>
                    <span className="partner-dashboard__row-icon"><Icon name={item.icon} size={17} /></span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="partner-dashboard__activity-meta">
                      <StatusBadge value={item.status} size="sm" />
                      <time dateTime={item.occurredAt}>{formatActivityTime(item.occurredAt)}</time>
                    </span>
                  </button>
                ))}
              </div>
              {data.recentActivityPagination?.totalPages > 1 ? (
                <footer className="partner-dashboard__activity-pagination">
                  <Pagination
                    currentPage={data.recentActivityPagination.page}
                    totalPages={data.recentActivityPagination.totalPages}
                    onPageChange={onActivityPageChange}
                    disabled={loading}
                    ariaLabel="Recent activity pages"
                  />
                </footer>
              ) : null}
            </>
          ) : (
            <NoDataFound
              title="No recent activity"
              description="Product, customer and enquiry updates will appear here."
            />
          )}
        </section>

        <aside className="partner-dashboard__panel partner-dashboard__quick-actions">
          <header className="partner-dashboard__panel-heading">
            <div>
              <span>Shortcuts</span>
              <h2>Quick actions</h2>
              <p>Jump directly to common partner workflows.</p>
            </div>
          </header>
          <div>
            {(data.quickActions || []).map((action) => (
              <button
                type="button"
                key={action.id}
                className={action.variant === "primary" ? "is-primary" : ""}
                onClick={() => open(action.target)}
              >
                <span><Icon name={action.icon} size={19} /></span>
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.description}</small>
                </span>
                <Icon name="arrowUpRight" size={17} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
