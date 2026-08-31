import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";

import "./Dropdown.styles.scss";

const MENU_GAP = 8;
const VIEWPORT_MARGIN = 12;
const MOBILE_BREAKPOINT = 768;

const DEFAULT_MENU_WIDTH = 260;
const JOURNEY_MENU_WIDTH = 440;

const MIN_MENU_HEIGHT = 120;
const MAX_MENU_HEIGHT = 440;

/* ========================================================================== */
/* Utilities                                                                  */
/* ========================================================================== */

function getIsMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;
}

function useMobileLayout() {
  const [mobile, setMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const update = () => {
      setMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    update();

    window.addEventListener("resize", update, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  return mobile;
}

function toNumericWidth(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMenuPosition(
  triggerElement,
  menuWidth,
  { preferBelow = true, align = "left" } = {},
) {
  if (!triggerElement || typeof window === "undefined") {
    return {
      top: 0,
      left: 0,
      maxHeight: 320,
      placement: "bottom",
    };
  }

  const rect = triggerElement.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN;

  const spaceAbove = rect.top - VIEWPORT_MARGIN;

  const shouldUseTop = (!preferBelow || spaceBelow < 160) && spaceAbove >= 160;

  const placement = shouldUseTop ? "top" : "bottom";

  const top = placement === "top" ? rect.top - MENU_GAP : rect.bottom + MENU_GAP;

  const availableHeight = placement === "top" ? spaceAbove - MENU_GAP : spaceBelow - MENU_GAP;

  const maxHeight = Math.max(MIN_MENU_HEIGHT, Math.min(availableHeight, MAX_MENU_HEIGHT));

  let left = align === "right" ? rect.right - menuWidth : rect.left;

  left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - menuWidth - VIEWPORT_MARGIN));

  return {
    top,
    left,
    maxHeight,
    placement,
  };
}

/* ========================================================================== */
/* Component                                                                  */
/* ========================================================================== */

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
  matchTriggerWidth = false,
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
  const menuId = useId();

  const [internalOpen, setInternalOpen] = useState(false);

  const [menuStyle, setMenuStyle] = useState({});

  const [search, setSearch] = useState("");

  const wrapperRef = useRef(null);
  const menuWrapperRef = useRef(null);
  const searchRef = useRef(null);

  const mobile = useMobileLayout();

  /* ------------------------------------------------------------------------ */
  /* Variant state                                                            */
  /* ------------------------------------------------------------------------ */

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

  const showBottomSheet = mobile && open;

  /* ------------------------------------------------------------------------ */
  /* Open state                                                               */
  /* ------------------------------------------------------------------------ */

  const changeOpen = useCallback(
    (next) => {
      if (disabled && next) return;

      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }

      onOpenChange?.(next);
      onToggle?.(next);
    },
    [controlledOpen, disabled, onOpenChange, onToggle],
  );

  /* ------------------------------------------------------------------------ */
  /* Selected item                                                            */
  /* ------------------------------------------------------------------------ */

  const selectedItem = useMemo(() => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const key = String(value);

    return (
      items.find((item) => {
        if (item?.separator) {
          return false;
        }

        return String(item?.value) === key || String(item?.id) === key;
      }) || null
    );
  }, [items, value]);

  /* ------------------------------------------------------------------------ */
  /* Menu width                                                               */
  /* ------------------------------------------------------------------------ */

  const menuWidth = useMemo(() => {
    const configuredWidth = portalWidth ?? propWidth;

    if (matchTriggerWidth) {
      return 0;
    }

    if (configuredWidth == null || configuredWidth === "auto") {
      if (isJourneyMenu) {
        return JOURNEY_MENU_WIDTH;
      }

      if (isSelect) {
        return 0;
      }

      return DEFAULT_MENU_WIDTH;
    }

    return toNumericWidth(configuredWidth) || DEFAULT_MENU_WIDTH;
  }, [isJourneyMenu, isSelect, matchTriggerWidth, portalWidth, propWidth]);

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredItems = useMemo(() => {
    const visibleItems = (items || []).filter((item) => !item?.hide);

    if (!isSearchable || !search.trim()) {
      return visibleItems;
    }

    const query = search.trim().toLowerCase();

    return visibleItems.filter((item) => {
      if (item?.separator) {
        return true;
      }

      const itemLabel = String(item?.label ?? "").toLowerCase();

      const searchText = String(item?.searchText ?? "").toLowerCase();

      return itemLabel.includes(query) || searchText.includes(query);
    });
  }, [items, search, isSearchable]);

  const actionableFilteredItems = useMemo(
    () => filteredItems.filter((item) => !item?.separator && !item?.disabled),
    [filteredItems],
  );

  /* ------------------------------------------------------------------------ */
  /* Item selection                                                           */
  /* ------------------------------------------------------------------------ */

  const handleItemClick = useCallback(
    (item) => {
      if (!item || item.disabled) {
        return;
      }

      item.onClick?.();

      onChange?.(item);

      if (closeOnSelect) {
        changeOpen(false);
      }
    },
    [changeOpen, closeOnSelect, onChange],
  );

  /* ------------------------------------------------------------------------ */
  /* Search focus                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) {
      setSearch("");
      return undefined;
    }

    if (!isSearchable) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 40);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, isSearchable, showBottomSheet]);

  /* ------------------------------------------------------------------------ */
  /* Positioning                                                              */
  /* ------------------------------------------------------------------------ */

  const updatePosition = useCallback(() => {
    if (typeof window === "undefined" || !wrapperRef.current || showBottomSheet) {
      return;
    }

    const viewportWidth = window.innerWidth;

    const triggerWidth = wrapperRef.current.getBoundingClientRect().width;

    const availableWidth = Math.max(180, viewportWidth - VIEWPORT_MARGIN * 2);

    let calculatedWidth = menuWidth;

    if (!calculatedWidth) {
      calculatedWidth = matchTriggerWidth
        ? triggerWidth
        : Math.max(triggerWidth, isSelect ? triggerWidth : DEFAULT_MENU_WIDTH);
    }

    calculatedWidth = Math.min(calculatedWidth, availableWidth);

    const nextPosition = resolveMenuPosition(wrapperRef.current, calculatedWidth, {
      preferBelow: position !== "top",

      align,
    });

    setMenuStyle({
      ...nextPosition,
      width: calculatedWidth,
    });
  }, [align, isSelect, matchTriggerWidth, menuWidth, position, showBottomSheet]);

  useEffect(() => {
    if (!open || showBottomSheet || !wrapperRef.current) {
      return undefined;
    }

    updatePosition();

    const onScroll = () => updatePosition();

    const onResize = () => updatePosition();

    window.addEventListener("scroll", onScroll, true);

    window.addEventListener("resize", onResize);

    let resizeObserver;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updatePosition);

      resizeObserver.observe(wrapperRef.current);
    }

    return () => {
      window.removeEventListener("scroll", onScroll, true);

      window.removeEventListener("resize", onResize);

      resizeObserver?.disconnect();
    };
  }, [open, showBottomSheet, updatePosition]);

  /* ------------------------------------------------------------------------ */
  /* Keyboard / outside click                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        changeOpen(false);
        return;
      }

      if (isSearchable && event.key === "Enter" && actionableFilteredItems.length === 1) {
        event.preventDefault();

        handleItemClick(actionableFilteredItems[0]);
      }
    };

    const handleOutsideClick = (event) => {
      if (showBottomSheet) {
        return;
      }

      const clickedTrigger = wrapperRef.current?.contains(event.target);

      const clickedMenu = menuWrapperRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        changeOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open, showBottomSheet, isSearchable, actionableFilteredItems, handleItemClick, changeOpen]);

  /* ------------------------------------------------------------------------ */
  /* Trigger                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleToggle = useCallback(() => {
    if (disabled) {
      return;
    }

    const next = !open;

    changeOpen(next);

    if (next && wrapperRef.current && !mobile) {
      requestAnimationFrame(updatePosition);
    }
  }, [changeOpen, disabled, mobile, open, updatePosition]);

  const triggerElement = useBuiltInTrigger ? (
    <Button
      type="button"
      variant="text"
      primaryClassName={[
        "trem-dropdown__select",

        open ? "is-open" : "",

        selectedItem ? "has-value" : "is-placeholder",

        error ? "trem-dropdown__select--error" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={Boolean(error)}
      aria-haspopup="menu"
      disabled={disabled}
    >
      <span className="trem-dropdown__select-inner">
        {label ? <span className="trem-dropdown__select-label">{label}</span> : null}

        <span className="trem-dropdown__select-value">
          {selectedItem ? selectedItem.label || selectedItem.value || placeholder : placeholder}
        </span>
      </span>

      <span className="trem-dropdown__select-chevron-wrap" aria-hidden="true">
        <Icon
          name="chevronDown"
          size={16}
          className={`trem-dropdown__select-chevron${open ? " is-open" : ""}`}
        />
      </span>
    </Button>
  ) : typeof trigger === "function" ? (
    trigger({
      open,
      isActive,
    })
  ) : (
    trigger
  );

  const accessibleTriggerElement = React.isValidElement(triggerElement)
    ? React.cloneElement(triggerElement, {
        "aria-expanded": open,
        "aria-controls": menuId,
        "aria-haspopup": triggerElement.props["aria-haspopup"] || "menu",
      })
    : triggerElement;

  /* ------------------------------------------------------------------------ */
  /* Width                                                                    */
  /* ------------------------------------------------------------------------ */

  const resolvedWidth = fixedWidth
    ? typeof propWidth === "number"
      ? `${propWidth}px`
      : propWidth
    : undefined;

  const wrapperStyle = useMemo(() => {
    if (propWidth == null) {
      return undefined;
    }

    if (isAutoWidth) {
      return useBuiltInTrigger
        ? {
            width: "auto",
            display: "inline-flex",
            alignSelf: "flex-start",
          }
        : {
            width: "auto",
            alignSelf: "flex-start",
          };
    }

    return {
      width: resolvedWidth,
    };
  }, [propWidth, isAutoWidth, resolvedWidth, useBuiltInTrigger]);

  const menuPositionStyle = {
    ...menuStyle,

    ...(resolvedWidth
      ? {
          width: resolvedWidth,
        }
      : {}),

    ...(portalZIndex != null
      ? {
          zIndex: portalZIndex,
        }
      : {}),
  };

  /* ------------------------------------------------------------------------ */
  /* Footer                                                                   */
  /* ------------------------------------------------------------------------ */

  const closeMenu = useCallback(() => changeOpen(false), [changeOpen]);

  const resolvedMenuFooter =
    typeof menuFooter === "function"
      ? menuFooter({
          close: closeMenu,
          open,
        })
      : menuFooter;

  /* ------------------------------------------------------------------------ */
  /* Menu height                                                              */
  /* ------------------------------------------------------------------------ */

  const menuChromeHeight =
    (isSearchable ? 58 : 0) +
    (resolvedMenuFooter ? 56 : 0) +
    (isJourneyMenu && menuTitle ? 50 : 14);

  const positionedListHeight = Math.max(
    MIN_MENU_HEIGHT,
    (menuStyle.maxHeight || 240) - menuChromeHeight,
  );

  const menuListStyle = {
    maxHeight: propMaxHeight || (isScrollable ? positionedListHeight : undefined),

    overflowY: isScrollable || propMaxHeight ? "auto" : undefined,
  };

  /* ------------------------------------------------------------------------ */
  /* Default item renderer                                                    */
  /* ------------------------------------------------------------------------ */

  const renderDefaultItem = (item, index) => {
    if (item.separator) {
      return (
        <li key={`sep-${index}`} role="none">
          <hr className="trem-dropdown__separator" />
        </li>
      );
    }

    const itemKey = item.key || item.id || `item-${index}`;

    if (isJourneyMenu) {
      return (
        <li key={itemKey} role="none">
          <Button
            type="button"
            variant="text"
            primaryClassName={[
              "trem-dropdown__journey-item",

              `trem-dropdown__journey-item--${item.tone || "neutral"}`,

              item.disabled ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={item.disabled}
            role="menuitem"
            aria-label={item.ariaLabel || item.label}
            onClick={() => handleItemClick(item)}
          >
            <span className="trem-dropdown__journey-icon" aria-hidden="true">
              {typeof item.icon === "string" ? <Icon name={item.icon} size={26} /> : item.icon}
            </span>

            <span className="trem-dropdown__journey-copy">
              <strong>{item.label}</strong>

              {item.description ? <small>{item.description}</small> : null}
            </span>

            {item.badge ? <span className="trem-dropdown__journey-badge">{item.badge}</span> : null}

            {!item.disabled ? (
              <Icon name="chevronRight" size={18} className="trem-dropdown__journey-chevron" />
            ) : null}
          </Button>
        </li>
      );
    }

    const selected = Boolean(
      item.active || (isSelect && selectedItem && String(item.value ?? item.id) === String(value)),
    );

    return (
      <li key={itemKey} role="none">
        <Button
          type="button"
          variant="text"
          text={item.label}
          iconLeft={typeof item.icon === "string" ? item.icon : undefined}
          primaryClassName={[
            "trem-dropdown__item",

            selected ? "is-active" : "",

            item.disabled ? "is-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={item.disabled}
          role="menuitem"
          aria-current={selected ? "true" : undefined}
          onClick={() => handleItemClick(item)}
        />
      </li>
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Menu body                                                                */
  /* ------------------------------------------------------------------------ */

  const renderMenuItems = () =>
    filteredItems.map((item, index) => {
      if (item.separator || !renderItemProp) {
        return renderDefaultItem(item, index);
      }

      return (
        <li role="none" key={item.key || item.id || `item-${index}`}>
          {renderItemProp(item, index)}
        </li>
      );
    });

  const resolvedMenuAriaLabel = menuAriaLabel || menuTitle || label || undefined;

  const menuContent = (
    <div
      className={[
        "trem-dropdown__menu-wrapper",

        "trem-dropdown__menu-wrapper--matched",

        `trem-dropdown__menu-wrapper--${menuStyle.placement || "bottom"}`,

        `align-${align}`,

        isJourneyMenu ? "trem-dropdown__menu-wrapper--journey" : "",

        portalClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      ref={menuWrapperRef}
      style={menuPositionStyle}
    >
      {isJourneyMenu && menuTitle ? (
        <div className="trem-dropdown__menu-title">{menuTitle}</div>
      ) : null}

      {isSearchable ? (
        <div className="trem-dropdown__search">
          <Icon name="search" size={16} />

          <input
            ref={searchRef}
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="trem-dropdown__search-input"
            aria-label={searchPlaceholder}
            autoComplete="off"
          />
        </div>
      ) : null}

      <ul
        id={menuId}
        className={["trem-dropdown__menu", menuClassName].filter(Boolean).join(" ")}
        role="menu"
        aria-label={resolvedMenuAriaLabel}
        style={menuListStyle}
      >
        {renderMenuItems()}
      </ul>

      {resolvedMenuFooter}
    </div>
  );

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <div
        className={[
          "trem-dropdown",

          open ? "is-open" : "",

          hoverable ? "is-hoverable" : "",

          isActive ? "is-active-trigger" : "",

          useBuiltInTrigger ? "trem-dropdown--select" : "",

          `align-${align}`,

          className,
        ]
          .filter(Boolean)
          .join(" ")}
        ref={wrapperRef}
        style={wrapperStyle}
      >
        <div className="trem-dropdown__trigger" onClick={handleToggle}>
          {accessibleTriggerElement}
        </div>
      </div>

      {open && !showBottomSheet && typeof document !== "undefined"
        ? createPortal(menuContent, document.body)
        : null}

      <BottomSheet
        open={showBottomSheet}
        onClose={closeMenu}
        zIndex={portalZIndex}
        className={[portalClassName, isJourneyMenu ? "trem-dropdown__journey-sheet" : ""]
          .filter(Boolean)
          .join(" ")}
        title={menuTitle}
      >
        {isSearchable ? (
          <div className="trem-dropdown__search">
            <Icon name="search" size={16} />

            <input
              ref={searchRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="trem-dropdown__search-input"
              aria-label={searchPlaceholder}
              autoComplete="off"
            />
          </div>
        ) : null}

        <ul
          id={menuId}
          className={["trem-dropdown__menu", menuClassName].filter(Boolean).join(" ")}
          role="menu"
          aria-label={resolvedMenuAriaLabel}
        >
          {renderMenuItems()}
        </ul>

        {resolvedMenuFooter}
      </BottomSheet>
    </>
  );
}
