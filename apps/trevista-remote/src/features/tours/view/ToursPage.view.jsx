import React, { useState } from "react";
import "../tours.scss";
import QuickFilters from "../widgets/quick-filters/QuickFilters";
import Filters from "../widgets/filters/Filters";
import Listing from "../widgets/listing/Listing";
import {
  Breadcrumbs,
  FloatingActionBar,
  BottomSheet,
  Button,
  Icon,
  InputField,
  SingleSelect,
} from "@packages/trem-ui";

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
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
    ) {
      setFiltersSheetOpen(true);
      return;
    }
    onFiltersExpandedChange?.(!filtersExpanded);
  };

  const handleSortSelect = (optionId) => {
    onSortChange?.(optionId);
    setSortSheetOpen(false);
  };

  const selectedSort = sortOptions.find((option) => option.id === sortId) ||
    sortOptions[0] || { id: sortId, label: sortId };
  const normalizedSortOptions = sortOptions.map((option) => ({
    value: option.id || option.value,
    label: getLabel(listingLabels, option),
    disabled: option.disabled,
  }));

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
                <section className="tours-page__discovery-toolbar" aria-label="Find tours">
                  <Button
                    type="button"
                    variant="outline"
                    color="primary"
                    iconLeft="filter"
                    text={`Filters${activeFilterChips.length ? ` (${activeFilterChips.length})` : ""}`}
                    onClick={handleOpenFilters}
                    primaryClassName="tours-page__filter-toggle"
                    aria-expanded={filtersExpanded || filtersSheetOpen}
                  />
                  <div className="tours-page__toolbar-search">
                    <Icon name="search" aria-hidden="true" />
                    <InputField
                      variant="text"
                      ariaLabel="Search tours"
                      placeholder="Search by tour, destination, or experience..."
                      value={filterValues.query || ""}
                      onChange={onQueryChange}
                      className="tours-page__toolbar-search-input"
                    />
                  </div>
                  {normalizedSortOptions.length ? (
                    <SingleSelect
                      label={sortLabel}
                      value={sortId}
                      options={normalizedSortOptions}
                      onChange={onSortChange}
                      size="sm"
                      className="tours-page__toolbar-sort"
                    />
                  ) : null}
                  <div className="tours-page__toolbar-results" aria-live="polite">
                    {loadingMore ? "Updating…" : `${totalResults} tours`}
                  </div>
                </section>

                {filtersExpanded ? (
                  <div className="tours-page__inline-filters">
                    <Filters
                      onChange={handleFilterChange}
                      widgetData={filterWidgetData}
                      sortId={sortId}
                      pageSize={8}
                      expanded
                      onExpandedChange={onFiltersExpandedChange}
                      values={filterValues}
                      facets={facets}
                      discoveryOptions={discoveryOptions}
                      totalResults={totalResults}
                      searching={loadingMore}
                      mode="panel"
                    />
                    <Button
                      type="button"
                      variant="text"
                      iconLeft="x"
                      onClick={() => onFiltersExpandedChange?.(false)}
                      primaryClassName="tours-page__inline-filters-close"
                      aria-label="Close filters"
                    />
                  </div>
                ) : null}

                <div className="tours-page__body">
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
                      compactHeader
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
        title="Filters"
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

      {!filtersSheetOpen && !sortSheetOpen ? (
        <FloatingActionBar
          actions={fabActions}
          variant="compact"
          align="center"
          gap="medium"
          showBg={true}
          sheetTitle="Sort by"
          hideOnDesktop
        />
      ) : null}
    </main>
  );
}
