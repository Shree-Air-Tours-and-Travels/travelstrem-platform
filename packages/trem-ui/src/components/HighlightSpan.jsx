// components/ui/HighlightSpan.jsx
import React from "react";
import "../styles/Stories/highlightSpan.scss"

const HighlightSpan = ({ children, variant = "highlight" }) => {
  return <span className={`ui-span ui-span--${variant}`}>{children}</span>;
};

export default HighlightSpan;
