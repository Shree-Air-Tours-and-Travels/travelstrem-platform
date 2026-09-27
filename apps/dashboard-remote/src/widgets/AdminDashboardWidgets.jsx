import "../views/shared/DashboardLayout.scss";
import React from "react";
import MetricsContainer from "./Metrics.container";
import ProgressContainer from "./ProgressWidget.container";
import ListingContainer from "./ListingWidget.container";
import InfoContainer from "./InfoWidget.container";
import ProductHealthContainer from "./ProductHealth.container";
import GovernanceQueueContainer from "./GovernanceQueue.container";
import PlatformReachContainer from "./PlatformReach.container";
import QuickActionsContainer from "./QuickActions.container";
import RecentActivityContainer from "./RecentActivity.container";
import UpcomingDeparturesContainer from "./UpcomingDepartures.container";
import SystemStatusContainer from "./SystemStatus.container";

import RevenueSnapshotContainer from "./RevenueSnapshot.container";
import ResponsePerformanceContainer from "./ResponsePerformance.container";

const components = {
  RevenueSnapshot: RevenueSnapshotContainer,
  ResponsePerformance: ResponsePerformanceContainer,
  AdminMetrics: MetricsContainer,
  ProgressWidget: ProgressContainer,
  ListingWidget: ListingContainer,
  InfoWidget: InfoContainer,
  InventoryHealth: ProductHealthContainer,
  GovernanceQueue: GovernanceQueueContainer,
  PlatformReach: PlatformReachContainer,
  QuickActions: QuickActionsContainer,
  RecentActivity: RecentActivityContainer,
  UpcomingDepartures: UpcomingDeparturesContainer,
  SystemStatus: SystemStatusContainer,
};

export default function AdminDashboardWidgets({ definition, fetchWidgetData, onTabChange }) {
  const widgets = (definition?.structure?.widgets || []).filter((widget) =>
    components[widget.type] && widget.props?.endpoint && widget.props?.hidden !== true
  );
  const labels = definition?.elements?.labels || {};
  const render = (widget) => {
    const Container = components[widget.type];
    return Container ? <Container
      key={widget.type}
      widget={widget}
      labels={labels}
      fetchWidgetData={fetchWidgetData}
      refreshKey={definition}
      onTabChange={onTabChange}
    /> : null;
  };
  const metrics = widgets.filter((widget) => widget.type === "AdminMetrics");
  const analytics = widgets.filter((widget) => widget.props?.group === "analytics");
  const operations = widgets.filter((widget) => widget.props?.group === "operations");
  const snapshots = widgets.filter((widget) => widget.props?.group === "snapshots");
  const activity = widgets.filter((widget) => widget.props?.group === "activity");
  const primaryActivity = activity.find((widget) => widget.props?.slot === "primary") || activity[0];
  const secondaryActivity = activity.filter((widget) => widget !== primaryActivity);
  return <>
    {metrics.map(render)}
    {analytics.length ? <div className="admin-overview__widget-grid">{analytics.map(render)}</div> : null}
    {operations.length ? <div className="admin-overview__operations-grid">{operations.map(render)}</div> : null}
    {snapshots.length ? <div className="admin-overview__activity-grid admin-overview__snapshots">{snapshots.map(render)}</div> : null}
    {activity.length ? <div className="admin-overview__activity-grid">
      {primaryActivity ? render(primaryActivity) : null}
      {secondaryActivity.length ? <div className="admin-overview__activity-stack">{secondaryActivity.map(render)}</div> : null}
    </div> : null}
  </>;
}
