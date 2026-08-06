import React, { useEffect, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import HeroBannerView from "./HeroBanner.view";

export default function HeroBannerContainer({ widgetData, pageTitle, onExplore, onSearch }) {
    const [destinationOptions, setDestinationOptions] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetchData("/tour-filters.json?pageKey=tours-remote/listing");
                const options = res?.component?.dataScope?.options?.destinationCityOptions || [];
                if (!cancelled && Array.isArray(options)) setDestinationOptions(options);
            } catch (err) {
                if (!cancelled) setDestinationOptions([]);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const labels = widgetData?.elements?.labels || {};
    return (
        <HeroBannerView
            labels={labels}
            pageTitle={pageTitle}
            destinationOptions={destinationOptions}
            onExplore={onExplore}
            onSearch={onSearch}
        />
    );
}
