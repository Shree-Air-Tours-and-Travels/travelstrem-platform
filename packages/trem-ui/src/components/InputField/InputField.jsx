import React, { useState, useCallback } from "react";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Button from "../Button/Button.jsx";
import "./InputField.styles.scss";

export default function InputField({
  variant = "text",
  value = "",
  onChange,
  placeholder,
  label,
  required,
  error,
  disabled,
  className = "",
  maxLength,
  min,
  max,
  step,
  inputMode,
  ariaLabel,
  "aria-describedby": ariaDescribedBy,
  countryCode: initialCountryCode = "+91",
  countryCodeOptions = [],
  onCountryCodeChange,
  dropdownPortalClassName = "",
  dropdownPortalZIndex,
  ...rest
}) {
  const generatedErrorId = React.useId();
  const errorId = `${generatedErrorId}-error`;
  const describedBy = [ariaDescribedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const isTel = variant === "tel";
  const isMonthYear = variant === "monthYear";
  const telMaxLength = Math.min(10, Math.max(1, Number(maxLength) || 10));
  const [cc, setCc] = useState(initialCountryCode);

  const handleChange = useCallback(
    (e) => {
      let val = e.target.value;
      if (isTel) {
        val = val.replace(/\D/g, "").slice(0, telMaxLength);
      }
      if (isMonthYear) {
        val = val.replace(/\D/g, "").slice(0, 4);
        if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
      }
      onChange?.(val);
    },
    [isTel, isMonthYear, onChange, telMaxLength],
  );

  const handleCountryCode = useCallback(
    (code) => {
      setCc(code);
      onCountryCodeChange?.(code);
    },
    [onCountryCodeChange],
  );

  const ccItems = countryCodeOptions.map((option) => {
    const code = option.dialCode || option.metadata?.dialCode || option.code || option.value;
    const country = option.countryCode || option.metadata?.countryCode || option.name || "";
    return {
      id: option.id || option.value || `${code}-${country}`,
      label: option.label || `${code} ${country}`.trim(),
      active: code === cc,
      onClick: () => handleCountryCode(code),
    };
  });

  return (
    <div
      className={`trem-input trem-input--${variant} ${label ? "trem-input--labelled" : ""} ${error ? "trem-input--error" : ""} ${className}`.trim()}
    >
      {label && (
        <span className="trem-input__label">
          {label}
          {required && <span className="trem-input__required"> *</span>}
        </span>
      )}
      <div className="trem-input__row">
        {isTel && (
          <Dropdown
            items={ccItems}
            variant="searchable"
            closeOnSelect
            align="left"
            portalWidth={280}
            portalClassName={dropdownPortalClassName}
            portalZIndex={dropdownPortalZIndex}
            menuClassName="trem-input__country-menu"
            searchPlaceholder="Search country code..."
            trigger={() => (
              <Button
                variant="text"
                primaryClassName="trem-input__cc-trigger"
                iconRight="chevronDown"
                text={cc}
                tabIndex={-1}
              />
            )}
          />
        )}
        <input
          className="trem-input__field"
          type={isTel ? "tel" : isMonthYear ? "text" : variant}
          inputMode={
            inputMode || (variant === "number" || isTel || isMonthYear ? "numeric" : undefined)
          }
          value={value}
          onChange={handleChange}
          placeholder={placeholder || (isMonthYear ? "MM/YY" : undefined)}
          disabled={disabled}
          maxLength={isTel ? telMaxLength : isMonthYear ? 5 : maxLength}
          autoComplete={isTel ? "tel" : variant === "email" ? "email" : "off"}
          min={min}
          max={max}
          step={step}
          aria-label={ariaLabel || label || placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>
      {error ? (
        <span className="trem-input__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
