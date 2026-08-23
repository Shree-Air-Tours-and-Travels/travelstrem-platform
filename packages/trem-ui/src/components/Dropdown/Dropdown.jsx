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
  menuTitle,
  menuAriaLabel,
  open: controlledOpen,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const menuWrapperRef = useRef(null);
  const searchRef = useRef(null);

  const isSelect = variant === "select";
  const isJourneyMenu = variant === "journey-menu";
  const open = controlledOpen ?? internalOpen;
  const useBuiltInTrigger = isSelect || !trigger;
  const isAutoWidth = propWidth === "auto";
  const fixedWidth = propWidth != null && !isAutoWidth;
  const autoSearch = items.length > 10;
  const isSearchable = variant === "searchable" || autoSearch;
  const isScrollable =
    isSelect || variant === "scrollable" || variant === "searchable" || autoSearch;
  const showBottomSheet = isMobile() && open;

  const changeOpen = useCallback(
    (next) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
      onToggle?.(next);
    },
    [controlledOpen, onOpenChange, onToggle],
  );

  const selectedItem = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    const key = String(value);
    return (
      items.find(
        (item) => !item.separator && (String(item.value) === key || String(item.id) === key),
      ) || null
    );
  }, [items, value]);

  const menuWidth = useMemo(() => {
    const width = portalWidth ?? propWidth;
    if (width == null || width === "auto") return isJourneyMenu ? 440 : 0;
    return typeof width === "number" ? width : parseInt(width, 10) || 240;
  }, [isJourneyMenu, portalWidth, propWidth]);

  const filteredItems = useMemo(() => {
    const visibleItems = items.filter((item) => !item.hide);
    if (!isSearchable || !search) return visibleItems;
    const q = search.toLowerCase();
    return visibleItems.filter((item) => {
      if (item.separator) return true;
      return (
        (item.label || "").toLowerCase().includes(q) ||
        (item.searchText || "").toLowerCase().includes(q)
      );
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
      w = Math.min(triggerWidth, vw - VIEWPORT_MARGIN * 2);
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
        changeOpen(false);
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
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(e.target)
      ) {
        changeOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, showBottomSheet, isSearchable, filteredItems, changeOpen]);

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
    const next = !open;
    changeOpen(next);
    if (next && wrapperRef.current) {
      requestAnimationFrame(updatePosition);
    }
  }, [changeOpen, disabled, open, updatePosition]);

  const handleItemClick = useCallback(
    (item) => {
      if (item?.disabled) return;
      item.onClick?.();
      onChange?.(item);
      if (closeOnSelect) changeOpen(false);
    },
    [changeOpen, closeOnSelect, onChange],
  );

  const triggerEl = useBuiltInTrigger ? (
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
          {selectedItem ? selectedItem.label || selectedItem.value || placeholder : placeholder}
        </span>
      </span>
      <Icon
        name="chevronDown"
        className={`trem-dropdown__select-chevron${open ? " is-open" : ""}`}
      />
    </Button>
  ) : typeof trigger === "function" ? (
    trigger({ open, isActive })
  ) : (
    trigger
  );
  const accessibleTriggerEl = React.isValidElement(triggerEl)
    ? React.cloneElement(triggerEl, { "aria-expanded": open })
    : triggerEl;

  const resolvedWidth = fixedWidth
    ? typeof propWidth === "number"
      ? `${propWidth}px`
      : propWidth
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

  const resolvedMenuFooter =
    typeof menuFooter === "function"
      ? menuFooter({ close: () => changeOpen(false), open })
      : menuFooter;
  const menuChromeHeight =
    (isSearchable ? 60 : 0) +
    (resolvedMenuFooter ? 56 : 0) +
    (isJourneyMenu && menuTitle ? 52 : 16);
  const positionedListHeight = Math.max(120, (menuStyle.maxHeight || 240) - menuChromeHeight);
  const menuListStyle = {
    maxHeight: propMaxHeight || (isScrollable ? positionedListHeight : undefined),
    overflowY: isScrollable || propMaxHeight ? "auto" : undefined,
  };

  const menuContent = (
    <div
      className={`trem-dropdown__menu-wrapper trem-dropdown__menu-wrapper--matched trem-dropdown__menu-wrapper--${menuStyle.placement || "bottom"} ${portalClassName}`.trim()}
      ref={menuWrapperRef}
      style={menuPositionStyle}
    >
      {isJourneyMenu && menuTitle ? (
        <div className="trem-dropdown__menu-title">{menuTitle}</div>
      ) : null}
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
      <ul
        className={`trem-dropdown__menu ${menuClassName}`.trim()}
        role="menu"
        aria-label={menuAriaLabel}
        style={menuListStyle}
      >
        {filteredItems.map((item, index) =>
          item.separator || !renderItemProp ? (
            renderDefaultItem(item, index)
          ) : (
            <li role="none" key={item.key || item.id || `item-${index}`}>
              {renderItemProp(item, index)}
            </li>
          ),
        )}
      </ul>
      {resolvedMenuFooter}
    </div>
  );

  function renderDefaultItem(item, index) {
    if (item.separator) {
      return (
        <li key={`sep-${index}`}>
          <hr className="trem-dropdown__separator" />
        </li>
      );
    }
    if (isJourneyMenu) {
      return (
        <li key={item.key || item.id || index} role="none">
          <Button
            variant="text"
            primaryClassName={`trem-dropdown__journey-item trem-dropdown__journey-item--${item.tone || "neutral"}${item.disabled ? " is-disabled" : ""}`}
            disabled={item.disabled}
            role="menuitem"
            aria-label={item.ariaLabel || item.label}
            onClick={() => handleItemClick(item)}
          >
            <span className="trem-dropdown__journey-icon" aria-hidden="true">
              {typeof item.icon === "string" ? <Icon name={item.icon} size={30} /> : item.icon}
            </span>
            <span className="trem-dropdown__journey-copy">
              <strong>{item.label}</strong>
              {item.description ? <small>{item.description}</small> : null}
            </span>
            {item.badge ? <span className="trem-dropdown__journey-badge">{item.badge}</span> : null}
            {!item.disabled ? (
              <Icon name="chevronRight" size={22} className="trem-dropdown__journey-chevron" />
            ) : null}
          </Button>
        </li>
      );
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
        <div className="trem-dropdown__trigger" onClick={handleToggle}>
          {accessibleTriggerEl}
        </div>
      </div>
      {open && !showBottomSheet && createPortal(menuContent, document.body)}
      <BottomSheet
        open={showBottomSheet}
        onClose={() => changeOpen(false)}
        className={`${portalClassName}${isJourneyMenu ? " trem-dropdown__journey-sheet" : ""}`.trim()}
        title={menuTitle}
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
        <ul
          className={`trem-dropdown__menu ${menuClassName}`.trim()}
          role="menu"
          aria-label={menuAriaLabel}
        >
          {filteredItems.map((item, index) =>
            item.separator || !renderItemProp ? (
              renderDefaultItem(item, index)
            ) : (
              <li role="none" key={item.key || item.id || `item-${index}`}>
                {renderItemProp(item, index)}
              </li>
            ),
          )}
        </ul>
        {resolvedMenuFooter}
      </BottomSheet>
    </>
  );
}
