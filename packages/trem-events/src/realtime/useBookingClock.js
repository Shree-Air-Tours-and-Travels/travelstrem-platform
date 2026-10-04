import { useEffect, useState } from "react";
import { useRealtimeContext } from "./RealtimeProvider.jsx";
import { useRealtimeEvent } from "./useRealtimeEvent.js";
import { REALTIME_EVENTS } from "./realtime-types.js";

export function useBookingClock({ enquiryId, paymentSessionId, initial }) {
  const { isConnected } = useRealtimeContext() || {};
  const [snapshot, setSnapshot] = useState(initial);
  const [fresh, setFresh] = useState(false);
  useEffect(() => { setSnapshot(initial); setFresh(false); }, [initial, enquiryId, paymentSessionId]);
  useRealtimeEvent(REALTIME_EVENTS.BOOKING_CLOCK, ({ data }) => {
    if (!(enquiryId && data?.enquiryId === enquiryId) && !(paymentSessionId && data?.paymentSessionId === paymentSessionId)) return;
    setSnapshot(current => current?.serverTime > data.serverTime ? current : data);
    setFresh(true);
  });
  useEffect(() => {
    if (!fresh) return;
    const timeout = setTimeout(() => setFresh(false), 5000);
    return () => clearTimeout(timeout);
  }, [snapshot, fresh]);
  return { remainingSeconds: snapshot?.remainingSeconds ?? null, expired: Boolean(snapshot?.expired), synced: Boolean(isConnected && fresh) };
}
