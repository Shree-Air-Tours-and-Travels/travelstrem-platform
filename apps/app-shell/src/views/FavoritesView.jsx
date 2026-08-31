import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  EmptyState,
  ErrorState,
  FavoriteCard,
  Icon,
  PRODUCT_TYPE,
  Preloader,
  SearchBar,
} from "@packages/trem-ui";
import "./FavoritesView.scss";

const optionMenuItems = (options, selected, onSelect) =>
  options.map((option) => ({
    id: option.value,
    label: option.label,
    active: selected === option.value,
    onClick: () => onSelect(option.value),
  }));

const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || options[0]?.label || "";

const searchableText = (favorite) =>
  [
    favorite?.title,
    favorite?.name,
    favorite?.productLabel,
    favorite?.location,
    favorite?.address?.city,
    favorite?.city?.from,
    favorite?.city?.to,
    ...(Array.isArray(favorite?.tags) ? favorite.tags : []),
  ]
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();

export default function FavoritesView({
  favorites = [],
  view = {},
  loading,
  error,
  removingIds = [],
  onRetry,
  onExplore,
  onRemoveFavorite,
  onViewFavorite,
}) {
  const [productFilter, setProductFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [query, setQuery] = useState("");
  const productOptions = useMemo(() => view?.controls?.productOptions || [], [view]);
  const sortOptions = useMemo(() => view?.controls?.sortOptions || [], [view]);
  const labels = view?.labels || {};
  const states = view?.states || {};
  const actions = view?.actions || {};

  useEffect(() => {
    if (productOptions.length && !productOptions.some((option) => option.value === productFilter)) {
      setProductFilter(productOptions[0].value);
    }
  }, [productFilter, productOptions]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = favorites.filter((favorite) => {
      const matchesProduct =
        productFilter === "all" ||
        favorite.product === productFilter ||
        (!favorite.product && productFilter === PRODUCT_TYPE.TREVISTA);
      return matchesProduct && (!normalizedQuery || searchableText(favorite).includes(normalizedQuery));
    });

    return [...result].sort((left, right) => {
      if (sortBy === "oldest") return new Date(left.savedAt || 0) - new Date(right.savedAt || 0);
      if (sortBy === "price-low")
        return Number(left.priceInfo?.min ?? left.price ?? 0) - Number(right.priceInfo?.min ?? right.price ?? 0);
      if (sortBy === "price-high")
        return Number(right.priceInfo?.min ?? right.price ?? 0) - Number(left.priceInfo?.min ?? left.price ?? 0);
      if (sortBy === "title") return String(left.title || "").localeCompare(String(right.title || ""));
      return new Date(right.savedAt || 0) - new Date(left.savedAt || 0);
    });
  }, [favorites, productFilter, query, sortBy]);

  const clearFilters = () => {
    setProductFilter(productOptions[0]?.value || "all");
    setQuery("");
  };

  if (loading) {
    return <Preloader variant="cards" count={3} label={labels.loading || "Loading saved journeys"} />;
  }

  if (error && !favorites.length) {
    return (
      <ErrorState
        className="dfv__state"
        title={states.errorTitle}
        description={states.errorDescription}
        retry={onRetry}
        retryText={actions.retry}
      />
    );
  }

  return (
    <div className="dfv">
      <section className="dfv__hero">
        <div className="dfv__hero-icon" aria-hidden="true">
          <Icon name="heart" size={28} />
        </div>
        <div className="dfv__hero-copy">
          <span className="dfv__eyebrow">{view?.hero?.eyebrow}</span>
          <h1 className="dfv__title">{view?.hero?.title}</h1>
          <p className="dfv__subtitle">{view?.hero?.description}</p>
        </div>
        <div className="dfv__summary" aria-label={view?.hero?.title}>
          <span><strong>{favorites.length}</strong>{labels.saved}</span>
          <span><strong>{view?.summary?.productCount ?? Math.max(productOptions.length - 1, 0)}</strong>{labels.products}</span>
        </div>
      </section>

      {favorites.length ? (
        <>
          <section className="dfv__controls" aria-label={view?.hero?.title}>
            <SearchBar
              className="dfv__search"
              value={query}
              onChange={setQuery}
              placeholder={view?.controls?.searchPlaceholder}
            />
            <Dropdown
              className="dfv__filter-dropdown"
              menuClassName="dfv__filter-menu"
              portalClassName="dfv__filter-layer"
              hoverable={false}
              align="right"
              items={optionMenuItems(productOptions, productFilter, setProductFilter)}
              trigger={({ open }) => (
                <button className={`dfv__filter-trigger${open ? " is-open" : ""}`} type="button">
                  <span>{optionLabel(productOptions, productFilter)}</span>
                  <Icon name="chevronDown" size={16} />
                </button>
              )}
            />
            <Dropdown
              className="dfv__filter-dropdown"
              menuClassName="dfv__filter-menu"
              portalClassName="dfv__filter-layer"
              hoverable={false}
              align="right"
              items={optionMenuItems(sortOptions, sortBy, setSortBy)}
              trigger={({ open }) => (
                <button className={`dfv__filter-trigger${open ? " is-open" : ""}`} type="button">
                  <span>{optionLabel(sortOptions, sortBy)}</span>
                  <Icon name="chevronDown" size={16} />
                </button>
              )}
            />
            <span className="dfv__result-count">
              <strong>{filtered.length}</strong>{" "}
              {filtered.length === 1 ? labels.result : labels.results}
            </span>
          </section>

          {filtered.length ? (
        <div className="dfv__grid">
          {filtered.map((fav, i) => (
            <FavoriteCard
              key={fav.favoriteId || fav._id || fav.tourId || i}
              tour={fav}
              labels={labels}
              removing={removingIds.includes(fav.favoriteId || fav._id || fav.tourId)}
              onRemove={() => onRemoveFavorite?.(fav)}
              onView={() => onViewFavorite?.(fav)}
            />
          ))}
        </div>
          ) : (
            <EmptyState
              className="dfv__state"
              icon="search"
              title={states.filteredTitle}
              description={states.filteredDescription}
              action={<Button variant="outline" text={actions.clear} onClick={clearFilters} />}
            />
          )}
        </>
      ) : (
        <EmptyState
          className="dfv__state"
          icon="heart"
          title={states.emptyTitle}
          description={states.emptyDescription}
          action={<Button text={actions.explore} iconRight="arrowRight" onClick={onExplore} />}
        />
      )}
    </div>
  );
}
