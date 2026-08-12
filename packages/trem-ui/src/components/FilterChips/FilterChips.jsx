import React from "react";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./FilterChips.styles.scss";

const displayText = (value, fallback = "Filter") => {
  if (value == null) return fallback;
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (typeof value === "object") {
    return displayText(value.label ?? value.name ?? value.title, "")
      || [value.city, value.country].map((item) => displayText(item, "")).filter(Boolean).join(", ")
      || fallback;
  }
  return fallback;
};

export default function FilterChips({ items = [], onRemove, onClearAll, clearLabel = "Clear all", ariaLabel = "Active filters", className = "" }) {
  if (!items.length) return null;
  return (
    <div className={`trem-filter-chips ${className}`.trim()} role="region" aria-label={ariaLabel}>
      <div className="trem-filter-chips__items">
        {items.map((item) => (
          <Button key={item.id} type="button" variant="outline" size="small" primaryClassName="trem-filter-chips__chip" onClick={() => onRemove?.(item.id)} aria-label={`Remove ${displayText(item.label)} filter`}>
            <span>{displayText(item.label)}</span>
            <Icon name="x" size={12} />
          </Button>
        ))}
      </div>
      {onClearAll ? <Button type="button" variant="text" size="small" onClick={onClearAll} text={clearLabel} /> : null}
    </div>
  );
}
