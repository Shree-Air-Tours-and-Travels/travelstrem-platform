import React from "react";
import PropTypes from "prop-types";
import DestinationCard from "../DestinationCard/DestinationCard.jsx";
import Preloader from "../Preloader/Preloader.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import ErrorState from "../ErrorState/ErrorState.jsx";
import "./DestinationCardList.styles.scss";

const clampColumns = (value) => Math.max(1, Math.min(Number(value) || 4, 4));

export default function DestinationCardList({
  destinations = [],
  renderDestination,
  columns = 4,
  gap = 16,
  horizontal = false,
  loading = false,
  skeletonCount,
  error = null,
  onRetry,
  emptyTitle = "No destinations yet",
  emptyDescription = "Check back soon for handpicked holiday packages.",
  emptyIcon = "travelPackage",
  emptyAction = null,
  cardProps = {},
  isFavorited,
  onFavorite,
  onCardClick,
  className = "",
  id,
}) {
  const items = Array.isArray(destinations)
    ? destinations.filter((item) => item && (item.id != null || item.title))
    : [];
  const resolvedColumns = clampColumns(columns);

  let content;
  if (loading) {
    content = (
      <Preloader
        variant="cards"
        count={skeletonCount || resolvedColumns}
        label="Loading destinations"
        className="trem-destination-card-list__loader"
      />
    );
  } else if (error) {
    content = (
      <ErrorState
        title="Could not load destinations"
        description={error}
        retry={typeof onRetry === "function" ? onRetry : undefined}
        className="trem-destination-card-list__state"
      />
    );
  } else if (items.length === 0) {
    content = (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className="trem-destination-card-list__state"
      />
    );
  } else {
    content = items.map((item) => (
      <div className="trem-destination-card-list__item" key={item.id ?? item.title}>
        {renderDestination ? (
          renderDestination(item)
        ) : (
          <DestinationCard
            {...cardProps}
            {...item}
            favorite={typeof isFavorited === "function" ? isFavorited(item) : undefined}
            onFavorite={typeof onFavorite === "function" ? () => onFavorite(item) : undefined}
            onClick={typeof onCardClick === "function" ? () => onCardClick(item) : item.onClick}
          />
        )}
      </div>
    ));
  }

  return (
    <div
      id={id}
      className={`trem-destination-card-list${horizontal ? " trem-destination-card-list--horizontal" : ""}${className ? ` ${className}` : ""}`}
      style={{
        "--destination-card-columns": resolvedColumns,
        "--destination-card-gap": `${gap}px`,
      }}
    >
      {content}
    </div>
  );
}

DestinationCardList.propTypes = {
  destinations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      href: PropTypes.string,
    }),
  ),
  renderDestination: PropTypes.func,
  columns: PropTypes.number,
  gap: PropTypes.number,
  horizontal: PropTypes.bool,
  loading: PropTypes.bool,
  skeletonCount: PropTypes.number,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  emptyIcon: PropTypes.string,
  emptyAction: PropTypes.node,
  cardProps: PropTypes.object,
  isFavorited: PropTypes.func,
  onFavorite: PropTypes.func,
  onCardClick: PropTypes.func,
  className: PropTypes.string,
  id: PropTypes.string,
};
