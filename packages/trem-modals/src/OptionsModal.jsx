import React, { useEffect, useState } from "react";
import { Button, Icon, BottomSheet } from "@packages/trem-ui";
import ModalShell from "./ModalShell.jsx";
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
  selectedLabel = "Selected",
  confirmLabel = "Apply selection",
  cancelLabel = "Cancel",
  closeLabel = "Close",
  selectedValue = "",
  onConfirm,
  className = "",
  closeOnOutsideClick = false,
}) {
  const [mobile, setMobile] = useState(false);
  const [draftValue, setDraftValue] = useState(selectedValue);
  const selectable = typeof onConfirm === "function";

  useEffect(() => {
    if (open) setDraftValue(selectedValue);
  }, [open, selectedValue]);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!open) return null;

  const list = (
    <div className="trem-options__list">
      {options.map((option, i) => {
        const optionValue = option.value || option.title || String(i);
        const selected = selectable && draftValue === optionValue;
        const Item = selectable ? "button" : "div";
        return (
        <Item
          key={option.id || optionValue}
          className={`trem-options__item${selected ? " is-selected" : ""}`}
          {...(selectable ? {
            type: "button",
            onClick: () => setDraftValue(optionValue),
            "aria-pressed": selected,
          } : {})}
        >
          <div className="trem-options__item-top">
            <span className="trem-options__badge">
              <Icon name={option.icon || (option.recommended ? "badgeCheck" : "hotel")} size={16} />
            </span>
            <strong className="trem-options__item-title">{option.title}</strong>
            {option.recommended && <span className="trem-options__pill">{recommendedLabel}</span>}
            {selected && <span className="trem-options__pill trem-options__pill--selected">{selectedLabel}</span>}
          </div>
          {option.description && <p className="trem-options__item-desc">{option.description}</p>}
          <div className="trem-options__cost">
            <span className="trem-options__cost-label">{option.costLabel || "Upgrade cost"}</span>
            <span className="trem-options__cost-value">{option.cost}</span>
          </div>
        </Item>
      )})}
    </div>
  );

  const selectionActions = selectable ? (
    <div className="trem-options__actions">
      <Button variant="text" color="primary" text={cancelLabel} onClick={onClose} />
      <Button
        variant="solid"
        color="primary"
        text={confirmLabel}
        disabled={!draftValue}
        onClick={() => onConfirm(options.find((option, index) => (option.value || option.title || String(index)) === draftValue))}
      />
    </div>
  ) : null;

  const content = (
    <div className={`trem-options ${className}`.trim()}>
      {subtitle && <p className="trem-options__subtitle">{subtitle}</p>}
      {list}
      {selectionActions}
    </div>
  );

  if (mobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title={title} closeOnOutsideClick={closeOnOutsideClick}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <ModalShell open={open} className={className} dialogClassName="trem-options-overlay__dialog" label={title} closeOnOutsideClick={closeOnOutsideClick} onClose={onClose}>
        <Button variant="text" isCircular iconLeft="x" onClick={onClose} aria-label={closeLabel} primaryClassName="trem-options-overlay__close" />
        <div className="trem-options-overlay__header">
          <span className="trem-options-overlay__icon">
            <Icon name={icon} size={22} />
          </span>
          <h3>{title}</h3>
        </div>
        {content}
    </ModalShell>
  );
}
