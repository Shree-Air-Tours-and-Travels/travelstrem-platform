import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import IncludedStaysView from "./IncludedStays.view";

export default function IncludedStaysContainer({
  tourRef,
  selectedPackage,
  hotelSelections = {},
  onSelectHotel,
  onCustomize,
  onRequestHotel,
}) {
  const { loading, error, widgetData } = useTourDetailWidget(tourRef, "included-stays.json", {
    packageKey: selectedPackage,
  });
  const labels = widgetData?.elements?.labels || {};
  const stays = Array.isArray(widgetData?.data?.stays) ? widgetData.data.stays : [];
  const hotelOptions = Array.isArray(widgetData?.data?.hotelOptions)
    ? widgetData.data.hotelOptions
    : [];
  const customizable = widgetData?.data?.customizable === true;
  const selectedPackageName = widgetData?.data?.selectedPackageName || "";

  if (loading) return <WidgetSkeleton compact />;
  if (error) return <WidgetError message={error} />;
  if (!stays.length && !hotelOptions.length) return null;
  return (
    <IncludedStaysView
      labels={labels}
      stays={stays}
      hotelOptions={hotelOptions}
      selectedPackageName={selectedPackageName}
      hotelSelections={hotelSelections}
      onSelectHotel={onSelectHotel}
      onCustomize={customizable ? onCustomize : undefined}
      onRequestHotel={onRequestHotel}
    />
  );
}
