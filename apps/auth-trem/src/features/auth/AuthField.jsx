import React, { useEffect, useRef, useState } from "react";
import { Button } from "@packages/trem-ui";

export const AuthField = ({ value, onChange, placeholder, label = placeholder, secret = false,
  matchValue, ...inputProps }) => {
  const id = React.useId();
  const [visible, setVisible] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setCustomValidity(matchValue !== undefined && value && value !== matchValue
      ? "Passwords do not match." : "");
  }, [value, matchValue]);
  return (
    <div className="auth-trem__field-group">
      <label htmlFor={id}>{label}</label>
      <div className="auth-trem__field-wrap">
        <input {...inputProps} ref={inputRef} id={id}
          className="auth-trem__field-input"
          type={secret ? (visible ? "text" : "password") : inputProps.type || "text"}
          placeholder={placeholder} value={value}
          aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${id}-error` : undefined}
          onInvalid={(event) => setFieldError(event.target.validationMessage)}
          onBlur={(event) => setFieldError(event.target.validationMessage)}
          onChange={(event) => { setFieldError(""); onChange?.(event); }} />
        {secret ? <Button type="button" variant="text"
          primaryClassName="auth-trem__field-action"
          iconLeft={visible ? "eyeSlash" : "eye"}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible} onClick={() => setVisible((current) => !current)} /> : null}
      </div>
      {fieldError ? <small id={`${id}-error`} className="auth-trem__field-error" role="alert">{fieldError}</small> : null}
    </div>
  );
};
export const SecretField = (props) => <AuthField {...props} secret />;

