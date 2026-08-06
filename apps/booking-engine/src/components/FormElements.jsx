import React from "react";
import InputField from "@packages/trem-ui/components/InputField/InputField.jsx";
import Dropdown from "@packages/trem-ui/components/Dropdown/Dropdown.jsx";
import Button from "@packages/trem-ui/components/Button/Button.jsx";
import DatePicker from "@packages/trem-ui/components/DatePicker/DatePicker.jsx";
import Icon from "@packages/trem-ui/icons/Icon/Icon.jsx";

export function FormField({ field, value, error, errorKey, onChange }) {
  const fieldErrorKey = errorKey || field.name;
  if (field.type === "select") {
    const items = (field.options || []).map((opt) => ({
      value: String(opt.value ?? opt),
      label: opt.label ?? opt,
    }));
    return (
      <div className="be-field" data-field-key={fieldErrorKey} data-invalid={Boolean(error)}>
        <Dropdown
          variant="select"
          label={field.required ? `${field.label || field.name} *` : field.label || field.name}
          placeholder={field.placeholder || "Select"}
          value={value ?? ""}
          onChange={(item) => onChange(field.name, item?.value ?? item?.id)}
          items={items}
          error={error}
          disabled={field.disabled}
          searchPlaceholder="Search..."
        />
        {error && <span className="be-field__error">{error}</span>}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <label className="be-field" htmlFor={field.name} data-field-key={fieldErrorKey} data-invalid={Boolean(error)}>
        <span className="be-field__label">{field.label || field.name}{field.required ? " *" : ""}</span>
        <DatePicker
          value={value ?? ""}
          onChange={(nextValue) => onChange(field.name, nextValue)}
          placeholder={field.placeholder || "Select date"}
          min={field.min}
          max={field.max}
          mode={field.datePickerMode || "calendar"}
          disabled={field.disabled || field.readOnly}
          error={error}
        />
        {error && <span className="be-field__error">{error}</span>}
      </label>
    );
  }

  return (
    <div className="be-field" data-field-key={fieldErrorKey} data-invalid={Boolean(error)}>
      <InputField
        variant={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
        value={value ?? ""}
        placeholder={field.placeholder || ""}
        label={field.label || field.name}
        required={field.required}
        disabled={field.disabled || field.readOnly}
        error={error}
        onChange={(nextValue) => onChange(field.name, nextValue)}
      />
      {error && <span className="be-field__error">{error}</span>}
    </div>
  );
}

export function CounterField({ label, value, onChange, min = 0, max = 10 }) {
  return (
    <div className="be-counter">
      <span className="be-counter__label">{label}</span>
      <div className="be-counter__controls">
        <button
          type="button"
          className="be-counter__btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Icon name="minus" size={16} style={{ color: "currentColor" }} />
        </button>
        <span className="be-counter__value">{value}</span>
        <button
          type="button"
          className="be-counter__btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Icon name="plus" size={16} style={{ color: "currentColor" }} />
        </button>
      </div>
    </div>
  );
}

export function StepActions({ onBack, onNext, onNextLabel, onBackLabel = "Back", isFirst, isLast, saving = false, disabled = false }) {
  return (
    <div className="be-actions">
      {!isFirst && (
        <Button variant="outline" color="secondary" text={onBackLabel} onClick={onBack} />
      )}
      <Button
        variant="solid"
        color="primary"
        text={saving ? "Processing..." : onNextLabel || (isLast ? "Submit Booking" : "Continue")}
        onClick={onNext}
        disabled={saving || disabled}
        primaryClassName="be-actions__primary"
      />
    </div>
  );
}
