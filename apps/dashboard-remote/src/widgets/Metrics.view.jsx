import React from "react";
import { MetricSummary } from "@packages/trem-ui";

export default function MetricsView({ widget, data, labels, onTabChange }) {
  const items = (widget.props?.items || []).map((item) => ({
    id: item.id,
    label: item.label || labels?.[item.labelRef] || item.id,
    value: data.metrics?.[item.metric] ?? 0,
    icon: item.icon,
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));
  return <MetricSummary className="admin-overview__metrics" variant="cards" ariaLabel={labels?.[widget.props?.ariaLabelRef] || "Dashboard summary"} items={items} />;
}
