import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

const uptimeLabel = (seconds) => {
  const hours = Math.floor((Number(seconds) || 0) / 3600);
  const minutes = Math.floor(((Number(seconds) || 0) % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function SystemStatusView({ widget, data, labels = {} }) {
  return <DashboardPanel
    title={labels[widget.props?.titleRef] || "System status"}
    description={labels[widget.props?.descriptionRef]}
    icon="support"
    variant="tiles"
    items={[
      { id: "api", icon: "clock", label: "API instance uptime", value: uptimeLabel(data.systemStatus?.apiUptimeSeconds) },
      { id: "database", icon: "shieldCheck", label: "Database", value: data.systemStatus?.databaseReady ? "Connected" : "Unavailable" },
    ]}
  />;
}
