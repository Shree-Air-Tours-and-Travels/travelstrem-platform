import React from "react";
import "./TimelineStepper.styles.scss";

export default function TimelineStepper({ steps = [], className = "" }) {
  if (!steps.length) return null;

  return (
    <div className={`timeline-stepper ${className}`}>
      {steps.map((step, idx) => (
        <div
          key={step.key || idx}
          className={`timeline-stepper__item timeline-stepper__item--${step.status}`}
        >
          <div className="timeline-stepper__marker">
            <span className="timeline-stepper__dot">
              {step.status === "completed" && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {idx < steps.length - 1 && <div className="timeline-stepper__line" />}
          </div>
          <div className="timeline-stepper__content">
            <span className="timeline-stepper__label">{step.label}</span>
            {step.time && <span className="timeline-stepper__time">{step.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
