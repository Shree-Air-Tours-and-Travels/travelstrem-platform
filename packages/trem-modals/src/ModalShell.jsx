import React, { useEffect, useState } from "react";
import { BottomSheet } from "@packages/trem-ui";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import "./ModalShell.styles.scss";

export default function ModalShell({
  open = true,
  children,
  className = "",
  dialogClassName = "",
  label,
  labelledBy,
  actions,
  closeOnOutsideClick = false,
  onClose,
}) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (mobile || !open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, mobile]);

  if (!open) return null;

  if (mobile) return (
    <BottomSheet open={open} onClose={onClose} label={label} title={label} actions={actions} closeOnOutsideClick={closeOnOutsideClick}
      className={`trem-modal-sheet ${className}`.trim()}>
      <div className={`trem-modal-sheet__content ${dialogClassName}`.trim()}>{children}</div>
    </BottomSheet>
  );

  const handleBackdropClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (closeOnOutsideClick) onClose?.();
  };

  return createPortal(
    <div className={`trem-modal-shell ${className}`.trim()}>
      <div
        className="trem-modal-shell__backdrop"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      <div
        className={`trem-modal-shell__dialog ${dialogClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={label || undefined}
        aria-labelledby={labelledBy || undefined}
      >
        {children}
        {actions}
      </div>
    </div>,
    document.body,
  );
}

ModalShell.propTypes = {
  open: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  dialogClassName: PropTypes.string,
  label: PropTypes.string,
  labelledBy: PropTypes.string,
  actions: PropTypes.node,
  closeOnOutsideClick: PropTypes.bool,
  onClose: PropTypes.func,
};
