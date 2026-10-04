import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./DetailedChip.styles.scss";

export default function DetailedChip({ icon, label, value, tone = "neutral", className = "" }) {
  return (
    <span className={`trem-detailed-chip trem-detailed-chip--${tone}${className ? ` ${className}` : ""}`}>
      {icon ? <Icon name={icon} size={16} /> : null}
      <span>
        {label ? <small>{label}</small> : null}
        {value ? <strong>{value}</strong> : null}
      </span>
    </span>
  );
}

DetailedChip.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  tone: PropTypes.oneOf(["neutral", "primary", "success", "warning"]),
  className: PropTypes.string,
};
