import React from "react";
import PropTypes from "prop-types";
import "./TitleEnhancement.styles.scss";

export default function TitleEnhancement({ text, className = "" }) {
  if (!text) return null;

  return (
    <span className={`ui-title-enhancement ${className}`.trim()}>
      {text}
    </span>
  );
}

TitleEnhancement.propTypes = {
  text: PropTypes.node,
  className: PropTypes.string,
};
