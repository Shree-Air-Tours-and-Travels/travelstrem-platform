import React from "react";
import { Button, Icon } from "@packages/trem-ui";
import { getLabel, getWidgetProps, getToneClass } from "./_helpers";

export default function DashboardAlert({ widget, labels }) {
    const props = getWidgetProps(widget);
    return (
        <div className={`dashboard-alert${getToneClass(props.tone)}`}>
            <Icon name="alertTriangle" aria-hidden="true" />
            <span>{getLabel(labels, props.messageRef, props.message)}</span>
            <Button variant="text" text="×" aria-label="Dismiss alert" />
        </div>
    );
}
