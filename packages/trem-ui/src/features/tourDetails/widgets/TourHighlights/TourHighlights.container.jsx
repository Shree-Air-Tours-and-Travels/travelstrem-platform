import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import TourHighlightsView from "./TourHighlights.view";

export default function TourHighlightsContainer({ tourRef }) {
  const { loading, error, widgetData, retry } = useTourDetailWidget(tourRef, "tour-highlights.json");
  const labels = widgetData?.elements?.labels || {};
  const highlights = Array.isArray(widgetData?.data?.highlights) ? widgetData.data.highlights : [];

  if (loading) return <WidgetSkeleton compact />;
  if (error) return <WidgetError message={error} retry={retry} />;
  return <TourHighlightsView labels={labels} highlights={highlights} />;
}
