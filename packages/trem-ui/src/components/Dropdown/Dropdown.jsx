import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Dropdown.styles.scss";

export default function Dropdown({
  trigger,
  items = [],
  isActive = false,
  align = "left",
  closeOnSelect = true,
  hoverable = true,
  className = "",
  menuClassName = "",
  onToggle,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen((s) => {
      const next = !s;
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  const handleItemClick = useCallback((item) => {
    if (item?.disabled) return;
    item.onClick?.();
    if (closeOnSelect) setOpen(false);
  }, [closeOnSelect]);

  const triggerEl = typeof trigger === "function" ? trigger({ open, isActive }) : trigger;

  return (
    <div
      className={`trem-dropdown ${open ? "is-open" : ""} ${hoverable ? "is-hoverable" : ""} ${isActive ? "is-active-trigger" : ""} align-${align} ${className}`.trim()}
      ref={wrapperRef}
    >
      <div className="trem-dropdown__trigger" onClick={handleToggle} role="button" tabIndex={0} aria-expanded={open}>
        {triggerEl}
      </div>
      <ul className={`trem-dropdown__menu ${menuClassName}`.trim()} role="menu">
        {items.map((item, index) => (
          <li key={item.key || item.id || index} role="none">
            {item.separator ? (
              <hr className="trem-dropdown__separator" />
            ) : (
              <button
                type="button"
                className={`trem-dropdown__item${item.active ? " is-active" : ""}${item.disabled ? " is-disabled" : ""}`}
                disabled={item.disabled}
                role="menuitem"
                onClick={() => handleItemClick(item)}
              >
                {item.icon && <span className="trem-dropdown__item-icon">{item.icon}</span>}
                <span className="trem-dropdown__item-label">{item.label}</span>
                {item.badge != null && <span className="trem-dropdown__item-badge">{item.badge}</span>}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
