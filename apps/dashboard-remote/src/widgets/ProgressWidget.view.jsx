import React from "react";
import { ProgressWidget } from "../DashboardWidgets";
import { widgetsFromTourAnalytics } from "../dashboardWidgetAdapters";

export default function ProgressWidgetView({ widget, data, labels = {} }) {
  const props = widgetsFromTourAnalytics(data.tourAnalytics, {
    ...widget.props,
    title: labels[widget.props?.titleRef],
    description: labels[widget.props?.descriptionRef],
  }).progressWidget;
  return <ProgressWidget {...props} />;
}
