import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchFeaturedHolidayPackages } from "../services/holidayPackages.service";

const EMPTY = [];

export default function useFeaturedHolidayPackages(preloadedPackages = EMPTY) {
  const preloaded = Array.isArray(preloadedPackages) ? preloadedPackages : EMPTY;
  const preloadedKey =
    preloaded.length > 0
      ? preloaded.map((pkg) => pkg._id || pkg.id || "").join("|")
      : "empty";

  const memoPreloaded = useMemo(() => preloaded, [preloadedKey]);

  const [state, setState] = useState(() => ({
    packages: preloaded,
    loading: preloadedKey === "empty",
    error: null,
  }));

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await fetchFeaturedHolidayPackages();
      setState({ packages: result.packages, loading: false, error: null });
    } catch (err) {
      setState((current) => ({
        ...current,
        loading: false,
        error: err.message || "Failed to load featured packages",
      }));
    }
  }, []);

  useEffect(() => {
    if (preloadedKey !== "empty") {
      setState({ packages: memoPreloaded, loading: false, error: null });
      return;
    }
    load();
  }, [preloadedKey, memoPreloaded, load]);

  return {
    packages: state.packages,
    loading: state.loading,
    error: state.error,
    retry: load,
  };
}
