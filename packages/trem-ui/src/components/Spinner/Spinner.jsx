import React from "react";
import PropTypes from "prop-types";
import "./Spinner.styles.scss";

export default function Spinner({
  size = "md",
  label = "Loading",
  className = "",
}) {
  return (
    <span
      className={`trem-spinner trem-spinner--${size}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="trem-spinner__ring" aria-hidden="true" />
      <span className="trem-spinner__label">{label}</span>
    </span>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  label: PropTypes.string,
  className: PropTypes.string,
};
