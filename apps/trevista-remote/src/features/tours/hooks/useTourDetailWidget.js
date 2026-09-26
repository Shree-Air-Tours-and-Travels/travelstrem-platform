import { useEffect, useState } from "react";
import { fetchData } from "@packages/trem-utils";

const normalizeTourRef = (value) => {
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
    return normalizeTourRef(
      value.slug ||
        value.tourRef ||
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

export default function useTourDetailWidget(tourRef, widgetFile) {
  const normalizedTourRef = normalizeTourRef(tourRef);
  const [state, setState] = useState({
    loading: Boolean(normalizedTourRef && widgetFile),
    error: null,
    widgetData: null,
  });

  useEffect(() => {
    if (!normalizedTourRef || !widgetFile) {
      setState({ loading: false, error: "Missing tour reference", widgetData: null });
      return undefined;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    (async () => {
      const endpoint = `/tours.json/${encodeURIComponent(normalizedTourRef)}/widgets/${widgetFile}`;
      const res = await fetchData(endpoint);
      if (cancelled) return;

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
      cancelled = true;
    };
  }, [normalizedTourRef, widgetFile]);

  return state;
}
