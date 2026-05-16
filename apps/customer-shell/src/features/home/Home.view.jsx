import React from "react";
import "./Home.styles.scss";
import WidgetRenderer from "../../widgets/WidgetRenderer";

export default function HomeView({ widgets }) {
    return (
        <div className="ui-home">
            <WidgetRenderer widgets={widgets} />
        </div>
    );
}
