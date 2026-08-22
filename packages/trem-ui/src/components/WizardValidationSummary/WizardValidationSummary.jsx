import React from "react";
import "./WizardValidationSummary.styles.scss";

export default function WizardValidationSummary({ errors = {} }) {
  const messages = [...new Set(Object.values(errors).filter(Boolean))];
  if (!messages.length) return null;
  return <div className="wizard-validation-summary" role="alert">
    <strong>Please fix:</strong>
    <span>{messages.join(" • ")}</span>
  </div>;
}
