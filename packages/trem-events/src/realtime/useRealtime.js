import { useCallback } from "react";
import { useRealtimeContext } from "./RealtimeProvider.jsx";

/**
 * Access the shared realtime connection.
 *
 * const { subscribe, unsubscribe, client } = useRealtime();
 * useEffect(() => {
 *   let active = true;
 *   subscribe("booking", bookingId).then((result) => {
 *     if (active && !result.ok) console.warn(result.error?.message);
 *   });
 *   return () => { active = false; unsubscribe("booking", bookingId); };
 * }, [bookingId]);
 *
 * Subscriptions are requests only — the backend authorizes each one.
 */
export function useRealtime() {
  const { client } = useRealtimeContext() || {};

  const subscribe = useCallback(
    (resource, id) => {
      if (!client || !resource || !id)
        return Promise.resolve({
          ok: false,
          error: { code: "REALTIME_INTERNAL_ERROR", message: "Realtime is unavailable." },
        });
      return client.subscribe(resource, id);
    },
    [client],
  );

  const unsubscribe = useCallback((resource, id) => client?.unsubscribe(resource, id), [client]);

  return { subscribe, unsubscribe, client };
}

export default useRealtime;
