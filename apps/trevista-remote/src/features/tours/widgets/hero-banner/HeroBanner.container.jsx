import React from "react";
import HeroBannerView from "./HeroBanner.view";

export default function HeroBannerContainer({
  widgetData,
  pageTitle,
  onExplore,
  onSearch,
  onCustomise,
}) {
  const labels = widgetData?.elements?.labels || {};
  const options = widgetData?.dataScope?.options || {};
  return (
    <HeroBannerView
      labels={labels}
      pageTitle={pageTitle}
      searchOptions={options}
      onExplore={onExplore}
      onSearch={onSearch}
      onCustomise={onCustomise}
    />
  );
}
