import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./SessionTimeoutModal.styles.scss";

export default function SessionTimeoutModal({ open, onLogin, busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="trem-session-timeout">
      <div className="trem-session-timeout__backdrop" aria-hidden="true" />
      <section
        className="trem-session-timeout__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="trem-session-timeout-title"
        aria-describedby="trem-session-timeout-description"
      >
        <span className="trem-session-timeout__icon" aria-hidden="true">
          <Icon name="clock" size={28} />
        </span>
        <div>
          <span className="trem-session-timeout__eyebrow">Session protection</span>
          <h2 id="trem-session-timeout-title">Your session has timed out</h2>
          <p id="trem-session-timeout-description">
            You were signed out after 15 minutes of inactivity. Log in again to continue securely.
          </p>
        </div>
        <Button
          text={busy ? "Taking you to login…" : "Log in again"}
          iconLeft="login"
          onClick={onLogin}
          disabled={busy}
          autoFocus
        />
      </section>
    </div>,
    document.body,
  );
}
