import React from "react";
import { Button, Paragraph } from "@packages/trem-ui";
import { getLabel, getWidgetProps, getToneClass } from "./_helpers";
import Panel from "./Panel";

export default function BookingStatistics({ widget, labels }) {
    const props = getWidgetProps(widget);
    const segments = props.segments || [];
    return (
        <Panel className="dashboard-statistics" title={getLabel(labels, props.titleRef, "Booking Statistic")} action={<Button variant="text" text="January" />}>
            <span>{getLabel(labels, props.amountLabelRef, "Total Amount Spend")}</span>
            <strong>{props.amount}</strong>
            <div className="dashboard-rings" aria-hidden="true">
                {segments.map((segment, index) => (
                    <i
                        key={segment.labelRef || segment.label}
                        className={getToneClass(segment.tone)}
                        style={{
                            "--ring-size": `${132 - index * 18}px`,
                            "--ring-value": `${Math.max(8, Math.min(100, segment.value || 0))}%`,
                        }}
                    />
                ))}
            </div>
            <ul className="dashboard-statistics__legend">
                {segments.map((segment) => (
                    <li key={segment.labelRef || segment.label} className={getToneClass(segment.tone)}>
                        {getLabel(labels, segment.labelRef, segment.label)}
                    </li>
                ))}
            </ul>
            <Paragraph text={props.comparison} />
        </Panel>
    );
}
