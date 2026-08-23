/**
 * Realtime notification bridge — the single place where backend realtime
 * envelopes become toasts.
 *
 * Contract:
 * - The backend authors every notification (title/subtitle/status) and ships
 *   it as `notify` on a realtime envelope, or as `notify` on an HTTP response.
 * - This module only forwards: envelope.notify -> TREM_TOAST window event.
 * - trem-ui's <Toaster /> renders the stack; it never composes copy.
 *
 * Usage (once per portal, after RealtimeProvider mounts or alongside it):
 *   useEffect(() => initRealtimeNotifications(), []);
 */

const REALTIME_CLIENT_KEY = "__TREM_REALTIME_CLIENT__";
export const TREM_TOAST_EVENT = "TREM_TOAST";

// Module Federation duplicates this module per bundle; the dedupe registry
// must be shared across copies, so it lives on window next to the toaster's.
const TOASTER_SEEN_KEYS = "__TREM_TOAST_SEEN_KEYS__";
const DEDUPE_WINDOW_MS = 10000;

const seenKeysRegistry = () => {
  if (!window[TOASTER_SEEN_KEYS]) window[TOASTER_SEEN_KEYS] = new Map();
  return window[TOASTER_SEEN_KEYS];
};

/** Events whose `notify` payload is surfaced as a toast. Extendable per app. */
export const DEFAULT_REALTIME_NOTIFY_EVENTS = Object.freeze(["enquiry:created", "enquiry:claimed"]);

const pruneSeenKeys = (now) => {
  const seen = seenKeysRegistry();
  for (const [key, seenAt] of seen) {
    if (now - seenAt >= DEDUPE_WINDOW_MS) seen.delete(key);
  }
  return seen;
};

/**
 * Raises a toast via the window-event contract shared with trem-ui.
 * dedupeKey collapses the same logical notification across channels
 * (e.g. an enquiry's HTTP confirmation + its socket echo to other tabs).
 */
export const showRealtimeToast = ({
  title,
  subtitle = "",
  status = "info",
  durationMs = 6000,
  dedupeKey = null,
} = {}) => {
  if (typeof window === "undefined" || !title) return false;

  const now = Date.now();
  const seen = pruneSeenKeys(now);
  if (dedupeKey) {
    if (now - (seen.get(dedupeKey) || 0) < DEDUPE_WINDOW_MS) return false;
    seen.set(dedupeKey, now);
  }

  window.dispatchEvent(
    new CustomEvent(TREM_TOAST_EVENT, {
      detail: { title: String(title), subtitle: String(subtitle || ""), status, durationMs },
    }),
  );
  return true;
};

let initialized = false;

/**
 * Wires the shared realtime client (window-anchored by @packages/trem-ui)
 * to the toast surface. Safe against Module Federation duplication because
 * the client itself is a window singleton; this wrapper survives reconnects
 * and logout/destroy cycles by intercepting every connect() call.
 */
export function initRealtimeNotifications({ events = DEFAULT_REALTIME_NOTIFY_EVENTS } = {}) {
  if (typeof window === "undefined" || initialized) return () => {};

  let disposed = false;
  let retryTimer = null;
  const boundSockets = new WeakSet();

  const bindSocket = (socket) => {
    if (!socket || typeof socket.on !== "function" || boundSockets.has(socket)) return;
    boundSockets.add(socket);
    events.forEach((eventName) => {
      socket.on(eventName, (envelope) => {
        const notify = envelope && typeof envelope === "object" ? envelope.notify : null;
        if (!notify || !notify.title) return;
        showRealtimeToast({
          title: notify.title,
          subtitle: notify.subtitle,
          status: notify.status,
          durationMs: notify.durationMs,
          // Backend-provided key ties the socket echo to its HTTP twin.
          dedupeKey: notify.dedupeKey || envelope.eventId,
        });
      });
    });
  };

  const attach = () => {
    const client = window[REALTIME_CLIENT_KEY];
    if (!client || typeof client.connect !== "function") return false;

    const originalConnect = client.connect.bind(client);
    client.connect = (...args) => {
      const socket = originalConnect(...args);
      bindSocket(socket);
      return socket;
    };
    bindSocket(typeof client.getSocket === "function" ? client.getSocket() : null);
    try {
      // Ensure a socket exists even when no provider mounted yet; the call is
      // idempotent on the window-anchored singleton.
      bindSocket(originalConnect());
    } catch {
      /* connection failures are handled by the realtime layer */
    }
    return true;
  };

  if (!attach()) {
    retryTimer = setInterval(() => {
      if (disposed || attach()) clearInterval(retryTimer);
    }, 300);
  }
  initialized = true;

  return () => {
    disposed = true;
    if (retryTimer) clearInterval(retryTimer);
  };
}

export default { showRealtimeToast, initRealtimeNotifications, DEFAULT_REALTIME_NOTIFY_EVENTS };
