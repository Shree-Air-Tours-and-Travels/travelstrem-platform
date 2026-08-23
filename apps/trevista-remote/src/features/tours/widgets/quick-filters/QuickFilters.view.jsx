import React from "react";
import { QuickChips } from "@packages/trem-ui";

export default function QuickFiltersView({ title, filters, labels, activeId, onFilterClick }) {
    if (!filters.length) return null;

    return (
        <div className="tours-page__quick-filters-wrapper">
            {title && <div className="tours-page__quick-filters-title">{title}</div>}
            <QuickChips
                filters={filters}
                labels={labels}
                activeId={activeId}
                onClick={onFilterClick}
                className="tours-page__quick-filters"
            />
        </div>
    );
}
