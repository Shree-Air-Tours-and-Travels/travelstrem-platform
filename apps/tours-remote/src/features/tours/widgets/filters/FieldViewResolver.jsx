// components/Filters/FieldViewResolver.jsx
import React from "react";
import PropTypes from "prop-types";
import { Dropdown, Icon } from "@packages/trem-ui";

export default function FieldViewResolver({
  name,
  field,
  value,
  onInput,
  getOptionList,
  maxGuests = { adults: 10, children: 10, infants: 4 },
  dateRange = {},
  error = null
}) {
  if (!field) return null;

  const type = field.type || "text";
  const label = field.label || name;
  const placeholder = field.placeholder || label;
  const inputValue = value === undefined ? (field.value === undefined ? "" : field.value) : value;
  const describedBy = error ? `${name}-error` : undefined;

  switch (type) {
    case "number": {
      let min = field.min !== undefined ? field.min : 0;
      let max = field.max !== undefined ? field.max : undefined;
      if (name === "adults") {
        min = 1;
        max = maxGuests.adults;
      } else if (name === "children") {
        min = 0;
        max = maxGuests.children;
      } else if (name === "infants") {
        min = 0;
        max = maxGuests.infants;
      } else if (["minPrice", "maxPrice", "minDays", "maxDays", "groupSize", "rating"].includes(name)) {
        min = 0;
      }

      return (
        <div className="fv-wrapper">
          <label className="filters__label" key={name}>
            <span className="filters__labelText">{label}</span>
            <input
              className={`filters__input ${error ? "filters__input--error" : ""}`}
              type="number"
              min={min}
              max={max}
              placeholder={placeholder}
              value={inputValue === "" ? "" : inputValue}
              onChange={onInput(name, "number")}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          </label>
          {error && <div className="filters__fieldError" id={describedBy}>{error}</div>}
        </div>
      );
    }

    case "select": {
      const opts = getOptionList(field) || [];
      const selectedOption = opts.find((o) => String(o.value) === String(inputValue));
      const hasAnyOption = opts.some((o) => String(o.value) === "");

      const items = [
        ...(hasAnyOption ? [] : [{ id: "", label: `Any ${label.toLowerCase()}`, active: inputValue === "" }]),
        ...opts
          .filter((o) => String(o.value) !== "")
          .map((o) => ({
            id: String(o.value),
            label: o.label || o,
            active: String(o.value) === String(inputValue),
            onClick: () => onInput(name, "select")({ target: { value: o.value || "" } }),
          })),
      ];

      return (
        <div className="fv-wrapper">
          <label className="filters__label" key={name}>
            <span className="filters__labelText">{label}</span>
            <Dropdown
              hoverable={false}
              align="left"
              closeOnSelect={true}
              items={items}
              trigger={({ open }) => (
                <button
                  className={`filters__input filters__select-trigger ${error ? "filters__input--error" : ""}`}
                  type="button"
                  aria-invalid={!!error}
                  aria-describedby={describedBy}
                >
                  <span>{selectedOption ? (selectedOption.label || selectedOption.value || selectedOption) : `Any ${label.toLowerCase()}`}</span>
                  <Icon name="chevronDown" className={open ? "is-open" : ""} />
                </button>
              )}
            />
          </label>
          {error && <div className="filters__fieldError" id={describedBy}>{error}</div>}
        </div>
      );
    }

    case "multiselect": {
      const opts = getOptionList(field) || [];
      const selected = Array.isArray(inputValue) ? inputValue.map(String) : [];
      const toggleValue = (optionValue) => {
        const next = selected.includes(String(optionValue))
          ? selected.filter((item) => item !== String(optionValue))
          : [...selected, String(optionValue)];
        onInput(name, "multiselect")(next);
      };

      return (
        <div className="fv-wrapper">
          <div className="filters__label" role="group" aria-describedby={describedBy}>
            <span className="filters__labelText">{label}</span>
            <div className={`filters__chips ${error ? "filters__chips--error" : ""}`}>
              {opts.length ? opts.map((option) => {
                const optionValue = typeof option === "string" ? option : option.value;
                const optionLabel = typeof option === "string" ? option : option.label;
                const isSelected = selected.includes(String(optionValue));

                return (
                  <button
                    key={String(optionValue)}
                    type="button"
                    className={`filters__chip ${isSelected ? "is-selected" : ""}`}
                    onClick={() => toggleValue(optionValue)}
                    aria-pressed={isSelected}
                  >
                    {optionLabel}
                  </button>
                );
              }) : <span className="filters__empty-options">No options yet</span>}
            </div>
          </div>
          {error && <div className="filters__fieldError" id={describedBy}>{error}</div>}
        </div>
      );
    }

    case "date":
      return (
        <div className="fv-wrapper">
          <label className="filters__label" key={name}>
            <span className="filters__labelText">{label}</span>
            <input
              className={`filters__input ${error ? "filters__input--error" : ""}`}
              type="date"
              min={name === "arrivalDate" ? dateRange.earliest || "" : dateRange.earliest || ""}
              max={dateRange.latest || ""}
              value={inputValue || ""}
              onChange={onInput(name, "date")}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          </label>
          {error && <div className="filters__fieldError" id={describedBy}>{error}</div>}
        </div>
      );

    case "checkbox":
      return (
        <div className="fv-wrapper">
          <label className="filters__label filters__checkbox" key={name}>
            <input className={`filters__input ${error ? "filters__input--error" : ""}`} type="checkbox" checked={!!inputValue} onChange={onInput(name, "checkbox")} aria-invalid={!!error} aria-describedby={describedBy} />
            <span className="filters__labelText">{label}</span>
          </label>
          {error && <div className="filters__fieldError" id={describedBy}>{error}</div>}
        </div>
      );

    case "text":
    default:
      return (
        <div className="fv-wrapper">
          <label className="filters__label" key={name}>
            <span className="filters__labelText">{label}</span>
            <input
              className={`filters__input ${name === "search" ? "filters__search" : ""} ${error ? "filters__input--error" : ""}`}
              type="text"
              placeholder={placeholder}
              maxLength={field.maxLength}
              value={inputValue || ""}
              onChange={onInput(name, "text")}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          </label>
          {error && <div className="filters__fieldError" id={describedBy}>{error}</div>}
        </div>
      );
  }
}

FieldViewResolver.propTypes = {
  name: PropTypes.string.isRequired,
  field: PropTypes.object,
  value: PropTypes.any,
  onInput: PropTypes.func.isRequired,
  getOptionList: PropTypes.func.isRequired,
  maxGuests: PropTypes.object,
  dateRange: PropTypes.object,
  error: PropTypes.string
};
