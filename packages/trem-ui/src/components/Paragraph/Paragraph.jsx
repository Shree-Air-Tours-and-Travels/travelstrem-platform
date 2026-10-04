import React from "react";
import "./Paragraph.styles.scss";

const Paragraph = ({
  text,
  children,
  variant = "body",
  size = "medium",
  color,
  align,
  primaryClassname,
}) => {
  const content = text || children;
  return (
    <p
      className={`ui-paragraph ui-paragraph--${variant} ui-paragraph--${size} ${primaryClassname}`}
      style={{
        ...(color ? { color } : {}),
        ...(align ? { textAlign: align } : {}),
      }}
    >
      {content}
    </p>
  );
};

export default Paragraph;
