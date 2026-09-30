import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import Button from "../Button/Button.jsx";
import "./BottomSheet.styles.scss";

export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  label,
  actions,
  className = "",
  variant = "default",
  zIndex,
  closeLabel = "Close",
  closeOnOutsideClick = true,
}) {
  const sheetRef = useRef(null);
  const [stackIndex, setStackIndex] = useState(zIndex ?? 1500);
  useLayoutEffect(() => {
    if (!open) return;
    const layers = [...document.querySelectorAll(".trem-bottom-sheet, .trem-modal-shell")]
      .filter((node) => node !== sheetRef.current);
    setStackIndex(Math.max(zIndex ?? 1500, ...layers.map((node) => (Number(getComputedStyle(node).zIndex) || 0) + 10)));
  }, [open, zIndex]);

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
      const above = [...document.querySelectorAll(".trem-bottom-sheet, .trem-modal-shell")]
        .some((node) => node !== sheetRef.current && Number(getComputedStyle(node).zIndex) > Number(getComputedStyle(sheetRef.current).zIndex));
      if (e.key === "Escape" && !above) onClose?.();
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
      style={{ zIndex: stackIndex }}
    >
      <div className="trem-bottom-sheet__overlay" onClick={handleOverlayClick} aria-hidden />
      <div
        className="trem-bottom-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={label || title || "Bottom sheet"}
      >
        <div className="trem-bottom-sheet__header">
          {title ? (
            <div className="trem-bottom-sheet__title trem-bottom-sheet__title--header">{title}</div>
          ) : (
            <span />
          )}

          <Button
            variant="text"
            isCircular
            iconLeft="menuClose"
            onClick={onClose}
            aria-label={closeLabel}
            primaryClassName="trem-bottom-sheet__close"
          />
        </div>
        <div className="trem-bottom-sheet__body">{children}</div>
        {actions ? <footer className="trem-bottom-sheet__actions">{actions}</footer> : null}
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
  label: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "fullscreen"]),
  zIndex: PropTypes.number,
  closeLabel: PropTypes.string,
  closeOnOutsideClick: PropTypes.bool,
};
