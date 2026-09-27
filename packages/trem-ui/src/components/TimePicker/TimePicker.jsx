import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./TimePicker.styles.scss";

const toTimeOptions = (step) => {
  const interval = Math.max(5, Math.min(60, Number(step) || 30));
  const options = [];

  for (let minutes = 0; minutes < 24 * 60; minutes += interval) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    const hour12 = hours % 12 || 12;
    options.push({
      value,
      label: `${hour12}:${String(mins).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`,
    });
  }

  return options;
};

export default function TimePicker({
  value = "",
  onChange,
  label,
  placeholder = "Select time",
  required = false,
  disabled = false,
  error,
  step = 30,
  className = "",
  portalZIndex,
}) {
  const options = useMemo(() => toTimeOptions(step), [step]);
  const selected = options.find((option) => option.value === value);

  return (
    <div className={`trem-timepicker${error ? " trem-timepicker--error" : ""}${className ? ` ${className}` : ""}`}>
      <Dropdown
        items={options}
        value={value}
        onChange={(option) => onChange?.(option?.value || "")}
        variant="scrollable"
        matchTriggerWidth
        disabled={disabled}
        menuTitle={label || placeholder}
        menuAriaLabel={label || placeholder}
        portalZIndex={portalZIndex}
        trigger={({ open }) => (
          <button
            type="button"
            className={`trem-timepicker__trigger${open ? " is-open" : ""}`}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-invalid={Boolean(error)}
          >
            <span className="trem-timepicker__content">
              {label ? (
                <span className="trem-timepicker__label">
                  {label}{required ? <span> *</span> : null}
                </span>
              ) : null}
              <span className={selected ? "trem-timepicker__value" : "trem-timepicker__placeholder"}>
                {selected?.label || placeholder}
              </span>
            </span>
            <Icon name="clock" size={20} />
          </button>
        )}
      />
      {error ? <span className="trem-timepicker__error">{error}</span> : null}
    </div>
  );
}

TimePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  step: PropTypes.number,
  className: PropTypes.string,
  portalZIndex: PropTypes.number,
};
