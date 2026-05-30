import React from "react";
import { getLabel, getWidgetProps } from "./_helpers";

export default function ServiceShortcuts({ widget, labels }) {
    const items = getWidgetProps(widget).items || [];
    return (
        <section className="dashboard-services" aria-label="Travel services">
            {items.map((item) => (
                <article className="dashboard-service-card" key={item.id}>
                    <img src={item.image} alt="" />
                    <strong>{item.count} {getLabel(labels, item.labelRef, item.label)}</strong>
                    <span>{item.cta}</span>
                </article>
            ))}
        </section>
    );
}
