import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Button from "../Button/Button.jsx";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./FloatingActionBar.styles.scss";

// Compact actions are reserved for phones and small tablets. Larger canvases
// have room for every action and do not need an overflow sheet.
const MOBILE_BP = 834;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
}

const ACTION_TYPE_MAP = {
  submit: { variant: "solid", color: "primary", iconRight: "arrowRight" },
  cancel: { variant: "outline", color: "primary", iconLeft: "x" },
  danger: { variant: "solid", color: "danger" },
  back: { variant: "text", color: "primary", iconLeft: "chevronLeft" },
  next: { variant: "solid", color: "primary", iconRight: "chevronRight" },
  save: { variant: "solid", color: "primary", iconLeft: "save" },
  ghost: { variant: "text", color: "primary" },
};

function mapLegacyVariant(variant) {
  const map = {
    primary: { variant: "solid", color: "primary" },
    danger: { variant: "solid", color: "danger" },
    outline: { variant: "outline", color: "primary" },
    ghost: { variant: "text", color: "primary" },
  };
  return map[variant] || { variant: "text", color: "primary" };
}

function resolveActions(structure, text = {}, onAction) {
  if (!structure?.actions) return null;
  return structure.actions.map((action) => {
    const typeStyle = ACTION_TYPE_MAP[action.type] || { variant: "text", color: "primary" };
    const label = text[action.refId] || action.refId || "";
    return {
      label,
      variant: typeStyle.variant,
      color: typeStyle.color,
      iconLeft: action.config?.iconLeft || typeStyle.iconLeft || null,
      iconRight: typeStyle.iconRight || null,
      iconSize: 18,
      disabled: action.config?.disabled || false,
      align: action.config?.alignementOnBar || "left",
      overflowMobile: action.config?.overflowMobile || false,
      stayOpen: action.config?.stayOpen || false,
      onClick: onAction ? () => onAction(action) : undefined,
    };
  });
}

