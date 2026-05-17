import React from "react";
import "../tours.scss";
import HeroBanner from "../widgets/hero-banner/HeroBanner";
import QuickFilters from "../widgets/quick-filters/QuickFilters";
import Filters from "../widgets/filters/Filters";
import Listing from "../widgets/listing/Listing";

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
    listingScrollRef,
    sentinelRef,
    onView,
    sortId,
    onSortChange,
    hasMore,
    loadingMore,
    handleFilterChange,
    onQuickFilter,
}) {
    const listingLabels = widgetsData.listing?.elements?.labels || {};

    return (
        <main className="tours-page">
            <div className="tours-page__inner">
                {widgets.map((w) => {
                    if (w.type === "HeroBanner") {
                        return <HeroBanner key={w.type} widgetData={widgetsData.HeroBanner} pageTitle={pageTitle} />;
                    }
                    if (w.type === "QuickFilters") {
                        return <QuickFilters key={w.type} widgetData={widgetsData.QuickFilters} onQuickFilter={onQuickFilter} />;
                    }
                    if (w.type === "filters") {
                        return (
                            <div key={w.type} className="tours-page__body">
                                <aside className="tours-page__sidebar">
                                    <div className="tours-page__sidebar-inner">
                                        <Filters onChange={handleFilterChange} widgetData={filterWidgetData} sortId={sortId} pageSize={6} />
                                    </div>
                                </aside>
                                <section className="tours-page__listing" ref={listingScrollRef} aria-label="Tours listing">
                                    <Listing
                                        initialLoading={initialLoading}
                                        initialError={initialError}
                                        displayed={displayed}
                                        totalResults={totalResults}
                                        listingLabels={listingLabels}
                                        listingWidgetData={listingWidgetData}
                                        filteredTours={filteredTours}
                                        filterMeta={filterMeta}
                                        listingScrollRef={listingScrollRef}
                                        sentinelRef={sentinelRef}
                                        onView={onView}
                                        sortId={sortId}
                                        onSortChange={onSortChange}
                                        hasMore={hasMore}
                                        loadingMore={loadingMore}
                                    />
                                </section>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </main>
    );
}
