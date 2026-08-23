import { useEffect, useRef } from "react";
import useRealtime from "./useRealtime.js";

/**
 * Domain convenience hook: requests a backend-authorized resource
 * subscription and releases it when deps change/unmount.
 *
 * const { subscribe } = useRealtime();          // low-level API
 * useBookingRealtime(bookingId);                // or domain shorthand below:
 * useResourceRealtime("booking", bookingId);
 *
 * Pair with useRealtimeEvent("booking:status-changed", ...) to react to the
 * events flowing for subscribed resources.
 */
export function useResourceRealtime(resource, id, { onResult } = {}) {
  const { subscribe, unsubscribe } = useRealtime();
  const enabled = Boolean(resource && id);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    subscribe(resource, id).then((result) => {
      if (active && result?.ok === false && result.error) {
        console.warn(
          `[Realtime] ${resource} subscription rejected:`,
          result.error.message || result.error.code,
        );
      }
      if (active) onResultRef.current?.(result);
    });
    return () => {
      active = false;
      unsubscribe(resource, id);
    };
  }, [enabled, id, resource, subscribe, unsubscribe]);
}

export default useResourceRealtime;
