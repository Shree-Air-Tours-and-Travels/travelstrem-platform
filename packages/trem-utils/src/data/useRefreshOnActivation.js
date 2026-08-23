import { useCallback, useEffect, useRef } from "react";

export const DATA_CHANGED_EVENT = "trem:data-changed";

export const notifyDataChanged = (resource) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource: String(resource || "") } }),
  );
};

export default function useRefreshOnActivation(
  refresh,
  {
    enabled = true,
    // Gate for focus/pageshow/visibility refreshes ("clicking around"). When a
    // live websocket already pushes changes, callers pass false to avoid
    // redundant fetches; data-changed events and the mount load stay active.
    activationEnabled = true,
    resource = "",
    minimumIntervalMs = 750,
    refreshOnMount = true,
  } = {},
) {
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
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [enabled, minimumIntervalMs]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    if (refreshOnMount) run();
    const onDataChanged = (event) => {
      const changedResource = String(event?.detail?.resource || "");
      if (!resource || !changedResource || changedResource === resource) run();
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);

    let onVisibilityChange = null;
    const activationWanted = activationEnabled && typeof document !== "undefined";
    const detachActivation = () => {
      window.removeEventListener("focus", run);
      window.removeEventListener("pageshow", run);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    if (activationWanted) {
      onVisibilityChange = () => {
        if (document.visibilityState === "visible") run();
      };
      window.addEventListener("focus", run);
      window.addEventListener("pageshow", run);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
      if (activationWanted) detachActivation();
    };
  }, [activationEnabled, enabled, refreshOnMount, resource, run]);

  return run;
}