const FloatingActionBar = React.memo(function FloatingActionBar({
  actions = [],
  align = "stretch",
  error,
  className = "",
  variant = "floating",
  showBg = true,
  borderRadius = true,
  mobileVisible = 2,
  gap = "medium",
  hideOnDesktop = false,
  renderOverflow,
  sheetTitle = "More actions",

  structure,
  text,
  floatingNote,
  errorView,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const mobileNavigationRef = useRef(null);
  const floatingActionRef = useRef(null);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const resolved = useMemo(() => {
    if (Array.isArray(actions) && actions.length > 0) {
      return actions.map((a) => {
        const mapped = mapLegacyVariant(a.variant);
        return { ...mapped, ...a, variant: mapped.variant, color: a.color || mapped.color };
      });
    }
    if (structure) {
      return resolveActions(structure, text);
    }
    return [];
  }, [structure, text, actions]);

  const resolvedError = error || (errorView && text?.[errorView.pageLevelError]) || undefined;
  const resolvedNote = floatingNote && text?.[floatingNote.note] ? text[floatingNote.note] : null;

  const legacyAlign = structure ? "left-right" : align;

  const eligible = resolved.filter(
    (action) => action.overflow !== true && !(mobile && action.overflowMobile),
  );
  let visible;
  if (legacyAlign === "left-right" && mobile) {
    const left = eligible.filter((action) => action.align !== "right");
    const right = eligible.filter((action) => action.align === "right");
    const primaryRight =
      right.find((action) => action.primary === true) ||
      [...right]
        .reverse()
        .find((action) => action.variant === "solid" && action.color === "primary") ||
      right[0];
    const visibleRight =
      right.length <= 2
        ? right
        : right.filter(
            (action) => action === primaryRight || action === right.find((item) => item !== primaryRight),
          );
    visible = [...left.slice(0, 1), ...visibleRight];
  } else {
    const maxVisible = mobile ? Math.min(mobileVisible, eligible.length) : eligible.length;
    visible = eligible.slice(0, maxVisible);
  }
  const visibleSet = new Set(visible);
  const overflow = resolved.filter(
    (action) =>
      !visibleSet.has(action) &&
      (action.overflow === true || (mobile && action.overflowMobile) || eligible.includes(action)),
  );
  const hasOverflow = overflow.length > 0;

  const leftActions = visible.filter((a) => a.align !== "right");
  const rightActions = visible.filter((a) => a.align === "right");

  const handleOverflowClick = (action) => {
    action.onClick?.();
    if (!action.stayOpen) {
      setSheetOpen(false);
    }
  };

  useLayoutEffect(() => {
    if (variant !== "mobile-navigation" || !mobileNavigationRef.current) return undefined;
    const panel = mobileNavigationRef.current;
    const layout = panel.closest(".dash-layout--mobile-action-panel");
    if (!layout) return undefined;

    const syncRenderedHeight = () => {
      const height = Math.ceil(panel.getBoundingClientRect().height);
      if (height > 0)
        layout.style.setProperty("--dash-mobile-action-panel-rendered-height", `${height}px`);
    };

    syncRenderedHeight();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(syncRenderedHeight) : null;
    observer?.observe(panel);
    window.addEventListener("resize", syncRenderedHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncRenderedHeight);
      layout.style.removeProperty("--dash-mobile-action-panel-rendered-height");
    };
  }, [resolved.length, variant]);

  useLayoutEffect(() => {
    if (variant !== "floating" || !floatingActionRef.current) return undefined;
    const panel = floatingActionRef.current;
    const root = document.documentElement;

    const syncClearance = () => {
      const rect = panel.getBoundingClientRect();
      if (rect.height <= 0 || !Number.isFinite(rect.top)) return;
      const clearance = Math.max(0, Math.ceil(window.innerHeight - rect.top + 12));
      root.style.setProperty("--trem-floating-action-clearance", `${clearance}px`);
      root.style.setProperty(
        "--trem-floating-action-height",
        `${Math.ceil(rect.height + 12)}px`,
      );
    };

    syncClearance();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(syncClearance) : null;
    observer?.observe(panel);
    const layout = panel.closest(".dash-layout");
    const layoutObserver =
      layout && typeof MutationObserver === "function"
        ? new MutationObserver(syncClearance)
        : null;
    layoutObserver?.observe(layout, { attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", syncClearance);

    return () => {
      observer?.disconnect();
      layoutObserver?.disconnect();
      window.removeEventListener("resize", syncClearance);
      root.style.removeProperty("--trem-floating-action-clearance");
      root.style.removeProperty("--trem-floating-action-height");
    };
  }, [mobile, resolved.length, resolvedError, resolvedNote, variant]);

  if (variant === "mobile-navigation") {
    return (
      <nav
        ref={mobileNavigationRef}
        className={`trem-fab trem-fab--variant-mobile-navigation ${className}`.trim()}
        aria-label={sheetTitle}
      >
        <div className="trem-fab__mobile-nav">
          {resolved.map((action, index) => (
            <Button
              key={action.id || action.label || index}
              variant="text"
              color="primary"
              onClick={action.onClick}
              disabled={action.disabled}
              aria-current={action.active ? "page" : undefined}
              aria-label={action.label}
              primaryClassName={`trem-fab__mobile-nav-item${action.active ? " is-active" : ""}${action.emphasis ? " is-emphasized" : ""}`}
            >
              <span className="trem-fab__mobile-nav-icon" aria-hidden="true">
                {action.iconLeft ? (
                  <Icon name={action.iconLeft} size={action.emphasis ? 24 : 21} />
                ) : null}
              </span>
              <span className="trem-fab__mobile-nav-label">{action.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    );
  }

  const renderButtons = (items) =>
    items.map((action, i) => (
      <Button
        key={i}
        variant={action.variant}
        color={action.color}
        size={action.size || "medium"}
        iconLeft={action.iconLeft}
        iconRight={action.iconRight}
        iconSize={action.iconSize || 18}
        isCircular={!!action.iconOnly}
        onClick={action.onClick}
        disabled={action.disabled}
        text={action.iconOnly ? undefined : action.label}
        aria-label={action.iconOnly ? action.label : undefined}
        title={action.iconOnly ? action.label : undefined}
        primaryClassName="trem-fab__btn"
      />
    ));

  return (
    <>
      <div
        ref={floatingActionRef}
        className={`trem-fab 
          ${resolvedError ? "trem-fab--has-error" : ""} 
          trem-fab--align-${legacyAlign} 
          trem-fab--variant-${variant}
          ${showBg ? "trem-fab--has-bg" : "trem-fab--no-bg"}
          ${borderRadius ? "trem-fab--rounded" : "trem-fab--square"}
          trem-fab--gap-${gap}
          ${resolvedNote ? "trem-fab--has-note" : ""}
          ${hideOnDesktop ? "trem-fab--hide-desktop" : ""}
          ${className}`.trim()}
      >
        {resolvedError && (
          <div className="trem-fab__error" role="alert">
            {resolvedError}
          </div>
        )}
        {resolvedNote && <div className="trem-fab__note">{resolvedNote}</div>}
        <div className="trem-fab__inner">
          {legacyAlign === "left-right" ? (
            <>
              <div className="trem-fab__group trem-fab__group--left">
                {renderButtons(leftActions)}
              </div>
              <div className="trem-fab__group trem-fab__group--right">
                {renderButtons(rightActions)}
                {hasOverflow && (
                  <Button
                    variant="text"
                    size="small"
                    isCircular
                    iconLeft="moreHorizontal"
                    iconSize={18}
                    onClick={() => setSheetOpen(true)}
                    primaryClassName="trem-fab__btn trem-fab__btn--more"
                    aria-label="More actions"
                    title="More actions"
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {renderButtons(visible)}
              {hasOverflow && (
                <Button
                  variant="text"
                  size="small"
                  isCircular
                  iconLeft="moreHorizontal"
                  iconSize={18}
                  onClick={() => setSheetOpen(true)}
                  primaryClassName="trem-fab__btn trem-fab__btn--more"
                  aria-label="More actions"
                />
              )}
            </>
          )}
        </div>
      </div>

      {hasOverflow && (
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheetTitle}
          className="trem-fab__overflow-sheet"
        >
          {renderOverflow ? (
            <div className="trem-fab__sheet-custom">{renderOverflow(overflow)}</div>
          ) : (
            <div className="trem-fab__sheet">
              {overflow.map((action, i) => {
                const sheetVariant =
                  action.variant === "solid" && action.color === "primary"
                    ? "trem-fab__sheet-btn--primary"
                    : action.color === "danger"
                      ? "trem-fab__sheet-btn--danger"
                      : "";
                return (
                  <Button
                    key={i}
                    variant="text"
                    color="primary"
                    iconLeft={action.iconLeft}
                    iconRight={action.iconRight}
                    iconSize={action.iconSize || 18}
                    text={action.label}
                    primaryClassName={`trem-fab__sheet-btn ${sheetVariant}`.trim()}
                    disabled={action.disabled}
                    onClick={() => handleOverflowClick(action)}
                  />
                );
              })}
            </div>
          )}
        </BottomSheet>
      )}
    </>
  );
});

export default FloatingActionBar;
