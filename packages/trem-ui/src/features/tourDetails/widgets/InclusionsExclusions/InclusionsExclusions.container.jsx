import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import InclusionsExclusionsView from "./InclusionsExclusions.view";

export default function InclusionsExclusionsContainer({ tourRef }) {
  const { loading, error, widgetData } = useTourDetailWidget(tourRef, "inclusions-exclusions.json");
  const labels = widgetData?.elements?.labels || {};
  const inclusions = Array.isArray(widgetData?.data?.inclusions) ? widgetData.data.inclusions : [];
  const exclusions = Array.isArray(widgetData?.data?.exclusions) ? widgetData.data.exclusions : [];
  const widgetProps = widgetData?.structure?.widgets?.[0]?.props || {};
  const config = {
    initialVisibleCount: Math.max(1, Number(widgetProps.initialVisibleCount) || 1),
    separateControlsBreakpoint: Math.max(0, Number(widgetProps.separateControlsBreakpoint) || 0),
  };

  if (loading) return <WidgetSkeleton compact />;
  if (error) return <WidgetError message={error} />;
  return (
    <InclusionsExclusionsView
      labels={labels}
      inclusions={inclusions}
      exclusions={exclusions}
      config={config}
    />
  );
}
