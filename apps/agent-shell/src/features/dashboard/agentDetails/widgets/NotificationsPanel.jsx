import React from "react";
import { Button, Icon, Paragraph } from "@packages/trem-ui";
import { getLabel, getWidgetProps, getToneClass } from "./_helpers";
import Panel from "./Panel";

export default function NotificationsPanel({ widget, labels }) {
    const props = getWidgetProps(widget);
    return (
        <Panel className="dashboard-notifications" title={getLabel(labels, props.titleRef, "Notifications")} action={<Button variant="text" text="All" />}>
            {(props.items || []).map((item) => {
                const title = getLabel(labels, item.titleRef, item.title);
                return (
                <article className={`dashboard-notification${getToneClass(item.tone)}`} key={item.titleRef || title}>
                    <span><Icon name="bell" aria-hidden="true" /></span>
                    <div>
                        <strong>{title}</strong>
                        <Paragraph text={item.body} />
                    </div>
                    <time>{item.time}</time>
                </article>
                );
            })}
        </Panel>
    );
}
