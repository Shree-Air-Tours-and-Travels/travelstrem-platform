import React from "react";
import "./TextArea.styles.scss";

export default function TextArea({ label, value = "", onChange, placeholder, required = false, error = "", maxLength, rows = 5, disabled = false, className = "", ...rest }) {
  return (
    <label className={`trem-textarea${error ? " trem-textarea--error" : ""}${className ? ` ${className}` : ""}`}>
      {label ? <span className="trem-textarea__label">{label}{required ? <span aria-hidden="true"> *</span> : null}</span> : null}
      <textarea value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} rows={rows} disabled={disabled} aria-invalid={Boolean(error)} {...rest} />
      <span className="trem-textarea__meta">{error ? <em role="alert">{error}</em> : <span />}{maxLength ? <small>{value.length}/{maxLength}</small> : null}</span>
    </label>
  );
}
