import React, { useCallback, useState } from "react";
import { QuickChips } from "@packages/trem-ui";

export default function QuickFiltersContainer({ widgetData, onQuickFilter }) {
    const filters = widgetData?.data?.filters || widgetData?.structure?.widgets?.[0]?.props?.filters || [];
    const labels = widgetData?.elements?.labels || {};
    const [activeId, setActiveId] = useState("all");

    const handleClick = useCallback((id) => {
        setActiveId(id);
        onQuickFilter?.(id);
    }, [onQuickFilter]);

    return <QuickChips filters={filters} labels={labels} activeId={activeId} onClick={handleClick} className="tours-page__quick-filters" />;
}
