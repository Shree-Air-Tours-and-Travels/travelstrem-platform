import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Dropdown from "../Dropdown/Dropdown.jsx";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import { optionValue, optionLabel } from "../SingleSelect/SingleSelect.jsx";

import "./MultiSelect.styles.scss";

const toStringArray = (values) => (Array.isArray(values) ? values.map((item) => String(item)) : []);

const normalizeMaxSelected = (value) => {
  if (value == null) return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return null;

  return Math.max(0, Math.floor(parsed));
};

const normalizeDisplayCount = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 2;

  return Math.max(0, Math.floor(parsed));
};

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
  applyLabel = "Apply",
  emptyLabel = "No options",
  maxHeight,
  className = "",
}) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;

  /*
   * Normalize options once.
   * Public value contract remains string[].
   */
  const normalized = useMemo(
    () =>
      (Array.isArray(options) ? options : []).map((option) => ({
        value: String(optionValue(option)),
        label: String(optionLabel(option)),
        disabled: Boolean(option?.disabled),
      })),
    [options],
  );

  /*
   * Stable external value.
   *
   * JSON key prevents a parent that recreates the same array on every render
   * from needlessly resetting internal draft state.
   */
  const normalizedValueKey = JSON.stringify(toStringArray(value));

  const normalizedValue = useMemo(() => JSON.parse(normalizedValueKey), [normalizedValueKey]);

  const [draftValue, setDraftValue] = useState(normalizedValue);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectionLimit = useMemo(() => normalizeMaxSelected(maxSelected), [maxSelected]);

  const displayChipLimit = useMemo(() => normalizeDisplayCount(maxDisplayChips), [maxDisplayChips]);

  const selectedKeys = useMemo(() => new Set(normalizedValue), [normalizedValue]);

  const draftKeys = useMemo(() => new Set(draftValue), [draftValue]);

  const disabledKeys = useMemo(
    () => new Set(normalized.filter((option) => option.disabled).map((option) => option.value)),
    [normalized],
  );

  const selectableOptions = useMemo(
    () => normalized.filter((option) => !option.disabled),
    [normalized],
  );

  /*
   * Respect maxSelected when "Select all" is used.
   */
  const selectAllValues = useMemo(() => {
    const values = selectableOptions.map((option) => option.value);

    if (selectionLimit == null) return values;

    return values.slice(0, selectionLimit);
  }, [selectableOptions, selectionLimit]);

  const allSelected =
    selectAllValues.length > 0 && selectAllValues.every((key) => draftKeys.has(key));

  const limitReached = selectionLimit != null && draftValue.length >= selectionLimit;

  /*
   * External value changes should update the control while closed.
   *
   * While open we intentionally preserve draft state until Apply/close.
   */
  useEffect(() => {
    if (!menuOpen) {
      setDraftValue(normalizedValue);
    }
  }, [menuOpen, normalizedValue]);

  const handleToggle = useCallback(
    (open) => {
      setMenuOpen(open);

      /*
       * Every menu session begins from committed external state.
       * Closing without Apply therefore works like Cancel.
       */
      setDraftValue(normalizedValue);
    },
    [normalizedValue],
  );

  const toggle = useCallback(
    (key) => {
      if (disabled || disabledKeys.has(key)) return;

      setDraftValue((current) => {
        const currentKeys = new Set(current);
        const selected = currentKeys.has(key);

        if (selected) {
          return current.filter((item) => item !== key);
        }

        if (selectionLimit != null && current.length >= selectionLimit) {
          return current;
        }

        return [...current, key];
      });
    },
    [disabled, disabledKeys, selectionLimit],
  );

  /*
   * Dropdown still receives item.onClick so keyboard/searchable
   * Dropdown behaviour remains compatible.
   */
  const items = useMemo(
    () =>
      normalized.map((option) => {
        const checked = draftKeys.has(option.value);

        const disabledByLimit = limitReached && !checked && !option.disabled;

        return {
          ...option,

          disabled: option.disabled || disabledByLimit,

          onClick: () => toggle(option.value),
        };
      }),
    [normalized, draftKeys, limitReached, toggle],
  );

  const selectedLabels = useMemo(
    () => normalized.filter((option) => selectedKeys.has(option.value)),
    [normalized, selectedKeys],
  );

  const visibleChips = useMemo(
    () => selectedLabels.slice(0, displayChipLimit),
    [selectedLabels, displayChipLimit],
  );

  const overflowCount = selectedLabels.length - visibleChips.length;

  const canSearch = searchable ?? normalized.length > 10;

  const trigger = ({ open }) => {
    const hasSelection = selectedLabels.length > 0;

    const accessibleLabel = label || placeholder || "Select options";

    return (
      <Button
        type="button"
        variant="text"
        primaryClassName={[
          "trem-dropdown__select",
          open ? "is-open" : "",
          hasSelection ? "has-selection" : "",
          error ? "trem-dropdown__select--error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        aria-expanded={open}
        aria-label={
          hasSelection ? `${accessibleLabel}, ${selectedLabels.length} selected` : accessibleLabel
        }
        disabled={disabled}
      >
        <span className="trem-dropdown__select-inner">
          {label ? (
            <span className="trem-dropdown__select-label">
              <span>{label}</span>

              {required ? (
                <span className="trem-multiselect__required" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
          ) : null}

          <span className="trem-multiselect__selection">
            {!hasSelection ? (
              <span className="trem-multiselect__placeholder">{placeholder}</span>
            ) : (
              <>
                {visibleChips.map((item) => (
                  <span key={item.value} className="trem-multiselect__chip" title={item.label}>
                    {item.label}
                  </span>
                ))}

                {overflowCount > 0 ? (
                  <span
                    className="trem-multiselect__more"
                    aria-label={`${overflowCount} more selected`}
                  >
                    +{overflowCount}
                  </span>
                ) : null}
              </>
            )}
          </span>
        </span>

        {hasSelection ? (
          <span className="trem-multiselect__count" aria-hidden="true">
            {selectedLabels.length}
          </span>
        ) : null}

        <span className="trem-multiselect__chevron-wrap" aria-hidden="true">
          <Icon
            name="chevronDown"
            size={16}
            className={`trem-dropdown__select-chevron${open ? " is-open" : ""}`}
          />
        </span>
      </Button>
    );
  };

  const renderItem = (item) => {
    const checked = draftKeys.has(item.value);

    return (
      <button
        type="button"
        role="option"
        aria-selected={checked}
        aria-disabled={item.disabled}
        className={[
          "trem-multiselect__option",
          checked ? "is-selected" : "",
          item.disabled ? "is-disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={item.disabled}
        onClick={() => toggle(item.value)}
      >
        <span
          className={`trem-multiselect__checkbox${checked ? " is-checked" : ""}`}
          aria-hidden="true"
        >
          {checked ? <Icon name="check" size={12} /> : null}
        </span>

        <span className="trem-multiselect__option-label">{item.label}</span>
      </button>
    );
  };

  const menuFooter =
    normalized.length === 0 ? (
      <div className="trem-multiselect__footer trem-multiselect__footer--empty">
        <span className="trem-multiselect__empty-icon">
          <Icon name="search" size={16} />
        </span>

        <span>{emptyLabel}</span>
      </div>
    ) : (
      ({ close }) => (
        <div className="trem-multiselect__footer">
          <div className="trem-multiselect__footer-tools">
            <Button
              type="button"
              variant="text"
              size="extra-small"
              primaryClassName="trem-multiselect__footer-btn"
              disabled={disabled || allSelected || selectAllValues.length === 0}
              onClick={() => setDraftValue(selectAllValues)}
            >
              {selectAllLabel}
            </Button>

            {draftKeys.size > 0 ? (
              <Button
                type="button"
                variant="text"
                size="extra-small"
                color="danger"
                primaryClassName="trem-multiselect__footer-btn trem-multiselect__footer-btn--clear"
                disabled={disabled}
                onClick={() => setDraftValue([])}
              >
                {clearAllLabel}
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="solid"
            color="primary"
            size="extra-small"
            primaryClassName="trem-multiselect__apply"
            disabled={disabled}
            onClick={() => {
              onChange?.(draftValue);
              close();
            }}
          >
            {applyLabel}
          </Button>
        </div>
      )
    );

  return (
    <div
      className={[
        "trem-multiselect",
        `trem-multiselect--${variant}`,
        `trem-multiselect--${size}`,
        disabled ? "trem-multiselect--disabled" : "",
        error ? "trem-multiselect--error" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Dropdown
        trigger={trigger}
        items={items}
        renderItem={renderItem}
        menuFooter={menuFooter}
        variant={canSearch ? "searchable" : "scrollable"}
        closeOnSelect={false}
        hoverable={false}
        disabled={disabled}
        onToggle={handleToggle}
        searchPlaceholder={searchPlaceholder}
        maxHeight={maxHeight}
        matchTriggerWidth
      />

      {error ? (
        <div className="trem-multiselect__error" id={errorId} role="alert">
          <Icon name="alertTriangle" size={12} />

          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

MultiSelect.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,

  value: PropTypes.array,
  onChange: PropTypes.func,

  options: PropTypes.array,

  required: PropTypes.bool,
  error: PropTypes.node,
  disabled: PropTypes.bool,

  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,

  size: PropTypes.oneOf(["sm", "md", "lg"]),

  variant: PropTypes.oneOf(["outlined", "filled", "underlined"]),

  maxSelected: PropTypes.number,
  maxDisplayChips: PropTypes.number,

  selectAllLabel: PropTypes.string,
  clearAllLabel: PropTypes.string,
  applyLabel: PropTypes.string,
  emptyLabel: PropTypes.string,

  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

  className: PropTypes.string,
};
