import React from "react";
import { usePortalConfig } from "../../app/providers/PortalProvider";
import HomeView from "./Home.view";

const fallbackWidgets = [
    { type: "heroBanner", source: "shell" },
    { type: "services", source: "shell" },
    { type: "featuredTours", source: "shell" },
];

const HomeContainer = () => {
    const { pageConfig } = usePortalConfig();
    const widgets = Array.isArray(pageConfig?.widgets) && pageConfig.widgets.length ? pageConfig.widgets : fallbackWidgets;
    return <HomeView widgets={widgets} />;
};

export default HomeContainer;
