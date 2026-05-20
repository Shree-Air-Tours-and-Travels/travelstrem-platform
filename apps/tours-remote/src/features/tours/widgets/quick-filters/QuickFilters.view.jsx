import React from "react";
import { Button } from "@packages/trem-ui";

export default function QuickFiltersView({ filters, labels, activeId, onFilterClick }) {
    if (!filters.length) return null;

    return (
        <div className="tours-page__quick-filters">
            {filters.map((f) => (
                <Button
                    key={f.id}
                    primaryClassName={`tours-page__quick-filter${activeId === f.id ? " tours-page__quick-filter--active" : ""}`}
                    type="button"
                    onClick={() => onFilterClick(f.id)}
                    aria-pressed={activeId === f.id}
                    variant="outline"
                    text={f.labelRef ? (labels[f.labelRef] || f.id) : (f.label || f.id)}
                />
            ))}
        </div>
    );
}
