import React from "react";
import "../../styles/pages/home.scss";
import WidgetRenderer from "../../widgets/WidgetRenderer";
import { usePortalConfig } from "../../components/portal/PortalConfigContext";

const fallbackWidgets = [
    { type: "heroBanner", source: "shell" },
    { type: "services", source: "shell" },
    { type: "featuredTours", source: "toursTREM" },
];

const Home = () => {
    const { pageConfig } = usePortalConfig();
    const widgets = Array.isArray(pageConfig?.widgets) && pageConfig.widgets.length ? pageConfig.widgets : fallbackWidgets;
    return (
        <div className="ui-home">
            <WidgetRenderer widgets={widgets} />
        </div>
    );
};

export default Home;
