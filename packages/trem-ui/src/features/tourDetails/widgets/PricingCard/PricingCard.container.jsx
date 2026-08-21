import React, { useMemo } from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { getCityDisplay, getPriceText } from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import PricingCardView from "./PricingCard.view";

export default function PricingCardContainer({ tourRef, tour: fallbackTour, onBook, onContact, onShare, isFavorited, onFavorite, selectedFlight, onSelectFlight, selectedActivities, onSelectActivity, selectedDeparture, onSelectDeparture }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "pricing-card.json");
    const labels = widgetData?.elements?.labels || {};
    const config = widgetData?.structure?.widgets?.[0]?.props?.config || {};
    const tour = widgetData?.data?.tour || fallbackTour || null;
    const cityDisplay = useMemo(() => getCityDisplay(tour), [tour]);
    const priceText = useMemo(() => getPriceText(tour), [tour]);

    if (loading && !tour) return <WidgetSkeleton />;
    if (error && !tour) return <WidgetError message={error} />;

    return (
        <PricingCardView
            labels={labels}
            showBookNow={config.showBookNow === true}
            tour={tour}
            priceText={priceText}
            cityDisplay={cityDisplay}
            onBook={onBook}
            onContact={onContact}
            onShare={onShare}
            isFavorited={isFavorited}
            onFavorite={onFavorite}
            selectedFlight={selectedFlight}
            onSelectFlight={onSelectFlight}
            selectedActivities={selectedActivities}
            onSelectActivity={onSelectActivity}
            selectedDeparture={selectedDeparture}
            onSelectDeparture={onSelectDeparture}
        />
    );
}
