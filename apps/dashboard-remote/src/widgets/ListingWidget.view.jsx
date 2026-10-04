import React from "react";
import { ListingWidget } from "../DashboardWidgets";
import { widgetsFromTourAnalytics } from "../dashboardWidgetAdapters";

export default function ListingWidgetView({ data, onTabChange }) {
  const props = widgetsFromTourAnalytics(data.tourAnalytics, { target: "services" }).listingWidget;
  return <ListingWidget {...props} onRowClick={(target) => onTabChange?.(target)} />;
}
