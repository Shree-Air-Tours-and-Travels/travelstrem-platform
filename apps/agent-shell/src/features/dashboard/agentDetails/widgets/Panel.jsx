import React from "react";
import { Title } from "@packages/trem-ui";

export default function Panel({ className = "", title, action, children }) {
    return (
        <section className={`dashboard-panel ${className}`.trim()}>
            {(title || action) && (
                <header className="dashboard-panel__header">
                    {title ? <Title text={title} /> : <span />}
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}
