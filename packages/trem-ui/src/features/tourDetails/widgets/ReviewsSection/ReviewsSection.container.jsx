import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import ReviewsSectionView from "./ReviewsSection.view";

export default function ReviewsSectionContainer({ tourRef }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "reviews-section.json");
    const labels = widgetData?.elements?.labels || {};
    const reviews = Array.isArray(widgetData?.data?.reviews) ? widgetData.data.reviews : [];
    const avgRating = Number(widgetData?.data?.avgRating) || 0;
    const reviewCount = Number(widgetData?.data?.reviewCount) || reviews.length;

    if (loading) return <WidgetSkeleton compact />;
    if (error) return <WidgetError message={error} />;
    return <ReviewsSectionView
        labels={labels}
        reviews={reviews}
        avgRating={avgRating}
        reviewCount={reviewCount}
    />;
}
