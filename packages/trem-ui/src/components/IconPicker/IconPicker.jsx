import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./IconPicker.styles.scss";

export const DEFAULT_ICON_OPTIONS = [
  "compass",
  "destination",
  "map",
  "star",
  "sparkles",
  "mountain",
  "beach",
  "city",
  "hotel",
  "flight",
  "bus",
  "taxi",
  "food",
  "guide",
  "camera",
  "ticket",
  "wallet",
  "shield",
  "insurance",
  "visa",
  "luggage",
  "sun",
].map((value) => ({
  value,
  label: value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
}));

export default function IconPicker({
  value = "",
  options = DEFAULT_ICON_OPTIONS,
  onChange,
  disabled = false,
  readOnly = false,
  ariaLabel = "Choose an icon",
}) {
  const normalized = (options.length ? options : DEFAULT_ICON_OPTIONS)
    .map((option) => (typeof option === "string" ? { value: option, label: option } : option))
    .filter((option) => option?.value);

  return (
    <div
      className="trem-icon-picker"
      role="listbox"
      aria-label={ariaLabel}
      aria-disabled={disabled || readOnly}
    >
      {normalized.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`trem-icon-picker__option${selected ? " is-selected" : ""}`}
            role="option"
            aria-selected={selected}
            aria-label={option.label}
            title={option.label}
            disabled={disabled || readOnly}
            onClick={() => onChange?.(selected ? "" : option.value)}
          >
            <Icon name={option.value} size={18} aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
