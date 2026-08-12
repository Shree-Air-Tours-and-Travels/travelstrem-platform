import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import IncludedStaysView from "./IncludedStays.view";

export default function IncludedStaysContainer({ tourRef, selectedHotel, onSelectHotel }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "included-stays.json");
    const labels = widgetData?.elements?.labels || {};
    const stays = Array.isArray(widgetData?.data?.stays) ? widgetData.data.stays : [];
    const hotelOptions = Array.isArray(widgetData?.data?.hotelOptions) ? widgetData.data.hotelOptions : [];

    if (loading) return <WidgetSkeleton compact />;
    if (error) return <WidgetError message={error} />;
    if (!stays.length) return null;
    return <IncludedStaysView
        labels={labels}
        stays={stays}
        hotelOptions={hotelOptions}
        selectedHotel={selectedHotel}
        onSelectHotel={onSelectHotel}
    />;
}
