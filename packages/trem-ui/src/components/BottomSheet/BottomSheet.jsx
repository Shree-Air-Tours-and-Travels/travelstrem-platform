import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import Button from "../Button/Button.jsx";
import "./BottomSheet.styles.scss";

export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  className = "",
  variant = "default",
  zIndex,
  closeLabel = "Close",
  closeOnOutsideClick = true,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (closeOnOutsideClick) onClose?.();
  };

  return createPortal(
    <div
      className={`trem-bottom-sheet trem-bottom-sheet--${variant} ${className}`.trim()}
      ref={sheetRef}
      style={zIndex != null ? { zIndex } : undefined}
    >
      <div className="trem-bottom-sheet__overlay" onClick={handleOverlayClick} aria-hidden />
      <div
        className="trem-bottom-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
      >
        <div className="trem-bottom-sheet__header">
          {variant === "fullscreen" && title ? (
            <div className="trem-bottom-sheet__title trem-bottom-sheet__title--header">{title}</div>
          ) : (
            <span />
          )}
          <div className="trem-bottom-sheet__handle" />
          <Button
            variant="text"
            isCircular
            iconLeft="menuClose"
            onClick={onClose}
            aria-label={closeLabel}
            primaryClassName="trem-bottom-sheet__close"
          />
        </div>
        {title && variant !== "fullscreen" ? (
          <div className="trem-bottom-sheet__title">{title}</div>
        ) : null}
        <div className="trem-bottom-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

BottomSheet.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
  title: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "fullscreen"]),
  zIndex: PropTypes.number,
  closeLabel: PropTypes.string,
  closeOnOutsideClick: PropTypes.bool,
};
