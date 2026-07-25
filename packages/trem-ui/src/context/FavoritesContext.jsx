import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { fetchData } from "@packages/trem-utils";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const idsRef = useRef(favoriteIds);
  idsRef.current = favoriteIds;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchData("/tours.json/favorites");
        if (cancelled) return;
        if (res?.status === "success") {
          const tours = res.componentData?.data || [];
          setFavoriteIds(new Set(tours.map((t) => t._id || t.id).filter(Boolean)));
        }
      } catch {
        if (!cancelled) setFavoriteIds(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isFavorited = useCallback(
    (tour) => idsRef.current.has(tour?._id || tour?.id),
    [],
  );

  const toggleFavorite = useCallback(async (tour) => {
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
        body: { tourId },
      });
      if (res?.status === "success" && typeof res.data?.favorited === "boolean") {
        const corrected = new Set(idsRef.current);
        if (res.data.favorited) corrected.add(tourId);
        else corrected.delete(tourId);
        setFavoriteIds(corrected);
        idsRef.current = corrected;
      }
    } catch {
      const rollback = new Set(idsRef.current);
      if (wasFav) rollback.add(tourId);
      else rollback.delete(tourId);
      setFavoriteIds(rollback);
      idsRef.current = rollback;
    }
  }, []);

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) return { isFavorited: () => false, toggleFavorite: () => {} };
  return ctx;
}
