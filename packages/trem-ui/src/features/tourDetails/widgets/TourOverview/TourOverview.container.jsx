import React, { useEffect, useMemo } from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { getCityDisplay, getDisplayText, getDurationText, getRatingText } from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import TourOverviewView from "./TourOverview.view";

export default function TourOverviewContainer({ tourRef, onTourLoad }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "tour-overview.json");
    const tour = widgetData?.data?.tour || null;
    const labels = widgetData?.elements?.labels || {};

    useEffect(() => {
        if (tour) onTourLoad?.(tour);
    }, [onTourLoad, tour]);

    const viewModel = useMemo(() => ({
        labels,
        tour,
        cityDisplay: getCityDisplay(tour),
        title: getDisplayText(tour?.title, "Tour details"),
        description: getDisplayText(tour?.desc ?? tour?.description),
        durationText: getDurationText(tour),
        ratingText: getRatingText(tour),
        tags: Array.isArray(tour?.tags) ? tour.tags.map((tag) => getDisplayText(tag)).filter(Boolean) : [],
    }), [labels, tour]);

    if (loading && !tour) return <WidgetSkeleton />;
    if (error && !tour) return <WidgetError message={error} />;
    return <TourOverviewView {...viewModel} />;
}
