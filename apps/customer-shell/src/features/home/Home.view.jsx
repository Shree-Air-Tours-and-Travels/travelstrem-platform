import React from "react";
import "./Home.styles.scss";
import WidgetRenderer from "../../widgets/WidgetRenderer";
import { SmoothScroll, PortalPreloader } from "@packages/trem-ui";

const HomePreloader = () => (
    <div className="ui-home">
        <PortalPreloader type="hero" />
    </div>
);

const HomeError = ({ error }) => (
    <div className="ui-home">
        <div className="ui-home__error">{error}</div>
    </div>
);

export default function HomeView({ loading, error, widgets }) {
    if (loading) return <HomePreloader />;
    if (error) return <HomeError error={error} />;

    return (
        <div className="ui-home">
            <SmoothScroll variant="fadeIn" threshold={0.05}>
                <WidgetRenderer widgets={widgets} />
            </SmoothScroll>
        </div>
    );
}
