import React from "react";
import { useComponentData } from "@packages/trem-utils";
import HomeView from "./Home.view";

const fallbackWidgets = [
    { type: "heroBanner", source: "shell" },
    { type: "services", source: "shell" },
    { type: "featuredTours", source: "shell" },
];

const HomeContainer = () => {
    const { loading, error, resolvedView } = useComponentData(
        "/pages/customer-shell/home",
        { headers: {}, params: {} }
    );

    const widgets = resolvedView?.structure?.widgets || fallbackWidgets;

    return (
        <HomeView
            loading={loading}
            error={error}
            widgets={widgets}
        />
    );
};

export default HomeContainer;
