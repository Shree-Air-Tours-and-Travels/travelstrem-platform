import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./WizardFormShell.styles.scss";

export default function WizardFormShell({
  title,
  subtitle,
  eyebrow,
  status = "Draft",
  steps = [],
  activeStepId,
  completedStepIds = [],
  progress = 0,
  canNavigate = true,
  onStepChange,
  headerActions,
  railTitle = "Build your tour",
  railSubtitle,
  children,
  actionBar,
  className = "",
}) {
  const mainRef = React.useRef(null);
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStepId),
  );
  const current = steps[currentIndex] || {};

  React.useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    if (typeof main.scrollTo === "function") {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    main.scrollTop = 0;
    main.scrollLeft = 0;
  }, [activeStepId]);

  return (
    <section className={`wizard-shell ${className}`.trim()}>
      <header className="wizard-shell__topbar">
        <div>
          <span className="wizard-shell__eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="wizard-shell__topbar-actions">
          <StatusBadge value={status} />
          {headerActions}
        </div>
      </header>
      <div className="wizard-shell__layout">
        <aside className="wizard-shell__rail">
          <div className="wizard-shell__rail-heading">
            <strong>{railTitle}</strong>
            <span>{railSubtitle || `${steps.length} guided steps`}</span>
          </div>
          <nav aria-label="Creation steps">
            {steps.map((step, index) => {
              const active = step.id === activeStepId;
              const complete = completedStepIds.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`${active ? "is-active" : ""}${complete ? " is-complete" : ""}`.trim()}
                  aria-current={active ? "step" : undefined}
                  disabled={!canNavigate || step.disabled}
                  onClick={() => onStepChange?.(step.id)}
                >
                  <span className="wizard-shell__step-index">
                    {complete ? <Icon name="check" size={13} /> : index + 1}
                  </span>
                  <span>
                    <strong>{step.title}</strong>
                    {step.description && <small>{step.description}</small>}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
        <div ref={mainRef} className="wizard-shell__main">
          <header className="wizard-shell__step-header">
            <div>
              <span className="wizard-shell__step-count">
                Step {currentIndex + 1} of {steps.length}
              </span>
              <h2>{current.title}</h2>
              {current.description && <p>{current.description}</p>}
            </div>
            <div className="wizard-shell__progress" aria-label={`${progress}% complete`}>
              <div>
                <span>Overall progress</span>
                <strong>{progress}%</strong>
              </div>
              <div className="wizard-shell__progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </header>
          <main className="wizard-shell__workspace">{children}</main>
        </div>
      </div>
      {actionBar}
    </section>
  );
}
