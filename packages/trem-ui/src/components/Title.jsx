import React from "react";
import "../styles/Stories/title.scss";

const Title = ({ text, variant = "primary", size = "large", color, primaryClassname, align }) => {
  return (
    <h1
      className={`ui-title ui-title--${variant} ui-title--${size} ${primaryClassname}`}
        style={{
        ...(color ? { color } : {}),
        ...(align ? { textAlign: align }: {}),
      }}
    >
      {text}
    </h1>
  );
};

export default Title;
