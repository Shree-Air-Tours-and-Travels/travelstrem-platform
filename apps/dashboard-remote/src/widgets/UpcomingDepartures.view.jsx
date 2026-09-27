import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

const dateLabel = (value) => value ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "";

export default function UpcomingDeparturesView({ widget, data, labels = {}, onTabChange }) {
  return <DashboardPanel
    title={labels[widget.props?.titleRef] || "Upcoming departures"}
    description={labels[widget.props?.descriptionRef]}
    icon="flight"
    variant="feed"
    items={(data.upcomingDepartures || []).map((item) => ({
      id: item.id, label: item.title, description: item.type === "tour" ? "Tour" : "Trip",
      icon: item.icon, meta: dateLabel(item.departureAt), target: item.target,
    }))}
    onItemClick={onTabChange}
    emptyTitle="No scheduled departures"
  />;
}
