import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../../icons/Icon/Icon.jsx";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import "./Dropdown.styles.scss";

const MENU_GAP = 8;
const VIEWPORT_MARGIN = 12;
const MOBILE_BREAKPOINT = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;
}

function calcPosition(triggerEl, menuWidth, preferBelow = true) {
  if (!triggerEl) return { top: 0, left: 0, maxHeight: 320, placement: "bottom" };
  const rect = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const preferBottom = preferBelow && spaceBelow >= 160;
  const preferTop = !preferBelow || spaceBelow < 160;
  let top, maxHeight, placement;
  if (preferTop && spaceAbove >= 160) {
    placement = "top";
    top = rect.top - MENU_GAP;
    maxHeight = Math.min(spaceAbove - MENU_GAP, 440);
  } else {
    placement = "bottom";
    top = rect.bottom + MENU_GAP;
    maxHeight = Math.min(spaceBelow - MENU_GAP, 440);
  }
  maxHeight = Math.max(maxHeight, 120);
  let left = rect.left;
  if (left + menuWidth > vw - VIEWPORT_MARGIN) {
    left = vw - menuWidth - VIEWPORT_MARGIN;
  }
  if (left < VIEWPORT_MARGIN) {
    left = VIEWPORT_MARGIN;
  }
  return { top, left, maxHeight, placement };
}

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
  variant = "default",
  maxHeight: propMaxHeight,
  searchPlaceholder = "Search...",
  position = "auto",
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const isMounted = useRef(false);

  const isSearchable = variant === "searchable";
  const isScrollable = variant === "scrollable" || variant === "searchable";
  const showBottomSheet = isMobile() && open;

  const filteredItems = useMemo(() => {
    if (!isSearchable || !search) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (item.separator) return true;
      return (item.label || "").toLowerCase().includes(q) || (item.searchText || "").toLowerCase().includes(q);
    });
  }, [items, search, isSearchable]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    isMounted.current = true;
    if (isSearchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, isSearchable]);

  useEffect(() => {
    if (!open || showBottomSheet || !wrapperRef.current) return;
    const menuWidth = Math.min(Math.max(wrapperRef.current.offsetWidth, 180), 360);
    const pos = calcPosition(wrapperRef.current, menuWidth, position !== "top");
    setMenuStyle(pos);
  }, [open, showBottomSheet, position]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (isSearchable && (e.key === "Escape" || e.key === "Enter")) {
        if (e.key === "Enter" && filteredItems.length === 1) {
          const first = filteredItems[0];
          if (!first?.separator && !first?.disabled) {
            handleItemClick(first);
          }
        }
        return;
      }
    }
    function onClick(e) {
      if (showBottomSheet) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, showBottomSheet, isSearchable, filteredItems]);

  useEffect(() => {
    if (!open || showBottomSheet) return;
    function onScrollOrResize() {
      if (!wrapperRef.current) return;
      const menuWidth = Math.min(Math.max(wrapperRef.current.offsetWidth, 180), 360);
      const pos = calcPosition(wrapperRef.current, menuWidth, position !== "top");
      setMenuStyle(pos);
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, showBottomSheet, position]);

  const handleToggle = useCallback(() => {
    setOpen((s) => {
      const next = !s;
      onToggle?.(next);
      if (next && wrapperRef.current) {
        requestAnimationFrame(() => {
          const menuWidth = Math.min(Math.max(wrapperRef.current.offsetWidth, 180), 360);
          const pos = calcPosition(wrapperRef.current, menuWidth, position !== "top");
          setMenuStyle(pos);
        });
      }
      return next;
    });
  }, [onToggle, position]);

  const handleItemClick = useCallback((item) => {
    if (item?.disabled) return;
    item.onClick?.();
    if (closeOnSelect) setOpen(false);
  }, [closeOnSelect]);

  const triggerEl = typeof trigger === "function" ? trigger({ open, isActive }) : trigger;

  const menuContent = (
    <ul
      className={`trem-dropdown__menu ${menuClassName}`.trim()}
      role="menu"
      ref={menuRef}
      style={{
        ...menuStyle,
        maxHeight: propMaxHeight || (isScrollable ? menuStyle.maxHeight || 240 : undefined),
        overflowY: isScrollable || propMaxHeight ? "auto" : undefined,
      }}
    >
      {isSearchable && (
        <li className="trem-dropdown__search-item" role="none">
          <div className="trem-dropdown__search">
            <Icon name="search" />
            <input ref={searchRef} type="text" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="trem-dropdown__search-input" />
          </div>
        </li>
      )}
      {filteredItems.map((item, index) => renderItem(item, index))}
    </ul>
  );

  function renderItem(item, index) {
    if (item.separator) {
      return <li key={`sep-${index}`}><hr className="trem-dropdown__separator" /></li>;
    }
    return (
      <li key={item.key || item.id || index} role="none">
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
      </li>
    );
  }

  return (
    <>
      <div
        className={`trem-dropdown ${open ? "is-open" : ""} ${hoverable ? "is-hoverable" : ""} ${isActive ? "is-active-trigger" : ""} align-${align} ${className}`.trim()}
        ref={wrapperRef}
      >
        <div className="trem-dropdown__trigger" onClick={handleToggle} role="button" tabIndex={0} aria-expanded={open}>
          {triggerEl}
        </div>
      </div>
      {open && !showBottomSheet && createPortal(menuContent, document.body)}
      <BottomSheet open={showBottomSheet} onClose={() => setOpen(false)}>
        {isSearchable && (
          <div className="trem-dropdown__search">
            <Icon name="search" />
            <input ref={searchRef} type="text" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="trem-dropdown__search-input" />
          </div>
        )}
        <ul className={`trem-dropdown__menu ${menuClassName}`.trim()} role="menu">
          {filteredItems.map((item, index) => renderItem(item, index))}
        </ul>
      </BottomSheet>
    </>
  );
}
