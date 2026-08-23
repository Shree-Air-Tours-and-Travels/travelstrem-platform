import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import TourFactsView from "./TourFacts.view";

export default function TourFactsContainer({ tourRef, tour }) {
  const { widgetData } = useTourDetailWidget(tourRef, "tour-facts.json");
  const labels = widgetData?.elements?.labels || {};
  // Use the widget's deliberately scoped response rather than the broader
  // detail-page tour object.
  return <TourFactsView tour={widgetData?.data?.tour || tour} labels={labels} />;
}
