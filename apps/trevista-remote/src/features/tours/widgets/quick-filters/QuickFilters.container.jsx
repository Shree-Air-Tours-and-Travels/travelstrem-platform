import React, { useCallback, useState } from "react";
import QuickFiltersView from "./QuickFilters.view";

export default function QuickFiltersContainer({ widgetData, onQuickFilter }) {
    const filters = widgetData?.data?.filters || widgetData?.structure?.widgets?.[0]?.props?.filters || [];
    const labels = widgetData?.elements?.labels || {};
    const props = widgetData?.structure?.widgets?.[0]?.props || {};
    const title = props.titleRef ? labels[props.titleRef] : null;
    const [activeId, setActiveId] = useState("all");

    const handleClick = useCallback((id) => {
        setActiveId(id);
        onQuickFilter?.(id);
    }, [onQuickFilter]);

    return <QuickFiltersView title={title} filters={filters} labels={labels} activeId={activeId} onFilterClick={handleClick} />;
}
