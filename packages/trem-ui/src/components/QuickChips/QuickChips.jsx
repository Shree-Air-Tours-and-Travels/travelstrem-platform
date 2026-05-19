import React from "react";
import "./QuickChips.styles.scss";

export default function QuickChips({ filters = [], activeId, onClick, labels = {}, className = "" }) {
  if (!filters.length) return null;

  const getLabel = (f) => {
    if (f.labelRef && labels[f.labelRef]) return labels[f.labelRef];
    return f.label || f.id;
  };

  return (
    <div className={`tt-quick-chips ${className}`} role="tablist" aria-label="Filter by category">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`tt-quick-chips__chip${activeId === f.id ? " is-active" : ""}${f.disabled ? " is-disabled" : ""}`}
          onClick={() => !f.disabled && onClick?.(f.id)}
          disabled={f.disabled}
          aria-pressed={activeId === f.id}
        >
          {getLabel(f)}
        </button>
      ))}
    </div>
  );
}
