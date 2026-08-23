import React from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import InputField from "../InputField/InputField.jsx";
import "./ContactForm.scss";

const ContactForm = ({
  fieldsMeta = [],
  formValues = {},
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  submitText = "Send Request",
  errors = {},
  Button: CustomButton,
}) => {
  const Btn = CustomButton || Button;

  const renderField = (field) => {
    const value = formValues[field.name] ?? "";
    const type = field.type || "text";
    if (type === "select") {
      const items = (field.options || []).map((option) =>
        typeof option === "string"
          ? { id: option, value: option, label: option }
          : { id: option.value, ...option },
      );
      return (
        <Dropdown
          variant="select"
          items={items}
          label={field.label}
          placeholder={field.placeholder || "Select an option"}
          value={value}
          onChange={(item) => onChange(field.name, item?.value ?? item?.id ?? "")}
          error={errors[field.name]}
          portalClassName="trem-contact-form__dropdown-layer"
          portalZIndex={2100}
        />
      );
    }
    if (type === "textarea") {
      return (
        <label
          className={`trem-contact-form__textarea-wrap${errors[field.name] ? " is-error" : ""}`}
        >
          <span>
            {field.label}
            {field.required ? " *" : ""}
          </span>
          <textarea
            value={value}
            maxLength={field.maxLength}
            placeholder={field.placeholder || ""}
            onChange={(event) => onChange(field.name, event.target.value)}
            aria-invalid={Boolean(errors[field.name])}
          />
        </label>
      );
    }
    if (type === "date") {
      return (
        <InputField
          variant="date"
          label={field.label}
          required={field.required}
          value={value}
          error={errors[field.name]}
          onChange={(next) => onChange(field.name, next)}
        />
      );
    }
    return (
      <InputField
        variant={type}
        label={field.label}
        required={field.required}
        value={value}
        maxLength={field.maxLength}
        placeholder={field.placeholder || ""}
        error={errors[field.name]}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  };

  const visibleFields = fieldsMeta.filter((field) => {
    if (!field.visibleWhen?.field) return true;
    return formValues[field.visibleWhen.field] === field.visibleWhen.equals;
  });

  return (
    <form className="trem-contact-form" noValidate onSubmit={onSubmit}>
      <div className="trem-contact-form__grid">
        {visibleFields.map((field) => (
          <div
            className={`trem-contact-form__field trem-contact-form__field--${field.width || "full"}`}
            key={field.name}
          >
            {renderField(field)}
            {errors[field.name] ? (
              <p className="trem-contact-form__error">{errors[field.name]}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="trem-contact-form__actions">
        <Btn
          type="submit"
          text={submitting ? "Sending..." : submitText}
          size="medium"
          variant="solid"
          color="primary"
          disabled={submitting}
        />
        <Btn
          type="button"
          text="Cancel"
          size="medium"
          variant="outline"
          color="primary"
          onClick={onCancel}
          disabled={submitting}
        />
      </div>
    </form>
  );
};

ContactForm.propTypes = {
  fieldsMeta: PropTypes.array,
  formValues: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  submitText: PropTypes.string,
  errors: PropTypes.object,
  Button: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};
export default ContactForm;
