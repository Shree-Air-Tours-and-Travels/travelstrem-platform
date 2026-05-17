import React from "react";

export const Fact = ({ label, value }) => (
    <div className="tour-detail__fact">
        <span>{label}</span>
        <strong>{value || "-"}</strong>
    </div>
);

export const Section = ({ title, children, className = "" }) => {
    const slug = String(title).trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (
        <section className={`tour-detail__section ${className}`} aria-labelledby={slug}>
            <h2 id={slug}>{title}</h2>
            {children}
        </section>
    );
};

export const ListBlock = ({ items = [], empty = "Not specified" }) => {
    if (!Array.isArray(items) || !items.length) return <p className="tour-detail__muted">{empty}</p>;
    return (
        <ul className="tour-detail__check-list">
            {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    );
};

export const WidgetSkeleton = ({ compact = false }) => (
    <div className={`tour-detail__skeleton${compact ? " tour-detail__skeleton--compact" : ""}`} />
);

export const WidgetError = ({ message = "This section could not load." }) => (
    <p className="tour-detail__muted tour-detail__muted--error">{message}</p>
);

