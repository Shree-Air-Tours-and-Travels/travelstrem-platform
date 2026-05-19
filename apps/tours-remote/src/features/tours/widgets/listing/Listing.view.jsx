import React from "react";
import { Dropdown, Icon, TourCard, EmptyState } from "@packages/trem-ui";
import { TourListSkeleton } from "../../shared";

const getLabel = (labels = {}, item = {}) => {
    if (item.labelRef && labels[item.labelRef]) return labels[item.labelRef];
    return item.label || item.id;
};

function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
    }

    return (
        <div className="tours-page__pagination">
            <button className="tours-page__page-btn" type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">
                <Icon name="chevronLeft" />
            </button>
            {pages.map((p, i) =>
                p === "..." ? (
                    <span key={`ellipsis-${i}`} className="tours-page__page-ellipsis">...</span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        className={`tours-page__page-btn tours-page__page-num${p === currentPage ? " is-active" : ""}`}
                        onClick={() => onPageChange(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === currentPage ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}
            <button className="tours-page__page-btn" type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">
                <Icon name="chevronRight" />
            </button>
        </div>
    );
}

export default function ListingView({
    initialLoading,
    initialError,
    displayed,
    totalResults,
    listingLabels,
    listingWidgetData,
    filteredTours,
    filterMeta,
    onView,
    isFavorited,
    onFavorite,
    sortId = "recommended",
    onSortChange,
    currentPage,
    totalPages,
    loadingMore,
    onPageChange,
}) {
    const listingProps = listingWidgetData?.structure?.widgets?.[0]?.props || {};
    const sortOptions = listingProps.sortOptions?.length ? listingProps.sortOptions : [];
    const noteLabelRef = listingProps.noteLabelRef || listingProps.sortNoteLabelRef || "sortNote";
    const sortNote = listingLabels[noteLabelRef] || listingProps.note || listingWidgetData?.data?.note || "";
    const sortLabel = listingLabels.sortBy || listingProps.sortLabel || "Sort by";
    const selectedSort = sortOptions.find((option) => option.id === sortId) || sortOptions[0] || { id: sortId, label: sortId };
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
            <div className="tours-page__listing-header">
                <div>
                    <span>{listingLabels.showing || "Showing"} </span>
                    <strong>{displayed.length} {listingLabels.of || "of"} {totalResults}</strong>
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
                                    <Icon name="chevronDown" className={open ? "is-open" : ""} />
                                </button>
                            )}
                        />
                    </label>
                </div>
            </div>
             {sortNote ? (
                <div className="tours-page__sort-note">
                                        <Icon name="info" />
                    <span>{sortNote}</span>
                </div>
            ) : null}
            {!initialLoading && !initialError && displayed.length === 0 && (
                <EmptyState
                    icon="search"
                    title={listingLabels.noToursFound || "No tours found"}
                    description="Try adjusting your filters or check back later for new tours."
                />
            )}
           
            <div className="tours-page__list" aria-live="polite">
                {displayed.map((t) => (
                    <div className="tours-page__card" key={t._id || t.id}>
                        <TourCard tour={t} onView={onView} favorited={isFavorited(t)} onFavorite={onFavorite} />
                    </div>
                ))}
            </div>
            {loadingMore && <div className="tours-page__message">{listingLabels.loadingTours || "Loading tours..."}</div>}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </>
    );
}
