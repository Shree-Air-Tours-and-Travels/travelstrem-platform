import React from "react";
import "./WizardSectionNav.styles.scss";

export default function WizardSectionNav({ items = [], activeId, onChange, ariaLabel = "Form sections" }) {
  if (!items.length) return null;
  return <nav className="wizard-section-nav" aria-label={ariaLabel}>
    {items.map((item, index) => <button
      type="button"
      key={item.id}
      className={`wizard-section-nav__item${item.id === activeId ? " is-active" : ""}${item.complete ? " is-complete" : ""}`}
      aria-current={item.id === activeId ? "step" : undefined}
      onClick={() => onChange?.(item.id, index)}
    >
      <span>{item.indexLabel || index + 1}</span>
      <strong>{item.label}</strong>
    </button>)}
  </nav>;
}
