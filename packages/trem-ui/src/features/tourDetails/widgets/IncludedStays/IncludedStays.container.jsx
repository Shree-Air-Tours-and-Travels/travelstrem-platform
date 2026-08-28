import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import IncludedStaysView from "./IncludedStays.view";
import { getPackageDisplayName } from "../../helper";

export default function IncludedStaysContainer({
  tourRef,
  selectedPackage,
  hotelSelections = {},
  onSelectHotel,
  onCustomize,
  onRequestHotel,
  allowEnquiryCustomization = true,
}) {
  const { loading, error, widgetData, retry } = useTourDetailWidget(tourRef, "included-stays.json", {
    packageKey: selectedPackage,
  });
  const labels = widgetData?.elements?.labels || {};
  const stays = Array.isArray(widgetData?.data?.stays) ? widgetData.data.stays : [];
  const hotelOptions = Array.isArray(widgetData?.data?.hotelOptions)
    ? widgetData.data.hotelOptions
    : [];
  const customizable = widgetData?.data?.customizable === true;
  const selectedPackageData = widgetData?.data?.tour?.commercialPricing?.packages?.find(
    (item) => String(item.packageKey || item.tier) === String(selectedPackage || ""),
  );
  const rawSelectedPackageName = widgetData?.data?.selectedPackageName || "";
  const selectedPackageName = selectedPackageData
    ? getPackageDisplayName(selectedPackageData)
    : rawSelectedPackageName
      ? getPackageDisplayName({ tier: rawSelectedPackageName, name: rawSelectedPackageName })
      : "";

  if (loading) return <WidgetSkeleton compact />;
  if (error) return <WidgetError message={error} retry={retry} />;
  if (!stays.length && !hotelOptions.length) return null;
  return (
    <IncludedStaysView
      labels={labels}
      stays={stays}
      hotelOptions={allowEnquiryCustomization ? hotelOptions : []}
      selectedPackageName={selectedPackageName}
      hotelSelections={hotelSelections}
      onSelectHotel={allowEnquiryCustomization ? onSelectHotel : undefined}
      onCustomize={allowEnquiryCustomization && customizable ? onCustomize : undefined}
      onRequestHotel={allowEnquiryCustomization ? onRequestHotel : undefined}
    />
  );
}
