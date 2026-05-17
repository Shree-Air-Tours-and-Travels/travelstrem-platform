import React from "react";

export default function QuickFiltersView({ filters, labels, activeId, onFilterClick }) {
    if (!filters.length) return null;

    return (
        <div className="tours-page__quick-filters">
            {filters.map((f) => (
                <button
                    key={f.id}
                    className={`tours-page__quick-filter${activeId === f.id ? " tours-page__quick-filter--active" : ""}`}
                    type="button"
                    onClick={() => onFilterClick(f.id)}
                    aria-pressed={activeId === f.id}
                >
                    {f.labelRef ? (labels[f.labelRef] || f.id) : (f.label || f.id)}
                </button>
            ))}
        </div>
    );
}
