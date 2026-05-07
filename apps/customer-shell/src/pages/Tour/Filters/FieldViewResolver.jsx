// components/Filters/FieldViewResolver.jsx
import React from "react";
import PropTypes from "prop-types";

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
  const inputValue = value === undefined ? (field.value === undefined ? "" : field.value) : value;

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
      } else if (["minPrice", "maxPrice", "minDays", "maxDays"].includes(name)) {
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
              placeholder={label}
              value={inputValue === "" ? "" : inputValue}
              onChange={onInput(name, "number")}
            />
          </label>
          {error && <div className="filters__fieldError">{error}</div>}
        </div>
      );
    }

    case "select": {
      const opts = getOptionList(field) || [];
      const isSimpleStringArray = Array.isArray(opts) && opts.length > 0 && typeof opts[0] === "string";

      return (
        <div className="fv-wrapper">
          <label className="filters__label" key={name}>
            <span className="filters__labelText">{label}</span>
            <select className={`filters__input ${error ? "filters__input--error" : ""}`} value={inputValue} onChange={onInput(name, "select")}>
              {isSimpleStringArray ? (
                <>
                  <option value="">{`Any ${label.toLowerCase()}`}</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  {!opts.find((o) => String(o.value) === "") && <option value="">{`Any ${label.toLowerCase()}`}</option>}
                  {opts.map((o) => (
                    <option key={String(o.value)} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
          {error && <div className="filters__fieldError">{error}</div>}
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
            />
          </label>
          {error && <div className="filters__fieldError">{error}</div>}
        </div>
      );

    case "checkbox":
      return (
        <div className="fv-wrapper">
          <label className="filters__label filters__checkbox" key={name}>
            <input className={`filters__input ${error ? "filters__input--error" : ""}`} type="checkbox" checked={!!inputValue} onChange={onInput(name, "checkbox")} />
            <span className="filters__labelText">{label}</span>
          </label>
          {error && <div className="filters__fieldError">{error}</div>}
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
              placeholder={label}
              value={inputValue || ""}
              onChange={onInput(name, "text")}
            />
          </label>
          {error && <div className="filters__fieldError">{error}</div>}
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
