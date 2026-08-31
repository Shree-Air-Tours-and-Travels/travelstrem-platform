import React, { useEffect } from "react";
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
  closeOnOutsideClick = false,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
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
  }, [onClose, open]);

  if (!open) return null;

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
  closeOnOutsideClick: PropTypes.bool,
  onClose: PropTypes.func,
};
