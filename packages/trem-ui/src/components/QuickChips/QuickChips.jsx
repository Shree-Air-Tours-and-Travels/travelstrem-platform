import React from "react";
import Button from "../Button/Button.jsx";
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
        <Button
          key={f.id}
          variant="outline"
          size="small"
          text={getLabel(f)}
          primaryClassName={`tt-quick-chips__chip${activeId === f.id ? " is-active" : ""}${f.disabled ? " is-disabled" : ""}`}
          disabled={f.disabled}
          onClick={() => !f.disabled && onClick?.(f.id)}
          role="tab"
          aria-pressed={activeId === f.id}
        />
      ))}
    </div>
  );
}
