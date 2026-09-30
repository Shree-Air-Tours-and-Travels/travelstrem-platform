import React, { useState } from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError } from "../../shared";
import Preloader from "../../../../components/Preloader/Preloader.jsx";
import IncludedStaysView from "./IncludedStays.view";

export default function IncludedStaysContainer({
  tourRef,
  selectedPackage,
  onSelectPackage,
  hotelSelections = {},
  onSelectHotel,
  onCustomize,
  onRequestHotel,
  allowEnquiryCustomization = true,
}) {
  const { loading, error, widgetData, retry } = useTourDetailWidget(
    tourRef,
    "included-stays.json",
    {
      allPackages: true,
    },
  );
  const [previewPackage, setPreviewPackage] = useState("");
  const labels = widgetData?.elements?.labels || {};
  const data = widgetData?.data || {};
  const packageData = Array.isArray(data.packages)
    ? data.packages.find(
        (item) =>
          String(item.packageKey).toLowerCase() ===
          String(selectedPackage || previewPackage || data.selectedPackageKey || "").toLowerCase(),
      )
    : null;
  const stayData = Array.isArray(data.packages) && data.packages.length ? packageData : data;
  const stays = Array.isArray(stayData?.stays) ? stayData.stays : [];
  const hotelOptions = Array.isArray(stayData?.hotelOptions) ? stayData.hotelOptions : [];
  const customizable = widgetData?.data?.customizable === true;
  const selectedPackageName = packageData?.name || data.selectedPackageName || "";
  const selectPackage = (packageKey) => {
    setPreviewPackage(packageKey);
    onSelectPackage?.(packageKey);
  };

  if (loading)
    return (
      <section className="td-ist" aria-label={labels.title || "Hotels & stays"}>
        <h2>{labels.title || "Hotels & stays"}</h2>
        <Preloader
          variant="stack"
          count={3}
          label={labels.loading || "Loading hotels for all packages"}
        />
      </section>
    );
  if (error) return <WidgetError message={error} retry={retry} />;
  return (
    <IncludedStaysView
      key={`${tourRef}:${packageData?.packageKey || "default"}`}
      labels={labels}
      packages={data.packages || []}
      activePackageKey={packageData?.packageKey || ""}
      onSelectPackage={selectPackage}
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
