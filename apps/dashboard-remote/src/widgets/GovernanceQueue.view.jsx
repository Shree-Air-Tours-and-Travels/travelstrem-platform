import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

export default function GovernanceQueueView({ widget, data, labels, onTabChange }) {
  return <DashboardPanel
    title={labels?.[widget.props?.titleRef] || "Governance queue"}
    description={labels?.[widget.props?.descriptionRef]}
    icon="shieldCheck"
    items={(data.governance || []).map((item) => ({ id: item.id, label: item.label, icon: item.icon, value: item.value, target: item.target }))}
    onItemClick={onTabChange}
    emptyTitle="No records need review"
  />;
}
