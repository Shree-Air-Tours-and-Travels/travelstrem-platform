import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import ItineraryTimelineView from "./ItineraryTimeline.view";

export default function ItineraryTimelineContainer({ tourRef }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "itinerary-timeline.json");
    const labels = widgetData?.elements?.labels || {};
    const itinerary = Array.isArray(widgetData?.data?.itinerary) ? widgetData.data.itinerary : [];

    if (loading) return <WidgetSkeleton />;
    if (error) return <WidgetError message={error} />;
    return <ItineraryTimelineView labels={labels} itinerary={itinerary} />;
}

