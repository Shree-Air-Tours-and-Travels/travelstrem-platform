import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./ProgressMeter.styles.scss";

export default function ProgressMeter({ label, value = 0, max = 100, displayValue, tone = "primary", icon }) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  const percent = (safeValue / safeMax) * 100;

  return (
    <div className={`trem-progress-meter trem-progress-meter--${tone}`}>
      {icon ? <span className="trem-progress-meter__icon" aria-hidden="true"><Icon name={icon} size={18} /></span> : null}
      <div className="trem-progress-meter__body">
        <div className="trem-progress-meter__copy">
          <span>{label}</span>
          <strong>{displayValue ?? value}</strong>
        </div>
        <div
          className="trem-progress-meter__track"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={safeValue}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className="trem-progress-meter__percent">{Math.round(percent)}%</span>
    </div>
  );
}

ProgressMeter.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  max: PropTypes.number,
  displayValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tone: PropTypes.oneOf(["primary", "accent", "success", "info", "warning"]),
  icon: PropTypes.string,
};
