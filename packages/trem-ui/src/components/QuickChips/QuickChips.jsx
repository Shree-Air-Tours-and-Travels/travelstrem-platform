import React from "react";
import Button from "../Button/Button.jsx";
import "./QuickChips.styles.scss";

const displayText = (value, fallback = "") => {
  if (value == null) return fallback;
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (typeof value === "object") {
    return displayText(value.label ?? value.name ?? value.title)
      || [value.city, value.country].map((item) => displayText(item)).filter(Boolean).join(", ")
      || fallback;
  }
  return fallback;
};

export default function QuickChips({ title, filters = [], activeId, onClick, labels = {}, className = "" }) {
  if (!filters.length) return null;

  const getLabel = (f) => {
    if (f.labelRef && labels[f.labelRef]) return displayText(labels[f.labelRef], String(f.id || ""));
    return displayText(f.label, String(f.id || ""));
  };

  return (
    <div className={`tt-quick-chips ${className}`} role="tablist" aria-label={title || "Filter by category"}>
      {title && <div className="tt-quick-chips__title">{title}</div>}
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
