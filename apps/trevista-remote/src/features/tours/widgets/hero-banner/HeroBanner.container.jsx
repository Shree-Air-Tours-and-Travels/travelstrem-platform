import React from "react";
import HeroBannerView from "./HeroBanner.view";

export default function HeroBannerContainer({ widgetData, pageTitle }) {
    const labels = widgetData?.elements?.labels || {};
    return <HeroBannerView labels={labels} pageTitle={pageTitle} />;
}
