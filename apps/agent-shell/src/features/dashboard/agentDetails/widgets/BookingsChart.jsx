import React from "react";
import { getLabel, getWidgetProps } from "./_helpers";
import Panel from "./Panel";

export default function BookingsChart({ widget, labels }) {
    const props = getWidgetProps(widget);
    const bars = props.bars || [];
    return (
        <Panel className="dashboard-chart" title={getLabel(labels, props.titleRef, "Booking Chart")} action={<span>{getLabel(labels, props.chartLabelRef, "Booking Stats")}</span>}>
            <div className="dashboard-chart__summary">
                <strong>{props.amount}</strong>
                <b>{props.change}</b>
                <small>{props.period}</small>
            </div>
            <div className="dashboard-chart__bars">
                {bars.map((bar) => {
                    const label = getLabel(labels, bar.labelRef, bar.label);
                    return <i key={bar.labelRef || label} style={{ "--bar-height": `${bar.value || 0}%` }}><span>{label}</span></i>;
                })}
            </div>
        </Panel>
    );
}
