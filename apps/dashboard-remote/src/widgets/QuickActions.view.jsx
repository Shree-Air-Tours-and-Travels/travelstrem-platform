import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

export default function QuickActionsView({ widget, data, labels, onTabChange }) {
  return <DashboardPanel
    title={labels?.[widget.props?.titleRef] || "Quick actions"}
    description={labels?.[widget.props?.descriptionRef]}
    icon="sparkles"
    variant="actions"
    items={(data.actions || []).map((action) => ({
      id: action.id,
      label: action.label || labels?.[action.labelRef] || action.id,
      description: action.description || labels?.[action.descriptionRef],
      icon: action.icon,
      target: action.target,
    }))}
    onItemClick={onTabChange}
    emptyTitle="No actions available"
  />;
}
