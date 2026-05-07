import React from "react";
import "../styles/Stories/button.scss";

const Button = ({
  text,
  size = "medium",
  variant = "solid", // "solid" | "outline" | "text" | "solid-outline"
  color = "primary",
  secondaryColor = null, // optional for mixed variants
  isCircular = false,
  onClick,
  href,
  target = "_self",
  primaryClassName = "", // new prop
}) => {
  const classNames = `
    ui-button 
    ui-button--${size} 
    ui-button--${variant} 
    ui-button--${color} 
    ${secondaryColor ? `ui-button--secondary-${secondaryColor}` : ""} 
    ${isCircular ? "ui-button--circular" : ""} 
    ${primaryClassName}
  `.trim();

  if (href) {
    return (
      <a href={href} target={target} className={classNames}>
        {text}
      </a>
    );
  }

  return (
    <button className={classNames} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;


// {/* Regular */}
// <Button text="Solid Primary" variant="solid" color="primary" primaryClassName="my-custom-outline" />

// <Button text="Outline Danger" variant="outline" color="danger" />

// <Button text="Text Link" variant="text" color="secondary" href="/docs" />

// {/* Mixed */}
// <Button 
//   text="Solid + Outline" 
//   variant="solid-outline" 
//   color="primary" 
//   secondaryColor="danger" 
// />

// <Button 
//   text="Alt Mix" 
//   variant="solid-outline" 
//   color="secondary" 
//   secondaryColor="white" 
// />