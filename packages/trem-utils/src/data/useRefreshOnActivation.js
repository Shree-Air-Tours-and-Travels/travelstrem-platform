import { useCallback, useEffect, useRef } from "react";

export const DATA_CHANGED_EVENT = "trem:data-changed";

export const notifyDataChanged = (resource) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource: String(resource || "") } }));
};

export default function useRefreshOnActivation(refresh, { enabled = true, resource = "", minimumIntervalMs = 750, refreshOnMount = true } = {}) {
  const refreshRef = useRef(refresh);
  const inFlightRef = useRef(false);
  const lastRunRef = useRef(0);
  refreshRef.current = refresh;

  const run = useCallback(() => {
    if (!enabled || inFlightRef.current || typeof refreshRef.current !== "function") return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const now = Date.now();
    if (now - lastRunRef.current < minimumIntervalMs) return;
    lastRunRef.current = now;
    inFlightRef.current = true;
    Promise.resolve()
      .then(() => refreshRef.current())
      .catch(() => undefined)
      .finally(() => { inFlightRef.current = false; });
  }, [enabled, minimumIntervalMs]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    if (refreshOnMount) run();
    const onVisibilityChange = () => { if (document.visibilityState === "visible") run(); };
    const onDataChanged = (event) => {
      const changedResource = String(event?.detail?.resource || "");
      if (!resource || !changedResource || changedResource === resource) run();
    };
    window.addEventListener("focus", run);
    window.addEventListener("pageshow", run);
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", run);
      window.removeEventListener("pageshow", run);
      window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, refreshOnMount, resource, run]);

  return run;
}
