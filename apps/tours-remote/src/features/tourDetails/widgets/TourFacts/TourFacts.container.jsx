import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import TourFactsView from "./TourFacts.view";

export default function TourFactsContainer({ tourRef, tour }) {
    const { widgetData } = useTourDetailWidget(tourRef, "tour-facts.json");
    const labels = widgetData?.elements?.labels || {};
    return <TourFactsView tour={tour} labels={labels} />;
}

