import { useEffect, useState } from "react";
import { useRealtimeContext } from "./RealtimeProvider.jsx";
import { CONNECTION_STATUS } from "./realtime-types.js";

/**
 * Connection status for the shared realtime socket.
 * One of: "connecting" | "connected" | "reconnecting" | "disconnected" | "error".
 */
export function useRealtimeStatus() {
  const context = useRealtimeContext();
  const [status, setStatus] = useState(context?.status || CONNECTION_STATUS.DISCONNECTED);

  useEffect(() => {
    if (!context?.client) {
      setStatus(CONNECTION_STATUS.DISCONNECTED);
      return undefined;
    }
    return context.client.onStatusChange(setStatus);
  }, [context?.client]);

  return {
    status,
    isConnected: status === CONNECTION_STATUS.CONNECTED,
    isReconnecting: status === CONNECTION_STATUS.RECONNECTING,
  };
}

export default useRealtimeStatus;
