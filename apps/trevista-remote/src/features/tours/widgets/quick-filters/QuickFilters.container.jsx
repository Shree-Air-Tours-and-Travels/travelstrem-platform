import React, { useCallback, useMemo } from "react";
import QuickFiltersView from "./QuickFilters.view";

export default function QuickFiltersContainer({ widgetData, onQuickFilter, activeIds = ["all"] }) {
  const filters = useMemo(
    () => widgetData?.data?.filters || widgetData?.structure?.widgets?.[0]?.props?.filters || [],
    [widgetData],
  );
  const labels = widgetData?.elements?.labels || {};
  const props = widgetData?.structure?.widgets?.[0]?.props || {};
  const title = props.titleRef ? labels[props.titleRef] : null;
  const handleClick = useCallback(
    (id) => {
      onQuickFilter?.(filters.find((filter) => filter.id === id));
    },
    [filters, onQuickFilter],
  );

  return (
    <QuickFiltersView
      title={title}
      filters={filters}
      labels={labels}
      activeIds={activeIds}
      onFilterClick={handleClick}
    />
  );
}
