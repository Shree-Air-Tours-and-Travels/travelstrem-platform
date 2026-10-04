import React from "react";
import { Link } from "react-router-dom";
import { QuickChips } from "@packages/trem-ui";

export default function QuickFiltersView({
  title,
  filters,
  labels,
  activeIds,
  onFilterClick,
  customTourPrompt,
  customTourAction,
  customTourPath,
}) {
  if (!filters.length) return null;

  return (
    <div className="tours-page__quick-filters-wrapper">
      {title && <div className="tours-page__quick-filters-title">{title}</div>}
      <QuickChips
        filters={filters}
        labels={labels}
        activeIds={activeIds}
        onClick={onFilterClick}
        className="tours-page__quick-filters"
      />
      {customTourPrompt && customTourAction && customTourPath ? (
        <p className="tours-page__custom-tour-link">
          <span>{customTourPrompt}</span> <Link to={customTourPath}>{customTourAction}</Link>
        </p>
      ) : null}
    </div>
  );
}
