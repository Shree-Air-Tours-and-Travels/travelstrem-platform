import React from "react";
import { Button, DestinationCardList, TitleEnhancement } from "@packages/trem-ui";
import "./featuredHolidayPackages.scss";

export default function FeaturedHolidayPackagesView({
  eyebrow = "",
  title = "Featured holiday packages",
  description = "",
  viewAllLabel = "",
  viewAllHref = "",
  destinations = [],
  loading = false,
  error = null,
  onRetry,
  columns = 4,
  horizontal = true,
  cardProps = {},
  isFavorited,
  onFavorite,
  onCardClick,
  emptyActions = [],
}) {
  const emptyAction = emptyActions.length ? (
    <div className="featured-holiday-packages__empty-actions">
      {emptyActions.slice(0, 2).map((action) => (
        <Button
          key={action.id}
          text={action.label}
          iconLeft={action.iconLeft}
          variant={action.variant}
          color={action.color}
          disabled={action.disabled}
          onClick={action.onClick}
        />
      ))}
    </div>
  ) : null;

  return (
    <section className="featured-holiday-packages" aria-label={title}>
      <div className="featured-holiday-packages__inner">
        <header className="featured-holiday-packages__head">
          <div className="featured-holiday-packages__copy">
            <TitleEnhancement
              text={eyebrow}
              className="featured-holiday-packages__eyebrow"
            />
            <h2 className="featured-holiday-packages__title">{title}</h2>
            {description && <p className="featured-holiday-packages__desc">{description}</p>}
          </div>
          {viewAllLabel && viewAllHref && (
            <Button
              variant="outline"
              color="primary"
              size="medium"
              text={viewAllLabel}
              iconRight="arrowUpRight"
              href={viewAllHref}
              primaryClassName="featured-holiday-packages__view-all"
            />
          )}
        </header>
        <DestinationCardList
          destinations={destinations}
          loading={loading}
          error={error}
          onRetry={onRetry}
          columns={columns}
          horizontal={horizontal}
          cardProps={cardProps}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onCardClick={onCardClick}
          emptyAction={emptyAction}
          className={`featured-holiday-packages__list featured-holiday-packages__list--count-${Math.min(destinations.length, 4)}`}
        />
      </div>
    </section>
  );
}
