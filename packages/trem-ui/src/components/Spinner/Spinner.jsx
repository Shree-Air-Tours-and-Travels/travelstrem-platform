import React from "react";
import PropTypes from "prop-types";
import "./Spinner.styles.scss";

export default function Spinner({
  size = "md",
  label = "Loading",
  direction = "row",
  className = "",
}) {
  return (
    <span
      className={`trem-spinner trem-spinner--${size} trem-spinner--${direction}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="trem-spinner__ring" aria-hidden="true" />
      {label ? <span className="trem-spinner__label">{label}</span> : null}
    </span>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  label: PropTypes.string,
  direction: PropTypes.oneOf(["row", "column"]),
  className: PropTypes.string,
};
