import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { fetchData, notifyDataChanged } from "@packages/trem-utils";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children, product = "trevista" }) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favorites, setFavorites] = useState([]);
  const idsRef = useRef(favoriteIds);
  idsRef.current = favoriteIds;

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetchData("/tours.json/favorites");
      if (res?.status === "success") {
        const items = res.componentData?.data || [];
        const ids = new Set(items.map((t) => t._id || t.id).filter(Boolean));
        setFavoriteIds(ids);
        idsRef.current = ids;
        setFavorites(items);
      }
    } catch {
      // Keep the last successful snapshot during a transient refresh failure.
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorited = useCallback((tour) => idsRef.current.has(tour?._id || tour?.id), []);

  const rollback = useCallback((tourId, wasFav) => {
    const rolled = new Set(idsRef.current);
    if (wasFav) rolled.add(tourId);
    else rolled.delete(tourId);
    setFavoriteIds(rolled);
    idsRef.current = rolled;
  }, []);

  const toggleFavorite = useCallback(
    async (tour) => {
      const tourId = tour?._id || tour?.id;
      if (!tourId) return;

      const current = idsRef.current;
      const wasFav = current.has(tourId);
      const next = new Set(current);
      if (wasFav) next.delete(tourId);
      else next.add(tourId);
      setFavoriteIds(next);
      idsRef.current = next;

      try {
        const res = await fetchData("/tours.json/favorite/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { tourId, product },
        });
        if (res?.status === "error") {
          rollback(tourId, wasFav);
          return;
        }
        if (res?.status === "success" && typeof res.data?.favorited === "boolean") {
          const corrected = new Set(idsRef.current);
          if (res.data.favorited) corrected.add(tourId);
          else corrected.delete(tourId);
          setFavoriteIds(corrected);
          idsRef.current = corrected;
          setFavorites((prev) => {
            if (res.data.favorited) {
              return prev.some((f) => (f._id || f.id) === tourId) ? prev : [...prev, tour];
            }
            return prev.filter((f) => (f._id || f.id) !== tourId);
          });
          notifyDataChanged("favorites");
        }
      } catch {
        rollback(tourId, wasFav);
      }
    },
    [product, rollback],
  );

  return (
    <FavoritesContext.Provider
      value={{
        isFavorited,
        toggleFavorite,
        favoriteIds,
        favorites,
        favoritesCount: favoriteIds.size,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    return {
      isFavorited: () => false,
      toggleFavorite: () => {},
      favoriteIds: new Set(),
      favorites: [],
      favoritesCount: 0,
    };
  return ctx;
}
