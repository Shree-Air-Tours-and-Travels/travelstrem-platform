import React, { useRef, useState } from "react";
import "../tours.scss";
import QuickFilters from "../widgets/quick-filters/QuickFilters";
import Filters from "../widgets/filters/Filters";
import Listing from "../widgets/listing/Listing";
import { Breadcrumbs, FloatingActionBar, BottomSheet, Button, Icon } from "@packages/trem-ui";

const getLabel = (labels = {}, item = {}) => {
    if (item.labelRef && labels[item.labelRef]) return labels[item.labelRef];
    return item.label || item.id;
};

const BREADCRUMBS = [{ label: "Trevista", path: "/trevista" }, { label: "Tours" }];

export default function ToursPageView({
    pageLabels,
    widgets,
    widgetsData,
    pageTitle,
    totalResults,
    displayed,
    initialLoading,
    initialError,
    filteredTours,
    filterMeta,
    filterWidgetData,
    listingWidgetData,
    onView,
    isFavorited,
    onFavorite,
    sortId,
    onSortChange,
    currentPage,
    totalPages,
    loadingMore,
    handleFilterChange,
    onQuickFilter,
    onPageChange,
    filtersExpanded,
    onFiltersExpandedChange,
    initialValues,
}) {
    const listingLabels = widgetsData.listing?.elements?.labels || {};
    const listingProps = listingWidgetData?.structure?.widgets?.[0]?.props || {};
    const sortOptions = listingProps.sortOptions?.length ? listingProps.sortOptions : [];
    const sortLabel = listingLabels.sortBy || listingProps.sortLabel || "Sort by";

    const filterSidebarRef = useRef(null);
    const [sortSheetOpen, setSortSheetOpen] = useState(false);

    const scrollToFilters = () => {
        if (filterSidebarRef.current) {
            filterSidebarRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleOpenFilters = () => {
        scrollToFilters();
        if (!filtersExpanded && onFiltersExpandedChange) {
            onFiltersExpandedChange(true);
        }
    };

    const handleSortSelect = (optionId) => {
        onSortChange?.(optionId);
        setSortSheetOpen(false);
    };

    const selectedSort = sortOptions.find((option) => option.id === sortId) || sortOptions[0] || { id: sortId, label: sortId };

    const fabActions = [
        {
            label: "Filters",
            iconLeft: "filter",
            variant: "outline",
            onClick: handleOpenFilters,
        },
        {
            label: getLabel(listingLabels, selectedSort),
            iconLeft: "arrowUpDown",
            variant: "outline",
            onClick: () => setSortSheetOpen(true),
        },
    ];

    return (
        <main className="tours-page">
            <div className="tours-page__inner">
                <div className="tours-page__crumbs">
                    <Breadcrumbs items={BREADCRUMBS} />
                </div>
                {widgets.map((w) => {
                    if (w.type === "quickChips") {
                        return <QuickFilters key={w.type} widgetData={widgetsData.quickChips} onQuickFilter={onQuickFilter} />;
                    }
                    if (w.type === "filters") {
                        return (
                            <div key={w.type} className="tours-page__body" ref={filterSidebarRef}>
                                <aside className="tours-page__sidebar">
                                    <div className="tours-page__sidebar-inner">
                                        <Filters
                                            onChange={handleFilterChange}
                                            widgetData={filterWidgetData}
                                            sortId={sortId}
                                            pageSize={8}
                                            expanded={filtersExpanded}
                                            onExpandedChange={onFiltersExpandedChange}
                                            initialValues={initialValues}
                                        />
                                    </div>
                                </aside>
                                <section className="tours-page__listing" aria-label="Tours listing">
                                    <Listing
                                        initialLoading={initialLoading}
                                        initialError={initialError}
                                        displayed={displayed}
                                        totalResults={totalResults}
                                        listingLabels={listingLabels}
                                        listingWidgetData={listingWidgetData}
                                        filteredTours={filteredTours}
                                        filterMeta={filterMeta}
                                        onView={onView}
                                        isFavorited={isFavorited}
                                        onFavorite={onFavorite}
                                        sortId={sortId}
                                        onSortChange={onSortChange}
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        loadingMore={loadingMore}
                                        onPageChange={onPageChange}
                                    />
                                </section>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>

            {sortOptions.length > 0 && (
                <BottomSheet open={sortSheetOpen} onClose={() => setSortSheetOpen(false)} title={sortLabel}>
                    <div className="tours-page__sort-sheet">
                        {sortOptions.map((option) => {
                            const isActive = option.id === sortId;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`tours-page__sort-sheet-item ${isActive ? "is-active" : ""}`}
                                    onClick={() => handleSortSelect(option.id)}
                                >
                                    <span>{getLabel(listingLabels, option)}</span>
                                    {isActive && <Icon name="check" />}
                                </button>
                            );
                        })}
                    </div>
                </BottomSheet>
            )}

            <FloatingActionBar
                actions={fabActions}
                variant="compact"
                align="center"
                gap="medium"
                showBg={true}
                sheetTitle="Sort by"
                hideOnDesktop
            />
        </main>
    );
}
