import React from "react";
import "./BookingProgress.styles.scss";

export default function BookingProgress({ steps = [], currentStep = 0, className = "" }) {
  if (!steps.length) return null;

  return (
    <div className={`booking-progress ${className}`}>
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={step.key || idx} className={`booking-progress__step ${isActive ? "booking-progress__step--active" : ""} ${isCompleted ? "booking-progress__step--completed" : ""}`}>
            <div className="booking-progress__number">
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>
            <span className="booking-progress__label">{step.label || step}</span>
            {idx < steps.length - 1 && <div className="booking-progress__connector" />}
          </div>
        );
      })}
    </div>
  );
}
