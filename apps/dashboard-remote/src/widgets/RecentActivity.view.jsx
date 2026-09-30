import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

const icons = { tour: "map", trip: "mountain", partner: "building2", enquiry: "messageCircle", support: "support" };
const dateLabel = (value) => value ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "";

export default function RecentActivityView({ widget, data, labels, onTabChange }) {
  return <DashboardPanel
    title={labels?.[widget.props?.titleRef] || "Recent activity"}
    description={labels?.[widget.props?.descriptionRef]}
    icon="clock"
    variant="feed"
    items={(data.recentActivity || []).map((item) => ({
      id: item.id, label: item.title, description: item.description, icon: icons[item.type] || "info",
      status: item.status, meta: dateLabel(item.occurredAt), target: item.target,
    }))}
    onItemClick={onTabChange}
    emptyTitle={labels?.[widget.props?.emptyTitleRef] || "No recent activity"}
  />;
}
