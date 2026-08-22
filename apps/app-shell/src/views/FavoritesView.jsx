import React, { useState } from "react";
import { Dropdown, EmptyState, FavoriteCard } from "@packages/trem-ui";
import { useMasterOptions } from "@packages/trem-utils";
import "./FavoritesView.scss";

export default function FavoritesView({ favorites, loading, onRemoveFavorite, onViewFavorite }) {
  const [productFilter, setProductFilter] = useState("all");
  const { options: masterOptions } = useMasterOptions(["appShell.favoriteProductOptions"]);
  const productOptions = masterOptions["appShell.favoriteProductOptions"] || [];

  const filtered = productFilter === "all"
    ? favorites
    : favorites?.filter((f) => f.product === productFilter || (!f.product && productFilter === "trevista"));

  return (
    <div className="dfv">
      <div className="dfv__header">
        <div>
          <h1 className="dfv__title">Favorites</h1>
          <p className="dfv__subtitle">{filtered?.length || 0} saved trip{(filtered?.length || 0) !== 1 ? "s" : ""}</p>
        </div>
        <Dropdown
          hoverable={false}
          align="right"
          items={productOptions.map((option) => ({
            id: option.value,
            label: option.label,
            active: productFilter === option.value,
            onClick: () => setProductFilter(option.value),
          }))}
          trigger={({ open }) => (
            <button className={`dfv__filter-trigger${open ? " is-open" : ""}`} type="button">
              {productFilter === "all" ? "All" : productFilter.charAt(0).toUpperCase() + productFilter.slice(1)}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          )}
        />
      </div>

      {loading ? (
        <div className="dfv__loading">
          <div className="dfv__spinner" />
          <span>Loading favorites...</span>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="dfv__grid">
          {filtered.map((fav, i) => (
            <FavoriteCard
              key={fav._id || fav.tourId || i}
              tour={fav}
              onRemove={() => onRemoveFavorite?.(fav)}
              onView={() => onViewFavorite?.(fav)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="heart"
          title="No favorites yet"
          description={productFilter !== "all" ? "Try a different filter." : "Save trips you love and they'll appear here."}
        />
      )}
    </div>
  );
}
