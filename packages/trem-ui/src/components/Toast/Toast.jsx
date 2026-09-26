import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import Paragraph from "../Paragraph/Paragraph.jsx";
import "./Toast.styles.scss";

/**
 * Backend-driven toast surface built on shared trem-ui primitives.
 * Notification copy (title/subtitle/status) is authored by the backend and
 * arrives either over a realtime envelope (`notify` block) or an HTTP
 * response (`notify` field). This component only renders — it never
 * composes copy.
 *
 * Any package can raise a toast without importing React by dispatching:
 *   window.dispatchEvent(new CustomEvent(TREM_TOAST_EVENT, { detail: notify }))
 * The realtime bridge lives in @packages/trem-events
 * (showRealtimeToast / initRealtimeNotifications).
 */

export const TREM_TOAST_EVENT = "TREM_TOAST";

// Module Federation can embed several portals into ONE document, each with
// its own bundle copy of this module. Both guards therefore live on window:
// - OWNER: exactly one Toaster per document listens/renders.
// - SEEN KEYS: one shared dedupe registry across every bundle copy.
const TOASTER_OWNER_KEY = "__TREM_TOASTER_OWNER__";
const TOASTER_SEEN_KEYS = "__TREM_TOAST_SEEN_KEYS__";
const DEDUPE_WINDOW_MS = 10000;

const seenKeysRegistry = () => {
  if (!window[TOASTER_SEEN_KEYS]) window[TOASTER_SEEN_KEYS] = new Map();
  return window[TOASTER_SEEN_KEYS];
};

const DEFAULT_DURATION_MS = 6000;
const MAX_STACK = 4;

const STATUS_ICON = {
  success: "check",
  error: "alertTriangle",
  warning: "alertTriangle",
  info: "info",
};

let toastSeq = 0;
export const nextToastId = () => `trem-toast-${Date.now()}-${toastSeq++}`;

/** Imperative helper for app code that already has trem-ui available. */
export const showToast = ({
  title,
  subtitle = "",
  status = "info",
  durationMs = DEFAULT_DURATION_MS,
  dedupeKey = null,
}) => {
  if (typeof window === "undefined" || !title) return null;
  const detail = {
    id: nextToastId(),
    title: String(title),
    subtitle,
    status,
    durationMs,
    dedupeKey,
  };
  window.dispatchEvent(new CustomEvent(TREM_TOAST_EVENT, { detail }));
  return detail.id;
};

const normalizeStatus = (value) =>
  ["success", "error", "warning", "info"].includes(value) ? value : "info";

const Toaster = ({ position = "top-right" }) => {
  const [isOwner, setIsOwner] = useState(
    () => typeof window !== "undefined" && !window[TOASTER_OWNER_KEY],
  );
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    // Another Toaster instance already owns this document (embedded remotes).
    if (window[TOASTER_OWNER_KEY]) return undefined;

    window[TOASTER_OWNER_KEY] = true;
    setIsOwner(true);

    const onToast = (event) => {
      const payload = event?.detail || {};
      if (!payload.title) return;

      // Collapse duplicate notifications (HTTP + socket echo of the same
      // backend event) inside a short window. The registry is shared across
      // all Module Federation bundle copies via window.
      if (payload.dedupeKey) {
        const seen = seenKeysRegistry();
        const now = Date.now();
        for (const [key, seenAt] of seen) {
          if (now - seenAt >= DEDUPE_WINDOW_MS) seen.delete(key);
        }
        if (now - (seen.get(payload.dedupeKey) || 0) < DEDUPE_WINDOW_MS) return;
        seen.set(payload.dedupeKey, now);
      }

      const id = payload.id || nextToastId();
      const toast = {
        id,
        title: payload.title,
        subtitle: payload.subtitle || "",
        status: normalizeStatus(payload.status),
      };

      setToasts((current) => [...current.slice(-(MAX_STACK - 1)), toast]);
      timersRef.current.set(
        id,
        setTimeout(
          () => dismiss(id),
          Number(payload.durationMs) > 0 ? Number(payload.durationMs) : DEFAULT_DURATION_MS,
        ),
      );
    };

    window.addEventListener(TREM_TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TREM_TOAST_EVENT, onToast);
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      window[TOASTER_OWNER_KEY] = false;
      setIsOwner(false);
    };
  }, [dismiss]);

  if (!isOwner) return null;

  return (
    <div className={`trem-toaster trem-toaster--${position}`} aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="trem-toast"
          data-status={toast.status}
          role={toast.status === "error" ? "alert" : "status"}
        >
          <span className="trem-toast__icon" aria-hidden="true">
            <Icon name={STATUS_ICON[toast.status] || STATUS_ICON.info} size={13} />
          </span>
          <div className="trem-toast__body">
            <Paragraph variant="muted" primaryClassname="trem-toast__title">
              {toast.title}
            </Paragraph>
            {toast.subtitle ? (
              <Paragraph variant="xsmall" primaryClassname="trem-toast__subtitle">
                {toast.subtitle}
              </Paragraph>
            ) : null}
          </div>
          <Button
            variant="outline"
            color="secondary"
            size="extra-small"
            isCircular
            iconLeft="x"
            iconSize={14}
            primaryClassName="trem-toast__close"
            aria-label="Dismiss notification"
            onClick={() => dismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

Toaster.propTypes = {
  position: PropTypes.oneOf(["top-right", "top-left", "bottom-right", "bottom-left"]),
};

export default Toaster;
