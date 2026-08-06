import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../Button/Button.jsx";
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
  portalClassName = "",
  onToggle,
  variant = "default",
  maxHeight: propMaxHeight,
  width: propWidth,
  portalWidth,
  searchPlaceholder = "Search...",
  position = "auto",
  label,
  placeholder = "Select...",
  value,
  onChange,
  error,
  disabled = false,
  renderItem: renderItemProp,
  menuFooter,
  portalZIndex,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const menuWrapperRef = useRef(null);
  const searchRef = useRef(null);

  const isSelect = variant === "select";
  const useBuiltInTrigger = isSelect || !trigger;
  const isAutoWidth = propWidth === "auto";
  const fixedWidth = propWidth != null && !isAutoWidth;
  const autoSearch = items.length > 10;
  const isSearchable = variant === "searchable" || autoSearch;
  const isScrollable = isSelect || variant === "scrollable" || variant === "searchable" || autoSearch;
  const showBottomSheet = isMobile() && open;

  const selectedItem = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    const key = String(value);
    return items.find((item) => !item.separator && (String(item.value) === key || String(item.id) === key)) || null;
  }, [items, value]);

  const menuWidth = useMemo(() => {
    const width = portalWidth ?? propWidth;
    if (width == null || width === "auto") return 0;
    return typeof width === "number" ? width : (parseInt(width, 10) || 240);
  }, [portalWidth, propWidth]);

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
    if (isSearchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, isSearchable]);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const vw = window.innerWidth;
    const triggerWidth = wrapperRef.current.offsetWidth;
    let w = menuWidth;
    if (!w) {
      w = Math.min(triggerWidth, vw - (VIEWPORT_MARGIN * 2));
    }
    const pos = calcPosition(wrapperRef.current, w, position !== "top");
    setMenuStyle({ ...pos, width: w });
  }, [menuWidth, position]);

  useEffect(() => {
    if (!open || showBottomSheet || !wrapperRef.current) return;
    updatePosition();
  }, [open, showBottomSheet, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (isSearchable && e.key === "Enter" && filteredItems.length === 1) {
        const first = filteredItems[0];
        if (!first?.separator && !first?.disabled) {
          handleItemClick(first);
        }
      }
    }
    function onClick(e) {
      if (showBottomSheet) return;
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        menuWrapperRef.current && !menuWrapperRef.current.contains(e.target)
      ) {
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
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, showBottomSheet, updatePosition]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((s) => {
      const next = !s;
      onToggle?.(next);
      if (next && wrapperRef.current) {
        requestAnimationFrame(updatePosition);
      }
      return next;
    });
  }, [onToggle, updatePosition]);

  const handleItemClick = useCallback((item) => {
    if (item?.disabled) return;
    item.onClick?.();
    onChange?.(item);
    if (closeOnSelect) setOpen(false);
  }, [closeOnSelect, onChange]);

  const triggerEl = useBuiltInTrigger
    ? (
      <Button
        type="button"
        variant="text"
        primaryClassName={`trem-dropdown__select${error ? " trem-dropdown__select--error" : ""}`}
        aria-invalid={!!error}
        disabled={disabled}
      >
        <span className="trem-dropdown__select-inner">
          {label ? <span className="trem-dropdown__select-label">{label}</span> : null}
          <span className="trem-dropdown__select-value">
            {selectedItem ? (selectedItem.label || selectedItem.value || placeholder) : placeholder}
          </span>
        </span>
        <Icon name="chevronDown" className={`trem-dropdown__select-chevron${open ? " is-open" : ""}`} />
      </Button>
    )
    : (typeof trigger === "function" ? trigger({ open, isActive }) : trigger);

  const resolvedWidth = fixedWidth
    ? (typeof propWidth === "number" ? `${propWidth}px` : propWidth)
    : undefined;

  const wrapperStyle = useMemo(() => {
    if (propWidth == null) return undefined;
    if (isAutoWidth) {
      return useBuiltInTrigger
        ? { width: "auto", display: "inline-flex", alignSelf: "flex-start" }
        : { width: "auto", alignSelf: "flex-start" };
    }
    return { width: resolvedWidth };
  }, [propWidth, isAutoWidth, resolvedWidth, useBuiltInTrigger]);

  const menuPositionStyle = {
    ...menuStyle,
    ...(resolvedWidth ? { width: resolvedWidth } : {}),
    ...(portalZIndex != null ? { zIndex: portalZIndex } : {}),
  };

  const menuListStyle = {
    maxHeight: propMaxHeight || (isScrollable ? menuStyle.maxHeight || 240 : undefined),
    overflowY: isScrollable || propMaxHeight ? "auto" : undefined,
  };

  const menuContent = (
    <div
      className={`trem-dropdown__menu-wrapper trem-dropdown__menu-wrapper--matched ${portalClassName}`.trim()}
      ref={menuWrapperRef}
      style={menuPositionStyle}
    >
      {isSearchable && (
        <div className="trem-dropdown__search">
          <Icon name="search" />
          <input
            ref={searchRef}
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="trem-dropdown__search-input"
          />
        </div>
      )}
      <ul className={`trem-dropdown__menu ${menuClassName}`.trim()} role="menu" style={menuListStyle}>
        {filteredItems.map((item, index) =>
          item.separator || !renderItemProp
            ? renderDefaultItem(item, index)
            : (
              <li role="none" key={item.key || item.id || `item-${index}`}>
                {renderItemProp(item, index)}
              </li>
            )
        )}
      </ul>
      {menuFooter}
    </div>
  );

  function renderDefaultItem(item, index) {
    if (item.separator) {
      return <li key={`sep-${index}`}><hr className="trem-dropdown__separator" /></li>;
    }
    return (
      <li key={item.key || item.id || index} role="none">
        <Button
          variant="text"
          text={item.label}
          iconLeft={typeof item.icon === "string" ? item.icon : undefined}
          primaryClassName={`trem-dropdown__item${item.active || (isSelect && selectedItem && String(item.value ?? item.id) === String(value)) ? " is-active" : ""}${item.disabled ? " is-disabled" : ""}`}
          disabled={item.disabled}
          role="menuitem"
          onClick={() => handleItemClick(item)}
        />
      </li>
    );
  }

  return (
    <>
      <div
        className={`trem-dropdown ${open ? "is-open" : ""} ${hoverable ? "is-hoverable" : ""} ${isActive ? "is-active-trigger" : ""} ${useBuiltInTrigger ? "trem-dropdown--select" : ""} align-${align} ${className}`.trim()}
        ref={wrapperRef}
        style={wrapperStyle}
      >
        <div className="trem-dropdown__trigger" onClick={handleToggle} role="button" tabIndex={0} aria-expanded={open}>
          {triggerEl}
        </div>
      </div>
      {open && !showBottomSheet && createPortal(menuContent, document.body)}
      <BottomSheet open={showBottomSheet} onClose={() => setOpen(false)} className={portalClassName}>
        {isSearchable && (
          <div className="trem-dropdown__search">
            <Icon name="search" />
            <input
              ref={searchRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="trem-dropdown__search-input"
            />
          </div>
        )}
        <ul className={`trem-dropdown__menu ${menuClassName}`.trim()} role="menu">
          {filteredItems.map((item, index) =>
            item.separator || !renderItemProp
              ? renderDefaultItem(item, index)
              : (
                <li role="none" key={item.key || item.id || `item-${index}`}>
                  {renderItemProp(item, index)}
                </li>
              )
          )}
        </ul>
        {menuFooter}
      </BottomSheet>
    </>
  );
}
