import { io } from "socket.io-client";
import { CONNECTION_STATUS } from "./realtime-types.js";

/**
 * Singleton Socket.IO client for every TravelsTREM frontend.
 *
 * Module Federation aliases @packages/trem-ui to source in both the shell and
 * each remote bundle, so a plain module-level singleton would be duplicated
 * per bundle. The client is therefore anchored on window.__TREM_REALTIME__ —
 * shell and remotes always share exactly one socket connection.
 */

const GLOBAL_KEY = "__TREM_REALTIME_CLIENT__";

/** Derives the realtime endpoint from existing API env config. */
export const resolveRealtimeUrl = () => {
  if (process.env.REACT_APP_REALTIME_URL) {
    return String(process.env.REACT_APP_REALTIME_URL).replace(/\/$/, "");
  }
  const base =
    process.env.REACT_APP_BACKEND_URL ||
    (process.env.REACT_APP_API_URL
      ? String(process.env.REACT_APP_API_URL).replace(/\/api\/?$/, "")
      : "");
  return base ? base.replace(/\/$/, "") : window.location.origin;
};

const createRealtimeClient = () => {
  let socket = null;
  let status = CONNECTION_STATUS.DISCONNECTED;
  const statusListeners = new Set();

  const setStatus = (next) => {
    if (status === next) return;
    status = next;
    statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch {
        /* listener errors are isolated */
      }
    });
  };

  const portalScope = () => {
    const explicit = String(window.__TREM_AUTH_PORTAL__ || "")
      .trim()
      .toLowerCase();
    if (["admin", "partner", "customer"].includes(explicit)) return explicit;
    const prefix = String(window.__TREM_AUTH_STORAGE_PREFIX__ || "").toLowerCase();
    if (prefix.includes("admin")) return "admin";
    if (prefix.includes("agent") || prefix.includes("partner")) return "partner";
    return "customer";
  };

  const buildSocket = () => {
    const nextSocket = io(resolveRealtimeUrl(), {
      path: process.env.REACT_APP_REALTIME_PATH || "/socket.io",
      // Session travels via the existing HttpOnly portal cookies; the portal
      // scope selects which cookie the backend reads during the handshake.
      withCredentials: true,
      auth: { portal: portalScope() },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.5,
      timeout: 10000,
    });

    nextSocket.on("connect", () => setStatus(CONNECTION_STATUS.CONNECTED));
    nextSocket.io.on("reconnect_attempt", () => setStatus(CONNECTION_STATUS.RECONNECTING));
    nextSocket.on("disconnect", (reason) => {
      setStatus(
        reason === "io server disconnect"
          ? CONNECTION_STATUS.DISCONNECTED
          : CONNECTION_STATUS.RECONNECTING,
      );
    });
    nextSocket.on("connect_error", () => setStatus(CONNECTION_STATUS.ERROR));
    return nextSocket;
  };

  return {
    /** Connects once; subsequent calls reuse the same socket. */
    connect() {
      if (!socket) socket = buildSocket();
      if (socket.disconnected) socket.connect();
      return socket;
    },

    getSocket() {
      return socket;
    },

    getStatus() {
      return status;
    },

    onStatusChange(listener) {
      statusListeners.add(listener);
      listener(status);
      return () => statusListeners.delete(listener);
    },

    /**
     * Requests a backend-authorized resource subscription. Returns the ack
     * result: { ok: true } | { ok: false, error }.
     */
    subscribe(resource, id) {
      if (!socket || socket.disconnected)
        return Promise.resolve({
          ok: false,
          error: { code: "REALTIME_INTERNAL_ERROR", message: "Not connected." },
        });
      return new Promise((resolve) => {
        socket
          .timeout(5000)
          .emit(`${resource}:subscribe`, { resource, id }, (timeoutError, response) => {
            if (timeoutError)
              return resolve({
                ok: false,
                error: {
                  code: "REALTIME_INTERNAL_ERROR",
                  message: "Subscription request timed out.",
                },
              });
            resolve(
              response && typeof response === "object"
                ? response
                : {
                    ok: false,
                    error: { code: "REALTIME_INTERNAL_ERROR", message: "Invalid acknowledgement." },
                  },
            );
          });
      });
    },

    unsubscribe(resource, id) {
      if (!socket || socket.disconnected) return;
      socket.emit(`${resource}:unsubscribe`, { resource, id });
    },

    /** Tears everything down (logout / provider unmount of last consumer). */
    destroy() {
      statusListeners.clear();
      if (!socket) return;
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      setStatus(CONNECTION_STATUS.DISCONNECTED);
    },
  };
};

/** Shared singleton across shell + remotes. */
export const getRealtimeClient = () => {
  if (typeof window === "undefined") return createRealtimeClient();
  if (!window[GLOBAL_KEY]) window[GLOBAL_KEY] = createRealtimeClient();
  return window[GLOBAL_KEY];
};

export default getRealtimeClient;
