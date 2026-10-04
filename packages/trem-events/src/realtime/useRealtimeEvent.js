import { useEffect, useRef } from "react";
import { useRealtimeContext } from "./RealtimeProvider.jsx";

/**
 * Subscribes a handler to a backend realtime event for the component's
 * lifetime. The handler ref is kept fresh without resubscribing, and the
 * listener is always removed on unmount/dep change.
 *
 * useRealtimeEvent("booking:status-changed", (envelope) => {
 *   queryClient.invalidateQueries({ queryKey: ["booking", envelope.data.bookingId] });
 * });
 */
export function useRealtimeEvent(event, handler) {
  const { client } = useRealtimeContext() || {};
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!client || !event || typeof window === "undefined") return undefined;
    const socket = client.connect();
    if (!socket) return undefined;

    const listener = (envelope) => handlerRef.current?.(envelope);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [client, event]);
}

export default useRealtimeEvent;
