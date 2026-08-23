// components/Filters/FieldViewResolver.jsx
import React from "react";
import PropTypes from "prop-types";
import { DatePicker, InputField, MultiSelect, SingleSelect } from "@packages/trem-ui";

export default function FieldViewResolver({
  name,
  field,
  value,
  onInput,
  getOptionList,
  maxGuests = { adults: 10, children: 10, infants: 4 },
  dateRange = {},
  error = null,
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
      } else if (["minPrice", "maxPrice", "rating"].includes(name)) {
        min = 0;
      } else if (["minDays", "maxDays", "travellers", "groupSize"].includes(name)) {
        min = 1;
      }

      return (
        <div className="fv-wrapper">
          <InputField
            variant="number"
            label={label}
            placeholder={placeholder}
            value={inputValue === "" ? "" : inputValue}
            onChange={onInput(name, "number")}
            min={min}
            max={max}
            error={error || undefined}
          />
          {error && (
            <div className="filters__fieldError" id={describedBy}>
              {error}
            </div>
          )}
        </div>
      );
    }

    case "select": {
      const opts = getOptionList(field) || [];
      const hasAnyOption = opts.some((o) => String(o.value) === "");

      const items = [
        ...(hasAnyOption ? [] : [{ id: "", label: `Any ${label.toLowerCase()}`, value: "" }]),
        ...opts
          .filter((o) => String(o.value) !== "")
          .map((o) => ({
            id: String(o.value),
            value: o.value,
            label: o.label || o,
            onClick: () => onInput(name, "select")({ target: { value: o.value || "" } }),
          })),
      ];

      return (
        <div className="fv-wrapper">
          <SingleSelect
            label={label}
            placeholder={`Any ${label.toLowerCase()}`}
            value={inputValue}
            options={items}
            onChange={(next) => onInput(name, "select")(next)}
            error={error || undefined}
          />
          {error && (
            <div className="filters__fieldError" id={describedBy}>
              {error}
            </div>
          )}
        </div>
      );
    }

    case "multiselect": {
      const opts = getOptionList(field) || [];
      const selected = Array.isArray(inputValue) ? inputValue.map(String) : [];

      return (
        <div className="fv-wrapper">
          <MultiSelect
            label={label}
            placeholder={`Any ${label.toLowerCase()}`}
            value={selected}
            options={opts}
            onChange={(next) => onInput(name, "multiselect")(next)}
            searchable
            error={error || undefined}
          />
          {error && (
            <div className="filters__fieldError" id={describedBy}>
              {error}
            </div>
          )}
        </div>
      );
    }

    case "date":
      return (
        <div className="fv-wrapper">
          <label className="filters__label" key={name}>
            <span className="filters__labelText">{label}</span>
            <DatePicker
              min={dateRange.earliest || ""}
              max={dateRange.latest || ""}
              value={inputValue || ""}
              onChange={(next) => onInput(name, "date")(next)}
              placeholder={`Select ${label.toLowerCase()}`}
              error={error || undefined}
            />
          </label>
          {error && (
            <div className="filters__fieldError" id={describedBy}>
              {error}
            </div>
          )}
        </div>
      );

    case "checkbox":
      return (
        <div className="fv-wrapper">
          <label className="filters__label filters__checkbox" key={name}>
            <input
              className={`filters__input ${error ? "filters__input--error" : ""}`}
              type="checkbox"
              checked={!!inputValue}
              onChange={onInput(name, "checkbox")}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
            <span className="filters__labelText">{label}</span>
          </label>
          {error && (
            <div className="filters__fieldError" id={describedBy}>
              {error}
            </div>
          )}
        </div>
      );

    case "text":
    default:
      return (
        <div className="fv-wrapper">
          <InputField
            variant="text"
            label={label}
            placeholder={placeholder}
            maxLength={field.maxLength}
            value={inputValue || ""}
            onChange={onInput(name, "text")}
            error={error || undefined}
          />
          {error && (
            <div className="filters__fieldError" id={describedBy}>
              {error}
            </div>
          )}
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
  error: PropTypes.string,
};
