import React from "react";
import { Button } from "@packages/trem-ui";
import { getLabel, getWidgetProps, statusClass } from "./_helpers";
import Panel from "./Panel";

export default function RecentBookings({ widget, labels }) {
    const props = getWidgetProps(widget);
    return (
        <Panel className="dashboard-recent-bookings" title={getLabel(labels, props.titleRef, "Recent Booking")} action={<Button variant="text" text="Plane" />}>
            <div className="dashboard-list">
                {(props.items || []).map((item) => (
                    <article className="dashboard-list-row" key={item.id}>
                        <img src={item.image} alt="" />
                        <div>
                            <strong>{item.name}</strong>
                            <span>{item.type}</span>
                            <small>Date : {item.date} <i /> Time : {item.time}</small>
                        </div>
                        <b className={statusClass(item.status)}>{item.status}</b>
                    </article>
                ))}
            </div>
        </Panel>
    );
}
