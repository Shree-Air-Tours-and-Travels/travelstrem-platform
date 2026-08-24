import React, { useMemo } from "react";
import { Button, EmptyState, Icon, MetricSummary, StatusBadge } from "@packages/trem-ui";
import "./AdminOverviewView.scss";

const labelFor = (labels, ref, fallback = "") => labels?.[ref] || fallback;
const timeOfDay = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
};
const formatTime = (value) => {
  const parsed = new Date(value || 0);
  return Number.isNaN(parsed.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed);
};

function PanelHeader({ title, description }) {
  return (
    <header className="admin-overview__panel-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  );
}

export default function AdminOverviewView({
  user,
  definition,
  loading,
  error,
  onRefresh,
  onTabChange,
  isMasterAdmin,
}) {
  const labels = useMemo(() => definition?.elements?.labels || {}, [definition]);
  const structure = definition?.structure || {};
  const data = definition?.data || {};
  const widgets = structure.widgets || [];
  const widget = (type) => widgets.find((item) => item.type === type)?.props || {};
  const metricDefinition = widget("AdminMetrics");
  const metrics = useMemo(
    () =>
      (metricDefinition.items || []).map((item) => ({
        id: item.id,
        label: labelFor(labels, item.labelRef, item.id),
        value: data.metrics?.[item.metric] ?? 0,
        icon: item.icon,
        trailingIcon: "chevronRight",
        onClick: () => onTabChange?.(item.target),
      })),
    [data.metrics, labels, metricDefinition.items, onTabChange],
  );

  if (loading && !definition)
    return (
      <div className="admin-overview admin-overview--loading" aria-label="Loading dashboard">
        <div className="admin-overview__skeleton is-hero" />
        <div className="admin-overview__skeleton-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="admin-overview__skeleton" key={index} />
          ))}
        </div>
        <div className="admin-overview__skeleton is-panel" />
      </div>
    );

  if (error && !definition)
    return (
      <EmptyState
        icon="alertTriangle"
        title="Administration dashboard unavailable"
        description={error}
        action={<Button text="Try again" iconLeft="refreshCw" onClick={onRefresh} />}
      />
    );

  const inventoryWidget = widget("InventoryHealth");
  const governanceWidget = widget("GovernanceQueue");
  const platformWidget = widget("PlatformReach");
  const recentWidget = widget("RecentActivity");
  const actionWidget = widget("QuickActions");
  const quickActions = (structure.actions || []).filter(
    (action) => !action.masterOnly || isMasterAdmin,
  );

  return (
    <div className="admin-overview">
      <section className="admin-overview__hero">
        <div className="admin-overview__hero-copy">
          <span>{labelFor(labels, "eyebrow")}</span>
          <h1>
            Good {timeOfDay()}, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p>{labelFor(labels, "dashboardDescription")}</p>
        </div>
        <Button
          text={labelFor(labels, "refresh")}
          variant="outline"
          iconLeft="refreshCw"
          onClick={onRefresh}
          disabled={loading}
        />
      </section>

      <MetricSummary
        className="admin-overview__metrics"
        variant="cards"
        ariaLabel={labelFor(labels, metricDefinition.ariaLabelRef, "Platform overview")}
        items={metrics}
      />

      <div className="admin-overview__primary-grid">
        <section className="admin-overview__panel">
          <PanelHeader
            title={labelFor(labels, inventoryWidget.titleRef)}
            description={labelFor(labels, inventoryWidget.descriptionRef)}
          />
          <div className="admin-overview__product-list">
            {(data[inventoryWidget.dataKey] || []).map((product) => (
              <button
                type="button"
                className="admin-overview__product"
                key={product.id}
                onClick={() => onTabChange?.(product.target)}
              >
                <span className="admin-overview__tile-icon">
                  <Icon name={product.icon} size={22} />
                </span>
                <span className="admin-overview__product-copy">
                  <strong>{product.label}</strong>
                  <small>
                    {product.published} {labelFor(labels, "published")} · {product.draft}{" "}
                    {labelFor(labels, "draft")} · {product.pending} {labelFor(labels, "pending")}
                  </small>
                </span>
                <span className="admin-overview__product-total">
                  <strong>{product.total}</strong>
                  <small>Total</small>
                </span>
                <Icon name="chevronRight" size={19} />
              </button>
            ))}
          </div>
        </section>

        <section className="admin-overview__panel">
          <PanelHeader
            title={labelFor(labels, governanceWidget.titleRef)}
            description={labelFor(labels, governanceWidget.descriptionRef)}
          />
          <div className="admin-overview__queue">
            {(data[governanceWidget.dataKey] || []).map((item) => (
              <button key={item.id} type="button" onClick={() => onTabChange?.(item.target)}>
                <span className="admin-overview__tile-icon">
                  <Icon name={item.icon} size={20} />
                </span>
                <strong>{item.label}</strong>
                <b className={item.value ? "has-work" : ""}>{item.value}</b>
                <Icon name="chevronRight" size={18} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-overview__secondary-grid">
        <section className="admin-overview__panel admin-overview__activity">
          <PanelHeader
            title={labelFor(labels, recentWidget.titleRef)}
            description={labelFor(labels, recentWidget.descriptionRef)}
          />
          {(data[recentWidget.dataKey] || []).length ? (
            <div className="admin-overview__activity-list">
              {data[recentWidget.dataKey].map((item) => (
                <button type="button" key={item.id} onClick={() => onTabChange?.(item.target)}>
                  <span className="admin-overview__tile-icon">
                    <Icon
                      name={
                        item.type === "partner"
                          ? "building2"
                          : item.type === "enquiry"
                            ? "messageCircle"
                            : item.type === "trip"
                              ? "mountain"
                              : "map"
                      }
                      size={19}
                    />
                  </span>
                  <span className="admin-overview__activity-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <span className="admin-overview__activity-meta">
                    <StatusBadge value={item.status} size="sm" />
                    <time>{formatTime(item.occurredAt)}</time>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="clock"
              title={labelFor(labels, recentWidget.emptyTitleRef)}
              description={labelFor(labels, recentWidget.emptyDescriptionRef)}
            />
          )}
        </section>

        <div className="admin-overview__rail">
          <section className="admin-overview__panel admin-overview__platform">
            <PanelHeader
              title={labelFor(labels, platformWidget.titleRef)}
              description={labelFor(labels, platformWidget.descriptionRef)}
            />
            <dl>
              {["activeProducts", "activePartners", "activeAgents", "activeMembers"].map((key) => (
                <div key={key}>
                  <dt>{labelFor(labels, key)}</dt>
                  <dd>{data[platformWidget.dataKey]?.[key] ?? 0}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="admin-overview__panel admin-overview__actions">
            <PanelHeader
              title={labelFor(labels, actionWidget.titleRef)}
              description={labelFor(labels, actionWidget.descriptionRef)}
            />
            <div>
              {quickActions.map((action) => (
                <button type="button" key={action.id} onClick={() => onTabChange?.(action.target)}>
                  <span className="admin-overview__tile-icon">
                    <Icon name={action.icon} size={20} />
                  </span>
                  <span>
                    <strong>{labelFor(labels, action.labelRef)}</strong>
                    <small>{labelFor(labels, action.descriptionRef)}</small>
                  </span>
                  <Icon name="arrowUpRight" size={17} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
