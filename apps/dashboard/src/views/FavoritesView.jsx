import React, { useState } from "react";
import FavoriteCard from "../components/FavoriteCard";
import EmptyState from "../components/EmptyState";
import "./FavoritesView.scss";

const PRODUCT_OPTIONS = ["all", "trevio", "trevista"];

export default function FavoritesView({ favorites, loading, onRemoveFavorite, onViewFavorite }) {
  const [productFilter, setProductFilter] = useState("all");

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
        <div className="dfv__filters">
          {PRODUCT_OPTIONS.map((p) => (
            <button
              key={p}
              className={`dfv__filter ${productFilter === p ? "is-active" : ""}`}
              onClick={() => setProductFilter(p)}
            >
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
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
              item={fav}
              onRemove={onRemoveFavorite}
              onView={onViewFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          title="No favorites yet"
          description={productFilter !== "all" ? "Try a different filter." : "Save trips you love and they'll appear here."}
        />
      )}
    </div>
  );
}
