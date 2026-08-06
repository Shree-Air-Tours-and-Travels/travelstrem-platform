import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Icon, BottomSheet } from "@packages/trem-ui";
import "./OptionsModal.styles.scss";

const MOBILE_BP = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
}

export default function OptionsModal({
  open,
  onClose,
  title = "Options",
  subtitle,
  icon = "hotel",
  options = [],
  recommendedLabel = "Recommended",
  className = "",
}) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open || mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, mobile]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const list = (
    <div className="trem-options__list">
      {options.map((option, i) => (
        <div key={option.id || i} className="trem-options__item">
          <div className="trem-options__item-top">
            <span className="trem-options__badge">
              <Icon name={option.icon || (option.recommended ? "badgeCheck" : "hotel")} size={16} />
            </span>
            <strong className="trem-options__item-title">{option.title}</strong>
            {option.recommended && <span className="trem-options__pill">{recommendedLabel}</span>}
          </div>
          {option.description && <p className="trem-options__item-desc">{option.description}</p>}
          <div className="trem-options__cost">
            <span className="trem-options__cost-label">{option.costLabel || "Upgrade cost"}</span>
            <span className="trem-options__cost-value">{option.cost}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (mobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title={title}>
        <div className={`trem-options ${className}`.trim()}>
          {subtitle && <p className="trem-options__subtitle">{subtitle}</p>}
          {list}
        </div>
      </BottomSheet>
    );
  }

  return createPortal(
    <div className={`trem-options-overlay ${className}`.trim()}>
      <div className="trem-options-overlay__backdrop" onClick={onClose} />
      <div className="trem-options-overlay__dialog" role="dialog" aria-modal="true" aria-label={title}>
        <Button variant="text" isCircular iconLeft="x" onClick={onClose} aria-label="Close" primaryClassName="trem-options-overlay__close" />
        <div className="trem-options-overlay__header">
          <span className="trem-options-overlay__icon">
            <Icon name={icon} size={22} />
          </span>
          <h3>{title}</h3>
        </div>
        {subtitle && <p className="trem-options-overlay__subtitle">{subtitle}</p>}
        {list}
      </div>
    </div>,
    document.body
  );
}
