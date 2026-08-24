import { useEffect, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import { useProductDetailContext } from "../context/ProductDetailContext.js";

const normalizeProductRef = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    const ref = String(value).trim();
    const decoded = (() => {
      try {
        return decodeURIComponent(ref);
      } catch {
        return ref;
      }
    })();
    return decoded === "[object Object]" ? "" : ref;
  }
  if (typeof value === "object") {
    return normalizeProductRef(
      value.slug ||
        value.tourRef ||
        value.tripRef ||
        value.value ||
        value.label ||
        value.name ||
        value.title ||
        value.en ||
        value.default ||
        value._id ||
        value.id,
    );
  }
  return "";
};

export default function useTourDetailWidget(productRef, widgetFile, query = {}) {
  const { apiPrefix } = useProductDetailContext();
  const normalizedProductRef = normalizeProductRef(productRef);
  const queryKey = JSON.stringify(query || {});
  const [state, setState] = useState({
    loading: Boolean(normalizedProductRef && widgetFile),
    error: null,
    widgetData: null,
  });

  useEffect(() => {
    if (!normalizedProductRef || !widgetFile) {
      setState({ loading: false, error: "Missing product reference", widgetData: null });
      return undefined;
    }

    const abortController = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    (async () => {
      const search = new URLSearchParams(
        Object.entries(JSON.parse(queryKey)).filter(([, value]) => value !== "" && value != null),
      ).toString();
      const endpoint = `${apiPrefix}/${encodeURIComponent(normalizedProductRef)}/widgets/${widgetFile}${search ? `?${search}` : ""}`;
      const res = await fetchData(endpoint, { signal: abortController.signal });
      if (abortController.signal.aborted) return;

      if (res?.status === "success" && res.component) {
        setState({ loading: false, error: null, widgetData: res.component });
        return;
      }

      setState({
        loading: false,
        error: res?.message || "Widget data could not load",
        widgetData: res?.component || null,
      });
    })();

    return () => {
      abortController.abort();
    };
  }, [normalizedProductRef, widgetFile, apiPrefix, queryKey]);

  return state;
}
