import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import SimilarToursView from "./SimilarTours.view";

export default function SimilarToursContainer({ tourRef }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "similar-tours.json");
    const labels = widgetData?.elements?.labels || {};
    const tours = Array.isArray(widgetData?.data?.tours) ? widgetData.data.tours : [];

    if (loading) return <WidgetSkeleton compact />;
    if (error) return <WidgetError message={error} />;
    return <SimilarToursView labels={labels} tours={tours} />;
}

