import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./BottomSheet.styles.scss";

export default function BottomSheet({ open, onClose, children, title, className = "" }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
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

  return createPortal(
    <div className={`trem-bottom-sheet ${className}`.trim()} ref={sheetRef}>
      <div className="trem-bottom-sheet__overlay" onClick={onClose} aria-hidden />
      <div className="trem-bottom-sheet__panel" role="dialog" aria-modal="true" aria-label={title || "Bottom sheet"}>
        <div className="trem-bottom-sheet__header">
          <span />
          <div className="trem-bottom-sheet__handle" />
          <Button variant="text" isCircular iconLeft="menuClose" onClick={onClose} aria-label="Close" primaryClassName="trem-bottom-sheet__close" />
        </div>
        {title && <div className="trem-bottom-sheet__title">{title}</div>}
        <div className="trem-bottom-sheet__body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
