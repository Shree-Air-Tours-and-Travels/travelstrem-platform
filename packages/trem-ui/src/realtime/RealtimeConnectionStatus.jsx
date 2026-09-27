import React, { useMemo } from "react";
import { useRealtimeStatus } from "@packages/trem-events";

/**
 * Generic connection status pill. Contains no TravelsTREM business logic —
 * drop it into any header/sidebar. Styling follows the shared design tokens.
 */
export function RealtimeConnectionStatus({ labels = {}, className = "" }) {
  const { status } = useRealtimeStatus();
  const textByStatus = useMemo(
    () => ({
      connected: labels.connected || "Live",
      connecting: labels.connecting || "Connecting…",
      reconnecting: labels.reconnecting || "Reconnecting…",
      disconnected: labels.disconnected || "Offline",
      error: labels.error || "Connection error",
    }),
    [labels],
  );

  return (
    <span
      className={`trem-realtime-status trem-realtime-status--${status} ${className}`.trim()}
      role="status"
      aria-live="polite"
      title={textByStatus[status] || status}
    >
      <span className="trem-realtime-status__dot" aria-hidden="true" />
      <span className="trem-realtime-status__label">{textByStatus[status] || status}</span>
    </span>
  );
}

/** Minimal pulsing dot indicator for toolbars/cards. */
export function LiveIndicator({ className = "" }) {
  const { isConnected } = useRealtimeStatus();
  return (
    <span
      className={`trem-live-indicator${isConnected ? " trem-live-indicator--live" : ""} ${className}`.trim()}
      role="img"
      aria-label={isConnected ? "Live updates active" : "Live updates inactive"}
    />
  );
}

export default RealtimeConnectionStatus;
