import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getRealtimeClient } from "./realtime-client.js";
import { CONNECTION_STATUS } from "./realtime-types.js";

const RealtimeContext = createContext(null);

/**
 * Establishes the single platform realtime connection.
 *
 * - Safe under React Strict Mode (double effects) and microfrontends: the
 *   client is a window-anchored singleton shared by shell and remotes.
 * - Authentication reuses the existing HttpOnly portal cookies; no tokens are
 *   handled in JavaScript.
 * - Listens for the platform auth events to connect/disconnect on login and
 *   logout without ever retrying with expired credentials.
 */
export function RealtimeProvider({ children, enabled = true }) {
  const client = useMemo(() => (enabled ? getRealtimeClient() : null), [enabled]);
  const [status, setStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const [lastEventAt, setLastEventAt] = useState(null);
  const consumersRef = useRef(0);

  useEffect(() => {
    if (!client) return undefined;
    const offStatus = client.onStatusChange(setStatus);
    const socket = client.connect();
    consumersRef.current += 1;

    const onConnected = () => setLastEventAt(Date.now());
    socket?.on("system:connected", onConnected);

    return () => {
      consumersRef.current -= 1;
      socket?.off("system:connected", onConnected);
      offStatus();
      // In dev with StrictMode the effect remounts immediately; the singleton
      // keeps the connection alive across mounts. Full teardown only happens
      // through destroy() below (logout) or app unmount.
    };
  }, [client]);

  useEffect(() => {
    if (!client) {
      setStatus(CONNECTION_STATUS.DISCONNECTED);
      return undefined;
    }
    const onLogout = () => client.destroy();
    window.addEventListener("USER_LOGOUT", onLogout);
    return () => window.removeEventListener("USER_LOGOUT", onLogout);
  }, [client]);

  const value = useMemo(
    () => ({
      status,
      lastEventAt,
      client,
      isConnected: status === CONNECTION_STATUS.CONNECTED,
    }),
    [client, lastEventAt, status],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

export default RealtimeProvider;
