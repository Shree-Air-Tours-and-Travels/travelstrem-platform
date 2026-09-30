import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

const fields = [
  { id: "activeProducts", icon: "travelPackage" },
  { id: "activePartners", icon: "people" },
  { id: "activeAgents", icon: "shieldCheck" },
  { id: "activeMembers", icon: "people" },
];

export default function PlatformReachView({ widget, data, labels }) {
  return <DashboardPanel
    title={labels?.[widget.props?.titleRef] || "Platform reach"}
    description={labels?.[widget.props?.descriptionRef]}
    icon="globe"
    variant="tiles"
    items={fields.map((field) => ({ ...field, label: labels?.[field.id] || field.id, value: data.platform?.[field.id] ?? 0 }))}
  />;
}
