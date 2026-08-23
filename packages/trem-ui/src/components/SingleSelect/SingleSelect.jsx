import React, { useMemo } from "react";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./SingleSelect.styles.scss";

export const optionValue = (option) =>
  typeof option === "string" ? option : (option?.value ?? option?.id);

const readableOptionText = (value, fallback = "") => {
  if (value == null) return fallback;
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (Array.isArray(value)) {
    return (
      value
        .map((item) => readableOptionText(item))
        .filter(Boolean)
        .join(", ") || fallback
    );
  }
  if (typeof value === "object") {
    return (
      readableOptionText(value.label ?? value.name ?? value.title) ||
      [value.city, value.country]
        .map((item) => readableOptionText(item))
        .filter(Boolean)
        .join(", ") ||
      fallback
    );
  }
  return fallback;
};

export const optionLabel = (option) => {
  if (typeof option === "string") return option;
  return readableOptionText(option?.label, readableOptionText(optionValue(option)));
};

const normalizeOptions = (options = []) =>
  options.map((o) => ({
    value: String(optionValue(o)),
    label: String(optionLabel(o)),
    disabled: !!o?.disabled,
  }));

export default function SingleSelect({
  label,
  placeholder = "Select...",
  value = "",
  onChange,
  options = [],
  required = false,
  error,
  disabled = false,
  searchable,
  searchPlaceholder = "Search...",
  clearable = false,
  size = "md",
  variant = "outlined",
  maxHeight,
  className = "",
}) {
  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const selected = normalized.find((o) => o.value === String(value)) || null;
  const canSearch = searchable ?? normalized.length > 10;

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.("");
  };

  const trigger = ({ open }) => (
    <Button
      type="button"
      variant="text"
      primaryClassName={`trem-dropdown__select${error ? " trem-dropdown__select--error" : ""}`}
      aria-invalid={!!error}
      aria-label={label}
      disabled={disabled}
    >
      <span className="trem-dropdown__select-inner">
        {label ? (
          <span className="trem-dropdown__select-label">{required ? `${label} *` : label}</span>
        ) : null}
        <span className="trem-dropdown__select-value">
          {selected ? selected.label : placeholder}
        </span>
      </span>
      {clearable && value !== "" && value != null && (
        <span
          role="button"
          tabIndex={-1}
          className="trem-singleselect__clear"
          aria-label="Clear selection"
          onClick={handleClear}
        >
          <Icon name="x" size={14} />
        </span>
      )}
      <Icon
        name="chevronDown"
        className={`trem-dropdown__select-chevron${open ? " is-open" : ""}`}
      />
    </Button>
  );

  return (
    <div
      className={`trem-singleselect trem-singleselect--${variant} trem-singleselect--${size}${className ? ` ${className}` : ""}`}
    >
      <Dropdown
        trigger={trigger}
        items={normalized}
        value={value}
        onChange={(item) => onChange?.(item?.value ?? item?.id)}
        closeOnSelect
        variant={canSearch ? "searchable" : "scrollable"}
        disabled={disabled}
        searchPlaceholder={searchPlaceholder}
        maxHeight={maxHeight}
      />
      {error && <div className="trem-singleselect__error">{error}</div>}
    </div>
  );
}
