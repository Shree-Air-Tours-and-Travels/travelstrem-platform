import React from "react";
import { InfoWidget } from "../DashboardWidgets";
import { widgetsFromTourAnalytics } from "../dashboardWidgetAdapters";

export default function InfoWidgetView({ data }) {
  return <InfoWidget {...widgetsFromTourAnalytics(data.tourAnalytics).infoWidget} />;
}
