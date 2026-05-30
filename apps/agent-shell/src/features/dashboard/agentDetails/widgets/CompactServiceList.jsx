import React from "react";
import { Button } from "@packages/trem-ui";
import { getLabel, getWidgetProps, statusClass } from "./_helpers";
import Panel from "./Panel";

export default function CompactServiceList({ widget, labels, type }) {
    const props = getWidgetProps(widget);
    return (
        <Panel className="dashboard-compact-list" title={getLabel(labels, props.titleRef, type)} action={<Button variant="text" text="All" />}>
            <div className="dashboard-list dashboard-list--compact">
                {(props.items || []).map((item) => (
                    <article className="dashboard-list-row" key={`${item.name}-${item.date}`}>
                        <img src={item.image} alt="" />
                        <div>
                            <strong>{item.name}</strong>
                            <span>{item.id ? <>{item.id} · </> : null}{item.date}</span>
                        </div>
                    {item.price || item.amount ? <b>{item.price || item.amount}</b> : <b className={statusClass(item.status)}>{item.status}</b>}
                    </article>
                ))}
            </div>
        </Panel>
    );
}
