import React from "react";
import "./Home.styles.scss";
import WidgetRenderer from "../../widgets/WidgetRenderer";
import { SmoothScroll } from "@packages/trem-ui";

export default function HomeView({ widgets }) {
    return (
        <div className="ui-home">
            <SmoothScroll variant="fadeIn" threshold={0.05}>
                <WidgetRenderer widgets={widgets} />
            </SmoothScroll>
        </div>
    );
}
