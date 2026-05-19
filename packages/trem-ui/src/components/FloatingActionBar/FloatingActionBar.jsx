import React, { useEffect, useState } from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import "./FloatingActionBar.styles.scss";

const MOBILE_BP = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
}

export default function FloatingActionBar({
  actions = [],
  align = "stretch",
  error,
  className = "",
  variant = "floating",
  showBg = true,
  borderRadius = true,
  mobileVisible = 2,
  gap = "medium",
  renderOverflow,
  sheetTitle = "More actions",
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const forcedOverflow = mobile ? actions.filter((a) => a.overflowMobile) : [];
  const eligible = actions.filter((a) => !(mobile && a.overflowMobile));
  const maxVisible = mobile ? Math.min(mobileVisible, eligible.length) : eligible.length;
  const visible = eligible.slice(0, maxVisible);
  const overflow = [...eligible.slice(maxVisible), ...forcedOverflow];
  const hasOverflow = overflow.length > 0;

  const handleOverflowClick = (action) => {
    action.onClick?.();
    if (!action.stayOpen) {
      setSheetOpen(false);
    }
  };

  return (
    <>
      <div
        className={`trem-fab 
          ${error ? "trem-fab--has-error" : ""} 
          trem-fab--align-${align} 
          trem-fab--variant-${variant}
          ${showBg ? "trem-fab--has-bg" : "trem-fab--no-bg"}
          ${borderRadius ? "trem-fab--rounded" : "trem-fab--square"}
          trem-fab--gap-${gap}
          ${className}`.trim()}
      >
        {error && (
          <div className="trem-fab__error" role="alert">
            {error}
          </div>
        )}
        <div className="trem-fab__inner">
          {visible.map((action, i) => (
            <button
              key={i}
              className={`trem-fab__btn ${action.variant === "primary" ? "trem-fab__btn--primary" : action.variant === "danger" ? "trem-fab__btn--danger" : action.variant === "outline" ? "trem-fab__btn--outline" : "trem-fab__btn--ghost"} ${action.iconOnly ? "trem-fab__btn--icon-only" : ""} ${action.size === "sm" ? "trem-fab__btn--sm" : action.size === "lg" ? "trem-fab__btn--lg" : ""}`}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.iconOnly ? action.label : undefined}
              title={action.iconOnly ? action.label : undefined}
            >
              {action.iconLeft && <Icon name={action.iconLeft} size={action.iconSize || 18} />}
              {!action.iconOnly && <span>{action.label}</span>}
              {action.iconRight && !action.iconLeft && <Icon name={action.iconRight} size={action.iconSize || 18} />}
            </button>
          ))}
          {hasOverflow && (
            <button className="trem-fab__btn trem-fab__btn--more" type="button" onClick={() => setSheetOpen(true)} aria-label="More actions">
              <Icon name="moreVertical" size={18} />
            </button>
          )}
        </div>
      </div>

      {hasOverflow && (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={sheetTitle}>
          {renderOverflow ? (
            <div className="trem-fab__sheet-custom">
              {renderOverflow(overflow)}
            </div>
          ) : (
            <div className="trem-fab__sheet">
              {overflow.map((action, i) => (
                <button
                  key={i}
                  className={`trem-fab__sheet-btn ${action.variant === "primary" ? "trem-fab__sheet-btn--primary" : action.variant === "danger" ? "trem-fab__sheet-btn--danger" : ""}`}
                  type="button"
                  onClick={() => handleOverflowClick(action)}
                  disabled={action.disabled}
                >
                  {action.iconLeft && <Icon name={action.iconLeft} size={18} />}
                  <span>{action.label}</span>
                  {action.iconRight && !action.iconLeft && <Icon name={action.iconRight} size={18} />}
                </button>
              ))}
            </div>
          )}
        </BottomSheet>
      )}
    </>
  );
}
