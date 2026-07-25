import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { getCityDisplay } from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import TourGalleryView from "./TourGallery.view";

export default function TourGalleryContainer({ tourRef, tour }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "tour-gallery.json");
    const labels = widgetData?.elements?.labels || {};
    const photos = (widgetData?.data?.photos || tour?.photos || []).filter(Boolean);

    if (loading && !photos.length) return <WidgetSkeleton />;
    if (error && !photos.length) return <WidgetError message={error} />;

    return (
        <TourGalleryView
            labels={labels}
            photos={photos}
            title={widgetData?.data?.title || tour?.title || "Tour photos"}
            cityDisplay={widgetData?.data?.cityDisplay || getCityDisplay(tour)}
        />
    );
}
