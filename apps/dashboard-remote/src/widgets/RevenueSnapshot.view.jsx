import React from "react";
import { MetricSnapshot } from "@packages/trem-ui";

export default function RevenueSnapshotView({ widget, data, labels = {} }) {
  const snapshot = data?.[widget?.props?.dataKey || "revenueSnapshot"];
  if (!snapshot?.items?.some((item) => item.value != null && item.value !== "")) return null;
  return <MetricSnapshot {...snapshot} title={labels[widget?.props?.titleRef] || snapshot.title} />;
}
