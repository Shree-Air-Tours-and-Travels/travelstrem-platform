import React from "react";
import { Icon } from "@packages/trem-ui";
import { getLabel, getWidgetProps, getToneClass, getMetricIcon } from "./_helpers";

export default function DashboardMetrics({ widget, labels, bookingState }) {
    const items = getWidgetProps(widget).items || [];
    const metrics = bookingState?.metrics;
    const metricItems = metrics ? items.map((item) => {
        if (item.id === "bookings") return { ...item, value: metrics.totalBookings };
        if (item.id === "transactions") return { ...item, value: metrics.totalTransactions };
        if (item.id === "average") return { ...item, value: metrics.averageValue };
        return item;
    }) : items;
    return (
        <section className="dashboard-metrics" aria-label="Dashboard metrics">
            {metricItems.map((item) => (
                    <article className={`dashboard-metric${getToneClass(item.tone)}`} key={item.id}>
                        <span className="dashboard-metric__icon"><Icon name={getMetricIcon(item.icon || item.id)} size={26} aria-hidden="true" /></span>
                        <div>
                            <strong>{item.value}</strong>
                            <span>{getLabel(labels, item.labelRef, item.label)}</span>
                        </div>
                    </article>
            ))}
        </section>
    );
}
