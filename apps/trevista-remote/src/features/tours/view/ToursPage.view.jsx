import React, { useState } from "react";
import "../tours.scss";
import QuickFilters from "../widgets/quick-filters/QuickFilters";
import Filters from "../widgets/filters/Filters";
import Listing from "../widgets/listing/Listing";
import { Breadcrumbs, FloatingActionBar, BottomSheet, Icon } from "@packages/trem-ui";

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
  filterWidgetData,
  listingWidgetData,
  isAuthenticated,
  onView,
  isFavorited,
  onFavorite,
  sortId,
  onSortChange,
  onQueryChange,
  currentPage,
  totalPages,
  loadingMore,
  handleFilterChange,
  onQuickFilter,
  onPageChange,
  filtersExpanded,
  onFiltersExpandedChange,
  filterValues,
  facets,
  activeDiscoveryIds,
  discoveryOptions,
  activeFilterChips,
  onClearFilters,
  onEnquire,
}) {
  const listingLabels = widgetsData.listing?.elements?.labels || {};
  const listingProps = listingWidgetData?.structure?.widgets?.[0]?.props || {};
  const sortOptions = listingProps.sortOptions?.length ? listingProps.sortOptions : [];
  const sortLabel = listingLabels.sortBy || listingProps.sortLabel || "Sort by";

  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const handleOpenFilters = () => {
    setFiltersSheetOpen(true);
  };

  const handleSortSelect = (optionId) => {
    onSortChange?.(optionId);
    setSortSheetOpen(false);
  };

  const selectedSort = sortOptions.find((option) => option.id === sortId) ||
    sortOptions[0] || { id: sortId, label: sortId };

  const fabActions = [
    {
      label: "Filters",
      iconLeft: "filter",
      variant: "outline",
      onClick: handleOpenFilters,
    },
    ...(sortOptions.length > 0
      ? [
          {
            label: getLabel(listingLabels, selectedSort),
            iconLeft: "arrowUpDown",
            variant: "outline",
            onClick: () => setSortSheetOpen(true),
          },
        ]
      : []),
  ];

  return (
    <main className="tours-page">
      <div className="tours-page__crumbs">
        <Breadcrumbs items={BREADCRUMBS} />
      </div>
      <div className="tours-page__inner">
        {widgets.map((w) => {
          if (w.type === "quickChips") {
            return (
              <QuickFilters
                key={w.type}
                widgetData={widgetsData.quickChips}
                activeIds={activeDiscoveryIds}
                onQuickFilter={onQuickFilter}
              />
            );
          }
          if (w.type === "filters") {
            return (
              <React.Fragment key={w.type}>
                <div className="tours-page__body">
                  <aside className="tours-page__sidebar">
                    <div className="tours-page__sidebar-inner">
                      <Filters
                        onChange={handleFilterChange}
                        widgetData={filterWidgetData}
                        sortId={sortId}
                        pageSize={8}
                        expanded={filtersExpanded}
                        onExpandedChange={onFiltersExpandedChange}
                        values={filterValues}
                        facets={facets}
                        discoveryOptions={discoveryOptions}
                        totalResults={totalResults}
                        searching={loadingMore}
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
                      isAuthenticated={isAuthenticated}
                      onView={onView}
                      isFavorited={isFavorited}
                      onFavorite={onFavorite}
                      sortId={sortId}
                      onSortChange={onSortChange}
                      queryValue={filterValues.query || ""}
                      onQueryChange={onQueryChange}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      loadingMore={loadingMore}
                      onPageChange={onPageChange}
                      hasActiveFilters={activeFilterChips.length > 0}
                      onClearFilters={onClearFilters}
                      onEnquire={onEnquire}
                    />
                  </section>
                </div>
              </React.Fragment>
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

      <BottomSheet
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        title="Filter tours"
        className="tours-page__filters-sheet"
      >
        <Filters
          onChange={handleFilterChange}
          widgetData={filterWidgetData}
          sortId={sortId}
          pageSize={8}
          expanded
          onExpandedChange={(next) => {
            if (next === false) setFiltersSheetOpen(false);
          }}
          values={filterValues}
          facets={facets}
          discoveryOptions={discoveryOptions}
          totalResults={totalResults}
          searching={loadingMore}
          mode="modal"
        />
      </BottomSheet>

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
