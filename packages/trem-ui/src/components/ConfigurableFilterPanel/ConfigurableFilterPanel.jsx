import React from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import InputField from "../InputField/InputField.jsx";
import MultiSelect from "../MultiSelect/MultiSelect.jsx";
import SingleSelect from "../SingleSelect/SingleSelect.jsx";
import TimePicker from "../TimePicker/TimePicker.jsx";
import "./ConfigurableFilterPanel.styles.scss";

export default function ConfigurableFilterPanel({
  title,
  resetLabel,
  fields = [],
  values = {},
  onChange,
  onReset,
  className = "",
}) {
  return (
    <aside className={`trem-configurable-filters${className ? ` ${className}` : ""}`}>
      <header>
        <h2>{title}</h2>
        {resetLabel ? <Button text={resetLabel} variant="text" size="small" onClick={onReset} /> : null}
      </header>
      <div className="trem-configurable-filters__fields">
        {fields.map((field) => {
          const value = values[field.id] ?? (field.type === "multiSelect" ? [] : "");
          if (field.type === "select") {
            return <SingleSelect key={field.id} label={field.label} placeholder={field.placeholder} options={field.options} value={value} onChange={(next) => onChange?.(field.id, next)} />;
          }
          if (field.type === "multiSelect") {
            return <MultiSelect key={field.id} label={field.label} placeholder={field.placeholder} options={field.options} value={value} onChange={(next) => onChange?.(field.id, next)} applyLabel={field.applyLabel} clearAllLabel={field.clearLabel} />;
          }
          if (field.type === "time") {
            return <TimePicker key={field.id} label={field.label} placeholder={field.placeholder} value={value} step={field.step} onChange={(next) => onChange?.(field.id, next)} />;
          }
          return <InputField key={field.id} label={field.label} placeholder={field.placeholder} variant={field.type || "text"} min={field.min} max={field.max} value={value} onChange={(next) => onChange?.(field.id, next)} />;
        })}
      </div>
    </aside>
  );
}

ConfigurableFilterPanel.propTypes = {
  title: PropTypes.string,
  resetLabel: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.object),
  values: PropTypes.object,
  onChange: PropTypes.func,
  onReset: PropTypes.func,
  className: PropTypes.string,
};
