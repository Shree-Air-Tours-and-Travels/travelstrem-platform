import React from "react";
import { Button, Dropdown, Icon, EmptyState } from "@packages/trem-ui";
import { TourListSkeleton } from "../../shared";

const getLabel = (labels = {}, item = {}) => {
    if (item.labelRef && labels[item.labelRef]) return labels[item.labelRef];
    return item.label || item.id;
};

const formatMoney = (value, currency = "INR") => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return "";
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${currency} ${amount}`;
    }
};

const getPriceText = (tour = {}) => {
    const price = tour.priceInfo || tour.price;
    if (!price) return "Price on request";
    const currency = price.currency || "INR";
    if (price.isFinal || Number(price.min) === Number(price.max)) return formatMoney(price.min, currency);
    return `${formatMoney(price.min, currency)} – ${formatMoney(price.max, currency)}`;
};

const getLocationText = (tour = {}) => {
    const city = tour.address?.city || tour.city?.to || tour.city?.from;
    const country = tour.address?.country;
    return [city, country].filter(Boolean).join(", ") || "Curated destination";
};

const getRouteText = (tour = {}) => {
    const origin = tour.city?.from || "Flexible start";
    const destination = tour.city?.to || tour.address?.city || "Curated destination";
    return `${origin} to ${destination}`;
};

function ListingTourCard({ tour, onView, favorited, onFavorite }) {
    const imageSrc = tour?.photo || tour?.photos?.[0] || "";
    const priceText = getPriceText(tour);
    const rating = Number(tour?.avgRating || 0);
    const ratingText = Number.isFinite(rating) ? rating.toFixed(1) : "0.0";
    const reviewCount = tour?.reviewCount ?? (Array.isArray(tour?.reviews) ? tour.reviews.length : 0);
    const desc = tour?.desc || "Curated tour with handpicked stays, local experiences, and flexible travel support.";
    const tags = Array.isArray(tour?.tags) ? tour.tags.slice(0, 3) : [];
    const period = tour?.period || {};

    const openTour = () => onView?.(tour);
    const toggleFavorite = (event) => {
        event.stopPropagation();
        onFavorite?.(tour);
    };

    return (
        <article className={`tour-listing-card${tour?.featured ? " is-featured" : ""}`} role="button" tabIndex={0} onClick={openTour} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openTour();
            }
        }}>
            <div className="tour-listing-card__media">
                {imageSrc ? <img src={imageSrc} alt={tour?.title || "Tour"} loading="lazy" /> : <div className="tour-listing-card__placeholder"><Icon name="mountain" /></div>}
                <button type="button" className={`tour-listing-card__favorite${favorited ? " is-favorited" : ""}`} aria-label={favorited ? "Remove from favorites" : "Add to favorites"} onClick={toggleFavorite}>
                    <Icon name="heart" />
                </button>
                {tour?.featured ? <span className="tour-listing-card__badge"><Icon name="sparkles" /> Trending</span> : null}
            </div>

            <div className="tour-listing-card__body">
                <div className="tour-listing-card__eyebrow">
                    <Icon name="route" />
                    <span>{getRouteText(tour)}</span>
                </div>
                <h3>{tour?.title || "Untitled Tour"}</h3>
                <div className="tour-listing-card__meta">
                    <span className="tour-listing-card__rating">
                        <span className="tour-listing-card__stars" aria-hidden="true">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Icon key={index} name="star" className={index < Math.round(rating) ? "is-filled" : ""} />
                            ))}
                        </span>
                        <strong>{ratingText}</strong>
                        <span>({reviewCount})</span>
                    </span>
                    <span className="tour-listing-card__location">
                        <Icon name="mapPin" />
                        <span>{getLocationText(tour)}</span>
                    </span>
                </div>
                <p className="tour-listing-card__desc">{desc}</p>
                <div className="tour-listing-card__tags">
                    {tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div className="tour-listing-card__footer">
                    <div className="tour-listing-card__facts">
                        <span><Icon name="calendar" />{period.days ?? "-"}d {period.nights ?? "-"}n</span>
                        <span><Icon name="usersRound" />Max {tour?.maxGroupSize ?? "-"}</span>
                    </div>
                    <div className="tour-listing-card__price">
                        <small>From</small>
                        <strong>{priceText}</strong>
                    </div>
                    <Button text="View tour" variant="solid" color="primary" size="small" onClick={(event) => {
                        event.stopPropagation();
                        openTour();
                    }} primaryClassName="tour-listing-card__view" />
                </div>
            </div>
        </article>
    );
}

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
            <Button primaryClassName="tours-page__page-btn" variant="text" isCircular iconLeft="chevronLeft" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page" />
            {pages.map((p, i) =>
                p === "..." ? (
                    <span key={`ellipsis-${i}`} className="tours-page__page-ellipsis">...</span>
                ) : (
                    <Button
                        key={p}
                        primaryClassName={`tours-page__page-btn tours-page__page-num${p === currentPage ? " is-active" : ""}`}
                        variant="text"
                        onClick={() => onPageChange(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === currentPage ? "page" : undefined}
                    >
                        {p}
                    </Button>
                )
            )}
            <Button primaryClassName="tours-page__page-btn" variant="text" isCircular iconLeft="chevronRight" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page" />
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
                                <Button primaryClassName="tours-page__sort-trigger" variant="text" aria-label={sortLabel}>
                                    <span>{getLabel(listingLabels, selectedSort)}</span>
                                    <Icon name="chevronDown" className={open ? "is-open" : ""} />
                                </Button>
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
                        <ListingTourCard tour={t} onView={onView} favorited={isFavorited(t)} onFavorite={onFavorite} />
                    </div>
                ))}
            </div>
            {loadingMore && <div className="tours-page__message">{listingLabels.loadingTours || "Loading tours..."}</div>}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </>
    );
}
