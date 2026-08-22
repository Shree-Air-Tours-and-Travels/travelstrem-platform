import React from "react";
import { Button, Icon, InputField, NoDataFound, Pagination, SingleSelect, TourCard } from "@packages/trem-ui";
import { TourListSkeleton } from "../../shared";

const displayText = (value, fallback = "") => {
    if (value == null) return fallback;
    if (["string", "number", "boolean"].includes(typeof value)) return String(value);
    if (Array.isArray(value)) {
        return value.map((item) => displayText(item)).filter(Boolean).join(", ") || fallback;
    }
    if (typeof value === "object") {
        return displayText(value.label ?? value.name ?? value.title)
            || [value.city, value.country].map((item) => displayText(item)).filter(Boolean).join(", ")
            || fallback;
    }
    return fallback;
};

const getLabel = (labels = {}, item = {}) => {
    if (item.labelRef && labels[item.labelRef]) return displayText(labels[item.labelRef], String(item.id || ""));
    return displayText(item.label, String(item.id || ""));
};

export default function ListingView({
    initialLoading,
    initialError,
    displayed,
    totalResults,
    listingLabels,
    listingWidgetData,
    isAuthenticated = false,
    onView,
    isFavorited,
    onFavorite,
    sortId = "recommended",
    onSortChange,
    queryValue = "",
    onQueryChange,
    currentPage,
    totalPages,
    loadingMore,
    onPageChange,
    hasActiveFilters = false,
    onClearFilters,
    onEnquire,
}) {
    const listingProps = listingWidgetData?.structure?.widgets?.[0]?.props || {};
    const sortOptions = listingProps.sortOptions?.length ? listingProps.sortOptions : [];
    const guestNoteLabelRef = listingProps.noteLabelRef || listingProps.sortNoteLabelRef || "sortNote";
    const memberNoteLabelRef = listingProps.memberSortNoteLabelRef || "memberSortNote";
    const guestNote = listingLabels[guestNoteLabelRef] || listingProps.note || listingWidgetData?.data?.note || "";
    const memberNote = listingLabels[memberNoteLabelRef] || listingProps.memberNote || "";
    const sortNote = isAuthenticated ? memberNote : guestNote;
    const sortLabel = listingLabels.sortBy || listingProps.sortLabel || "Sort by";
    const searchLabel = listingLabels[listingProps.searchLabelRef] || listingProps.searchLabel || "Search tours";
    const searchPlaceholder = listingLabels[listingProps.searchPlaceholderRef] || listingProps.searchPlaceholder || "Search tours...";
    const agencyLabel = listingLabels[listingProps.agencyLabelRef] || listingProps.agencyLabel || "Uploaded by";
    const hideDescription = listingProps.hideDescription === true;
    const normalizedSortOptions = sortOptions.map((option) => ({
        value: option.id || option.value,
        label: getLabel(listingLabels, option),
        disabled: option.disabled,
    }));

    return (
        <>
            {initialLoading && displayed.length === 0 && <TourListSkeleton />}
            {initialError && (
                <div className="tours-page__message tours-page__message--error" role="alert">
                    {listingLabels.errorPrefix || "Error"}: {initialError}
                </div>
            )}
            <div className="tours-page__listing-header">
                <div className="tours-page__listing-count">
                    <span>{listingLabels.showing || "Showing"} </span>
                    <strong>{displayed.length} {listingLabels.of || "of"} {totalResults}</strong>
                </div>
                <div className="tours-page__grid-search">
                    <Icon name="search" aria-hidden="true" />
                    <InputField
                        variant="text"
                        ariaLabel={searchLabel}
                        placeholder={searchPlaceholder}
                        value={queryValue}
                        onChange={onQueryChange}
                        className="tours-page__grid-search-input"
                    />
                    {queryValue ? (
                        <Button
                            type="button"
                            variant="text"
                            iconLeft="x"
                            onClick={() => onQueryChange?.("")}
                            primaryClassName="tours-page__grid-search-clear"
                            aria-label="Clear tour search"
                        />
                    ) : null}
                </div>
                {normalizedSortOptions.length > 0 ? (
                    <div className="tours-page__listing-controls">
                        <SingleSelect
                            label={sortLabel}
                            value={sortId}
                            options={normalizedSortOptions}
                            onChange={onSortChange}
                            size="sm"
                            className="tours-page__sort"
                        />
                    </div>
                ) : null}
            </div>
            {sortNote ? (
                <div className={`tours-page__sort-note${isAuthenticated ? " tours-page__sort-note--member" : ""}`}>
                    <Icon name={isAuthenticated ? "badgeCheck" : "info"} />
                    <span>{sortNote}</span>
                </div>
            ) : null}
            {!initialLoading && !initialError && displayed.length === 0 && (
                <NoDataFound
                    icon="search"
                    title={listingLabels.noToursFound || "No tours available right now"}
                    description={listingLabels.noToursDescription}
                    actionLabel={hasActiveFilters ? "Clear all filters" : (listingLabels.enquireLabel || "Enquire now")}
                    onAction={hasActiveFilters ? onClearFilters : onEnquire}
                    actionAriaLabel={hasActiveFilters ? "Clear all tour filters" : (listingLabels.enquireAriaLabel || "Open tour enquiry form")}
                    className="tours-page__no-tours"
                />
            )}
           
            <div className="tours-page__list" aria-live="polite">
                {displayed.map((t) => (
                    <div className="tours-page__card" key={t._id || t.id}>
                        <TourCard
                            tour={t}
                            variant="management"
                            onView={onView}
                            favorited={isFavorited(t)}
                            onFavorite={onFavorite}
                            ownershipMode="agency"
                            ownershipLabels={{ agency: agencyLabel }}
                            hideDescription={hideDescription}
                            labels={{
                                featured: listingLabels.featured || "Featured",
                                trending: listingLabels.trending || "Trending",
                                verified: listingLabels.verified || "TREM verified",
                                viewTour: listingLabels.viewTour || "View tour",
                            }}
                        />
                    </div>
                ))}
            </div>
            {loadingMore && <div className="tours-page__message">{listingLabels.loadingTours || "Loading tours..."}</div>}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} disabled={loadingMore} />
        </>
    );
}
