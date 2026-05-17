import React from "react";
import { FiChevronDown, FiInfo } from "react-icons/fi";
import { Dropdown } from "@packages/trem-ui";
import { TourListSkeleton } from "../../shared";
import TourCardSecondary from "../../../../shared/ui/cards/TourCards/TourSecondaryCards/TourCardSecondary";

const DEFAULT_SORT_OPTIONS = [
    { id: "recommended", label: "Recommended" },
    { id: "price_asc", label: "Price: Low to High" },
    { id: "price_desc", label: "Price: High to Low" },
    { id: "duration", label: "Duration" },
    { id: "rating", label: "Rating" },
];

const getLabel = (labels = {}, item = {}) => {
    if (item.labelRef && labels[item.labelRef]) return labels[item.labelRef];
    return item.label || item.id;
};

export default function ListingView({
    initialLoading,
    initialError,
    displayed,
    totalResults,
    listingLabels,
    listingWidgetData,
    filteredTours,
    filterMeta,
    sentinelRef,
    onView,
    sortId = "recommended",
    onSortChange,
    hasMore,
    loadingMore,
}) {
    const listingProps = listingWidgetData?.structure?.widgets?.[0]?.props || {};
    const sortOptions = listingProps.sortOptions?.length ? listingProps.sortOptions : DEFAULT_SORT_OPTIONS;
    const noteLabelRef = listingProps.noteLabelRef || listingProps.sortNoteLabelRef || "sortNote";
    const sortNote = listingLabels[noteLabelRef] || listingProps.note || listingWidgetData?.data?.note || "Save more with seasonal rates and member-only offers when you plan ahead.";
    const sortLabel = listingLabels.sortBy || listingProps.sortLabel || "Sort by";
    const selectedSort = sortOptions.find((option) => option.id === sortId) || sortOptions[0] || DEFAULT_SORT_OPTIONS[0];
    const sortItems = sortOptions.map((option) => ({
        id: option.id,
        label: getLabel(listingLabels, option),
        active: option.id === sortId,
        onClick: () => onSortChange?.(option.id),
    }));

    return (
        <>
            {initialLoading && displayed.length === 0 && <TourListSkeleton />}
            {initialError && (
                <div className="tours-page__message tours-page__message--error" role="alert">
                    {listingLabels.errorPrefix || "Error"}: {initialError}
                </div>
            )}
            {!initialLoading && !initialError && displayed.length === 0 && (
                <div className="tours-page__message">{listingLabels.noToursFound || "No tours found"}</div>
            )}
            <div className="tours-page__listing-header">
                <div>
                    <span>{listingLabels.showing || "Showing"} </span>
                    <strong>{displayed.length} of {totalResults}</strong>
                </div>
                <div className="tours-page__listing-controls">
                    <label className="tours-page__sort">
                        <span>{sortLabel}</span>
                        <Dropdown
                            align="right"
                            hoverable={false}
                            items={sortItems}
                            className="tours-page__sort-dropdown"
                            menuClassName="tours-page__sort-menu"
                            trigger={({ open }) => (
                                <button className="tours-page__sort-trigger" type="button" aria-label={sortLabel}>
                                    <span>{getLabel(listingLabels, selectedSort)}</span>
                                    <FiChevronDown className={open ? "is-open" : ""} aria-hidden="true" />
                                </button>
                            )}
                        />
                    </label>
                </div>
            </div>
            {sortNote ? (
                <div className="tours-page__sort-note">
                    <FiInfo aria-hidden="true" />
                    <span>{sortNote}</span>
                </div>
            ) : null}
            <div className="tours-page__list" aria-live="polite">
                {displayed.map((t) => (
                    <div className="tours-page__card" key={t._id || t.id}>
                        <TourCardSecondary tour={t} onView={onView} />
                    </div>
                ))}
            </div>
            {loadingMore && <div className="tours-page__message">{listingLabels.loadingTours || "Loading tours..."}</div>}
            {!loadingMore && hasMore && <div className="tours-page__load-hint">{listingLabels.scrollForMore || "Scroll for more tours"}</div>}
            <div ref={sentinelRef} className="tours-page__sentinel" aria-hidden />
        </>
    );
}
