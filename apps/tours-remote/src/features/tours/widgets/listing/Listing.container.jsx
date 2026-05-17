import React from "react";
import ListingView from "./Listing.view";

export default function ListingContainer({
    initialLoading,
    initialError,
    displayed,
    totalResults,
    listingLabels,
    listingWidgetData,
    filteredTours,
    filterMeta,
    listingScrollRef,
    sentinelRef,
    onView,
    sortId,
    onSortChange,
    hasMore,
    loadingMore,
}) {
    return (
        <ListingView
            initialLoading={initialLoading}
            initialError={initialError}
            displayed={displayed}
            totalResults={totalResults}
            listingLabels={listingLabels}
            listingWidgetData={listingWidgetData}
            filteredTours={filteredTours}
            filterMeta={filterMeta}
            sentinelRef={sentinelRef}
            onView={onView}
            sortId={sortId}
            onSortChange={onSortChange}
            hasMore={hasMore}
            loadingMore={loadingMore}
        />
    );
}
