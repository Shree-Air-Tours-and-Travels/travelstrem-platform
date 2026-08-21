import React from "react";
import { Button, Icon, InputField, NoDataFound, Pagination, SingleSelect } from "@packages/trem-ui";
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
    const price = tour.pricing;
    if (!price || !Number.isFinite(Number(price.min)) || Number(price.min) <= 0) return "Price on request";
    const currency = price.currency || "INR";
    const max = Number.isFinite(Number(price.max)) && Number(price.max) > 0 ? price.max : price.min;
    if (price.isFinal || Number(price.min) === Number(max)) return formatMoney(price.min, currency);
    return `${formatMoney(price.min, currency)} – ${formatMoney(max, currency)}`;
};

const getLocationText = (tour = {}) => {
    const city = displayText(tour.location?.city);
    const country = displayText(tour.location?.country);
    return [city, country].filter(Boolean).join(", ") || "Curated destination";
};

const getRouteText = (tour = {}) => {
    const origin = displayText(tour.route?.origin?.name, "Flexible start");
    const destination = displayText(tour.route?.destination?.name ?? tour.location?.city, "Curated destination");
    return `${origin} to ${destination}`;
};

const getInitials = (value) => displayText(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

function ListingTourCard({ tour, onView, favorited, onFavorite, agencyLabel, hideDescription = false }) {
    const imageSrc = tour?.coverImage?.url || "";
    const priceText = getPriceText(tour);
    const rating = Number(tour?.rating?.average || 0);
    const ratingText = Number.isFinite(rating) ? rating.toFixed(1) : "0.0";
    const reviewCount = tour?.rating?.count || 0;
    const desc = tour?.shortDescription || "Curated tour with handpicked stays, local experiences, and flexible travel support.";
    const tags = Array.isArray(tour?.tags) ? tour.tags.slice(0, 3) : [];
    const duration = tour?.duration || {};
    const title = displayText(tour?.title, "Untitled Tour");
    const description = displayText(desc);
    const agencyName = displayText(tour?.agency?.name);
    const agencyLogo = typeof tour?.agency?.logo === "string" ? tour.agency.logo : "";

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
                {imageSrc ? <img src={imageSrc} alt={title} loading="lazy" /> : <div className="tour-listing-card__placeholder"><Icon name="mountain" /></div>}
                <button type="button" className={`tour-listing-card__favorite${favorited ? " is-favorited" : ""}`} aria-label={favorited ? "Remove from favorites" : "Add to favorites"} onClick={toggleFavorite}>
                    <Icon name="heart" />
                </button>
                {tour?.trending ? (
                    <div className="tour-listing-card__badges" aria-label="Tour status">
                        <span className="tour-listing-card__badge tour-listing-card__badge--trending"><Icon name="sparkles" /> Trending</span>
                    </div>
                ) : null}
            </div>

            <div className="tour-listing-card__body">
                <div className="tour-listing-card__topline">
                    <div className="tour-listing-card__eyebrow">
                        <Icon name="route" />
                        <span>{getRouteText(tour)}</span>
                    </div>
                    {agencyName ? (
                        <div className="tour-listing-card__agency" title={`${agencyLabel}: ${agencyName}`}>
                            <span className="tour-listing-card__agency-logo" aria-hidden="true">
                                {agencyLogo ? <img src={agencyLogo} alt="" loading="lazy" /> : getInitials(agencyName)}
                            </span>
                            <span className="tour-listing-card__agency-copy">
                                <small>{agencyLabel}</small>
                                <strong>{agencyName}</strong>
                            </span>
                        </div>
                    ) : null}
                </div>
                <h3 title={title}>{title}</h3>
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
                {!hideDescription ? <p className="tour-listing-card__desc">{description}</p> : null}
                <div className="tour-listing-card__tags">
                    {tour?.tremVerified ? <span className="tour-listing-card__verified-tag"><Icon name="badgeCheck" /> TREM verified</span> : null}
                    {tags.map((tag, index) => {
                        const tagLabel = displayText(tag?.name ?? tag?.label ?? tag);
                        if (!tagLabel) return null;
                        return <span key={displayText(tag?.id ?? tag?.slug, `${tagLabel}-${index}`)}>{tagLabel}</span>;
                    })}
                </div>
                <div className="tour-listing-card__footer">
                    <div className="tour-listing-card__facts">
                        <span><Icon name="calendar" />{duration.days ?? "-"}d {duration.nights ?? "-"}n</span>
                        <span><Icon name="usersRound" />Max {tour?.group?.max ?? "-"}</span>
                        {tour?.availability?.availableSeats != null && Number.isFinite(Number(tour.availability.availableSeats)) ? (
                            <span><Icon name="ticket" />{tour.availability.availableSeats} seats left</span>
                        ) : null}
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
                        <ListingTourCard tour={t} onView={onView} favorited={isFavorited(t)} onFavorite={onFavorite} agencyLabel={agencyLabel} hideDescription={hideDescription} />
                    </div>
                ))}
            </div>
            {loadingMore && <div className="tours-page__message">{listingLabels.loadingTours || "Loading tours..."}</div>}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} disabled={loadingMore} />
        </>
    );
}
