import React, { useState } from "react";
import {
  Button,
  Icon,
  InputField,
  NoDataFound,
  Pagination,
  SingleSelect,
  TourCard,
} from "@packages/trem-ui";
import { TourListSkeleton } from "../../shared";

const MEMBER_NOTE_DISMISSED_KEY = "trevista.member-note-dismissed";

const wasMemberNoteDismissed = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(MEMBER_NOTE_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
};

const displayText = (value, fallback = "") => {
  if (value == null) return fallback;
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (Array.isArray(value)) {
    return (
      value
        .map((item) => displayText(item))
        .filter(Boolean)
        .join(", ") || fallback
    );
  }
  if (typeof value === "object") {
    return (
      displayText(value.label ?? value.name ?? value.title) ||
      [value.city, value.country]
        .map((item) => displayText(item))
        .filter(Boolean)
        .join(", ") ||
      fallback
    );
  }
  return fallback;
};

const getLabel = (labels = {}, item = {}) => {
  if (item.labelRef && labels[item.labelRef])
    return displayText(labels[item.labelRef], String(item.id || ""));
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
  compactHeader = false,
}) {
  const [memberNoteDismissed, setMemberNoteDismissed] = useState(wasMemberNoteDismissed);
  const listingProps = listingWidgetData?.structure?.widgets?.[0]?.props || {};
  const sortOptions = listingProps.sortOptions?.length ? listingProps.sortOptions : [];
  const guestNoteLabelRef =
    listingProps.noteLabelRef || listingProps.sortNoteLabelRef || "sortNote";
  const memberNoteLabelRef = listingProps.memberSortNoteLabelRef || "memberSortNote";
  const guestNote =
    listingLabels[guestNoteLabelRef] || listingProps.note || listingWidgetData?.data?.note || "";
  const memberNote = listingLabels[memberNoteLabelRef] || listingProps.memberNote || "";
  const sortNote = isAuthenticated ? memberNote : guestNote;
  const sortLabel = listingLabels.sortBy || listingProps.sortLabel || "Sort by";
  const searchLabel =
    listingLabels[listingProps.searchLabelRef] || listingProps.searchLabel || "Search tours";
  const searchPlaceholder =
    listingLabels[listingProps.searchPlaceholderRef] ||
    listingProps.searchPlaceholder ||
    "Search tours...";
  const hideDescription = listingProps.hideDescription === true;
  const normalizedSortOptions = sortOptions.map((option) => ({
    value: option.id || option.value,
    label: getLabel(listingLabels, option),
    disabled: option.disabled,
  }));
  const showSortNote = sortNote && (!isAuthenticated || !memberNoteDismissed);

  const dismissMemberNote = () => {
    setMemberNoteDismissed(true);
    try {
      window.sessionStorage.setItem(MEMBER_NOTE_DISMISSED_KEY, "true");
    } catch {
      // Dismiss for this render even when browser storage is unavailable.
    }
  };

  return (
    <>
      {initialLoading && displayed.length === 0 && <TourListSkeleton />}
      {initialError && (
        <div className="tours-page__message tours-page__message--error" role="alert">
          {listingLabels.errorPrefix || "Error"}: {initialError}
        </div>
      )}
      <div
        className={`tours-page__listing-header${compactHeader ? " tours-page__listing-header--compact" : ""}`}
      >
        <div className="tours-page__listing-count">
          <span>{listingLabels.showing || "Showing"} </span>
          <strong>
            {displayed.length} {listingLabels.of || "of"} {totalResults}
          </strong>
        </div>
        {!compactHeader ? (
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
        ) : null}
        {!compactHeader && normalizedSortOptions.length > 0 ? (
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
      {showSortNote ? (
        <div
          className={`tours-page__sort-note${isAuthenticated ? " tours-page__sort-note--member" : ""}`}
        >
          <Icon name={isAuthenticated ? "badgeCheck" : "info"} />
          <span>{sortNote}</span>
          {isAuthenticated ? (
            <button
              type="button"
              className="tours-page__sort-note-dismiss"
              onClick={dismissMemberNote}
              aria-label="Dismiss signed-in information"
            >
              <Icon name="x" size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
      {!initialLoading && !initialError && displayed.length === 0 && (
        <NoDataFound
          compact
          icon="search"
          title={listingLabels.noToursFound || "No tours available right now"}
          description={listingLabels.noToursDescription}
          actionLabel={
            hasActiveFilters ? "Clear all filters" : listingLabels.enquireLabel || "Enquire now"
          }
          onAction={hasActiveFilters ? onClearFilters : onEnquire}
          actionAriaLabel={
            hasActiveFilters
              ? "Clear all tour filters"
              : listingLabels.enquireAriaLabel || "Open tour enquiry form"
          }
          className="tours-page__no-tours"
        />
      )}

      <div className="tours-page__list" aria-live="polite">
        {displayed.map((t) => (
          <div className="tours-page__card" key={t._id || t.id}>
            <TourCard
              tour={t}
              variant="management"
              size="dense"
              onView={onView}
              favorited={isFavorited(t)}
              onFavorite={onFavorite}
              ownershipMode="none"
              simplified
              withAgency
              packagePricesInteractive={false}
              hideDescription={hideDescription}
              labels={{
                featured: listingLabels.featured || "Featured",
                trending: listingLabels.trending || "Trending",
                verified: listingLabels.verified || "TREM verified",
                viewTour: listingLabels.viewTour || "Explore this Tour",
              }}
            />
          </div>
        ))}
      </div>
      {loadingMore && (
        <div className="tours-page__message">
          {listingLabels.loadingTours || "Loading tours..."}
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={loadingMore}
      />
    </>
  );
}
