import React, { useCallback } from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./TimelineStepper.styles.scss";

const STATUS_ICON_MAP = {
  completed: "check",
  success: "check",

  error: "x",
  failed: "x",
  cancelled: "x",

  warning: "alertTriangle",

  info: "info",
};

const normalizeStatus = (status) => {
  const value = String(status || "pending").toLowerCase();

  switch (value) {
    case "complete":
    case "completed":
    case "success":
    case "done":
      return "completed";

    case "current":
    case "active":
    case "in-progress":
    case "in_progress":
    case "processing":
      return "current";

    case "error":
    case "failed":
      return "error";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "warning":
      return "warning";

    case "info":
      return "info";

    case "skipped":
      return "skipped";

    case "pending":
    case "upcoming":
    default:
      return "pending";
  }
};

export default function TimelineStepper({
  steps = [],
  className = "",

  // New optional props — existing usages do not need them.
  variant = "default",
  orientation = "vertical",
  size = "md",
  markerVariant = "status",
  connectorVariant = "solid",
  showStepNumbers = false,
  showTime = true,
  onStepClick,
  ariaLabel = "Progress",
}) {
  const handleStepClick = useCallback(
    (step, index, event) => {
      if (step?.disabled) return;

      step?.onClick?.(step, index, event);
      onStepClick?.(step, index, event);
    },
    [onStepClick],
  );

  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  const renderMarkerContent = (step, status, index) => {
    /*
     * Explicit step icon always wins.
     */
    if (step.icon) {
      return typeof step.icon === "string" ? <Icon name={step.icon} size={14} /> : step.icon;
    }

    /*
     * Explicit numbered mode.
     */
    if (markerVariant === "number" || showStepNumbers) {
      if (status === "completed") {
        return <Icon name="check" size={13} />;
      }

      return <span className="timeline-stepper__number">{index + 1}</span>;
    }

    /*
     * Pure dot mode.
     */
    if (markerVariant === "dot") {
      return <span className="timeline-stepper__inner-dot" />;
    }

    /*
     * Default status representation.
     */
    const iconName = STATUS_ICON_MAP[status];

    if (iconName) {
      return <Icon name={iconName} size={13} />;
    }

    /*
     * Current gets a small center indicator.
     */
    if (status === "current") {
      return <span className="timeline-stepper__current-dot" />;
    }

    /*
     * Skipped uses a simple dash so it does not
     * depend on another icon existing in the library.
     */
    if (status === "skipped") {
      return <span className="timeline-stepper__skip-mark" />;
    }

    return null;
  };

  return (
    <div
      className={[
        "timeline-stepper",

        `timeline-stepper--${variant}`,
        `timeline-stepper--${orientation}`,
        `timeline-stepper--${size}`,
        `timeline-stepper--marker-${markerVariant}`,
        `timeline-stepper--connector-${connectorVariant}`,

        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="list"
      aria-label={ariaLabel}
    >
      {steps.map((step, index) => {
        const status = normalizeStatus(step?.status);

        const isLast = index === steps.length - 1;

        const clickable = !step?.disabled && Boolean(step?.onClick || onStepClick);

        return (
          <div
            key={step?.key ?? step?.id ?? index}
            className={[
              "timeline-stepper__item",

              `timeline-stepper__item--${status}`,

              clickable ? "is-clickable" : "",

              step?.disabled ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="listitem"
            aria-current={status === "current" ? "step" : undefined}
          >
            <div className="timeline-stepper__marker">
              <button
                type="button"
                className="timeline-stepper__dot"
                disabled={!clickable}
                tabIndex={clickable ? 0 : -1}
                aria-label={clickable ? step?.ariaLabel || step?.label : undefined}
                onClick={clickable ? (event) => handleStepClick(step, index, event) : undefined}
              >
                {renderMarkerContent(step, status, index)}
              </button>

              {!isLast ? <span className="timeline-stepper__line" aria-hidden="true" /> : null}
            </div>

            <div
              className="timeline-stepper__content"
              onClick={clickable ? (event) => handleStepClick(step, index, event) : undefined}
            >
              <div className="timeline-stepper__heading">
                <span className="timeline-stepper__label">{step?.label}</span>

                {step?.badge ? <span className="timeline-stepper__badge">{step.badge}</span> : null}
              </div>

              {step?.description ? (
                <span className="timeline-stepper__description">{step.description}</span>
              ) : null}

              {showTime && step?.time ? (
                <span className="timeline-stepper__time">{step.time}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
