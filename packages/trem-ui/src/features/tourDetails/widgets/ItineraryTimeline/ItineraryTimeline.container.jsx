import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import ItineraryTimelineView from "./ItineraryTimeline.view";
import "./ItineraryTimeline.styles.scss";

export default function ItineraryTimelineContainer({ tourRef }) {
  const { loading, error, widgetData, retry } = useTourDetailWidget(tourRef, "itinerary-timeline.json");
  const labels = widgetData?.elements?.labels || {};
  const itinerary = Array.isArray(widgetData?.data?.itinerary) ? widgetData.data.itinerary : [];
  const widgetProps = widgetData?.structure?.widgets?.[0]?.props || {};
  const initialExpandedDays = Math.max(0, Number(widgetProps.initialExpandedDays) || 0);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} retry={retry} />;
  return (
    <ItineraryTimelineView
      labels={labels}
      itinerary={itinerary}
      initialExpandedDays={initialExpandedDays}
    />
  );
}
