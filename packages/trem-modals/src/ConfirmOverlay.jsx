import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, BottomSheet } from "@packages/trem-ui";
import "./ConfirmOverlay.styles.scss";

const MOBILE_BP = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
}

export default function ConfirmOverlay({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  note,
  icon,
  confirmLabel = "Proceed",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  className = "",
}) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open || mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, mobile]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  if (mobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title={title}>
        <div className={`trem-confirm ${className}`.trim()}>
          {note && (
            <div className="trem-confirm__note">
              {icon && <Icon name={icon} size={20} />}
              <p>{note}</p>
            </div>
          )}
          <div className="trem-confirm__actions">
            <button className="trem-confirm__btn trem-confirm__btn--cancel" type="button" onClick={onClose}>
              {cancelLabel}
            </button>
            <button className="trem-confirm__btn trem-confirm__btn--confirm" type="button" onClick={onConfirm} disabled={confirmDisabled}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return createPortal(
    <div className={`trem-confirm-overlay ${className}`.trim()}>
      <div className="trem-confirm-overlay__backdrop" onClick={onClose} />
      <div className="trem-confirm-overlay__dialog" role="dialog" aria-modal="true" aria-label={title}>
        <button className="trem-confirm-overlay__close" type="button" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <div className="trem-confirm-overlay__header">
          {icon && <Icon name={icon} size={24} />}
          <h3>{title}</h3>
        </div>
        {note && (
          <div className="trem-confirm-overlay__note">
            <p>{note}</p>
          </div>
        )}
        <div className="trem-confirm-overlay__actions">
          <button className="trem-confirm__btn trem-confirm__btn--cancel" type="button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button className="trem-confirm__btn trem-confirm__btn--confirm" type="button" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
