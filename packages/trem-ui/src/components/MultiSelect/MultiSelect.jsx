import React, { useMemo } from "react";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import { optionValue, optionLabel } from "../SingleSelect/SingleSelect.jsx";
import "./MultiSelect.styles.scss";

export default function MultiSelect({
  label,
  placeholder = "Select options...",
  value = [],
  onChange,
  options = [],
  required = false,
  error,
  disabled = false,
  searchable,
  searchPlaceholder = "Search...",
  size = "md",
  variant = "outlined",
  maxSelected,
  maxDisplayChips = 2,
  selectAllLabel = "Select all",
  clearAllLabel = "Clear",
  emptyLabel = "No options",
  maxHeight,
  className = "",
}) {
  const normalized = useMemo(
    () => (options || []).map((o) => ({
      value: String(optionValue(o)),
      label: String(optionLabel(o)),
      disabled: !!o?.disabled,
    })),
    [options]
  );

  const selectedKeys = useMemo(() => {
    const set = new Set();
    (value || []).forEach((v) => set.add(String(v)));
    return set;
  }, [value]);

  const allSelected = normalized.length > 0 && selectedKeys.size === normalized.length;

  const toggle = (key) => {
    if (disabled) return;
    const has = selectedKeys.has(key);
    if (!has && maxSelected != null && selectedKeys.size >= maxSelected) return;
    const next = has
      ? (value || []).filter((v) => String(v) !== key)
      : [...(value || []), key];
    onChange?.(next);
  };

  const items = normalized.map((o) => ({
    ...o,
    onClick: () => toggle(o.value),
  }));

  const selectedLabels = normalized.filter((o) => selectedKeys.has(o.value));
  const visibleChips = selectedLabels.slice(0, maxDisplayChips);
  const overflowCount = selectedLabels.length - visibleChips.length;
  const canSearch = searchable ?? normalized.length > 10;

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
          <span className="trem-dropdown__select-label">
            {required ? `${label} *` : label}
          </span>
        ) : null}
        <span className="trem-multiselect__selection">
          {selectedLabels.length === 0 ? (
            <span className="trem-multiselect__placeholder">{placeholder}</span>
          ) : (
            <>
              {visibleChips.map((item) => (
                <span
                  key={item.value}
                  className="trem-multiselect__chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(item.value);
                  }}
                >
                  {item.label}
                  <Icon name="x" size={11} />
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="trem-multiselect__more">+{overflowCount}</span>
              )}
            </>
          )}
        </span>
      </span>
      {selectedLabels.length > 0 && (
        <span className="trem-multiselect__count">{selectedLabels.length}</span>
      )}
      <Icon
        name="chevronDown"
        className={`trem-dropdown__select-chevron${open ? " is-open" : ""}`}
      />
    </Button>
  );

  const renderItem = (item) => {
    const checked = selectedKeys.has(item.value);
    return (
      <button
        type="button"
        role="option"
        aria-selected={checked}
        className={`trem-multiselect__option${checked ? " is-selected" : ""}${item.disabled ? " is-disabled" : ""}`}
        disabled={item.disabled}
        onClick={() => toggle(item.value)}
      >
        <span className={`trem-multiselect__checkbox${checked ? " is-checked" : ""}`}>
          {checked && <Icon name="check" size={12} />}
        </span>
        <span className="trem-multiselect__option-label">{item.label}</span>
      </button>
    );
  };

  const menuFooter = normalized.length === 0 ? (
    <div className="trem-multiselect__footer trem-multiselect__footer--empty">{emptyLabel}</div>
  ) : (
    <div className="trem-multiselect__footer">
      <Button
        type="button"
        variant="text"
        size="extra-small"
        primaryClassName="trem-multiselect__footer-btn"
        disabled={disabled || allSelected || normalized.length === 0}
        onClick={() => onChange?.(normalized.map((o) => o.value))}
      >
        {selectAllLabel}
      </Button>
      {selectedKeys.size > 0 && (
        <Button
          type="button"
          variant="text"
          size="extra-small"
          color="danger"
          primaryClassName="trem-multiselect__footer-btn"
          disabled={disabled}
          onClick={() => onChange?.([])}
        >
          {clearAllLabel}
        </Button>
      )}
    </div>
  );

  return (
    <div className={`trem-multiselect trem-multiselect--${variant} trem-multiselect--${size}${className ? ` ${className}` : ""}`}>
      <Dropdown
        trigger={trigger}
        items={items}
        renderItem={renderItem}
        menuFooter={menuFooter}
        variant={canSearch ? "searchable" : "scrollable"}
        closeOnSelect={false}
        hoverable={false}
        disabled={disabled}
        searchPlaceholder={searchPlaceholder}
        maxHeight={maxHeight}
      />
      {error && <div className="trem-multiselect__error">{error}</div>}
    </div>
  );
}
