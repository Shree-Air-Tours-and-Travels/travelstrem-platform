import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./Button.styles.scss";

const Button = ({
  children,
  text,
  size = "medium",
  variant = "solid",
  color = "primary",
  secondaryColor = null,
  iconLeft = null,
  iconRight = null,
  iconSize = 18,
  isCircular = false,
  fullWidth = false,
  onClick,
  href,
  target = "_self",
  primaryClassName = "",
  className = "",
  type = "button",
  disabled = false,
  ...rest
}) => {
  const classNames = `
    ui-button 
    ui-button--${size} 
    ui-button--${variant} 
    ui-button--${color} 
    ${secondaryColor ? `ui-button--secondary-${secondaryColor}` : ""} 
    ${isCircular ? "ui-button--circular" : ""} 
    ${fullWidth ? "ui-button--full-width" : ""}
    ${iconLeft || iconRight ? "ui-button--has-icon" : ""}
    ${primaryClassName}
    ${className}
  `.trim();

  const content =
    children != null ? (
      children
    ) : (
      <>
        {iconLeft && (
          <span className="ui-button__icon">
            <Icon name={iconLeft} size={iconSize} />
          </span>
        )}
        {text && <span>{text}</span>}
        {iconRight && (
          <span className="ui-button__icon">
            <Icon name={iconRight} size={iconSize} />
          </span>
        )}
      </>
    );

  if (href) {
    return (
      <a href={href} target={target} className={classNames} aria-disabled={disabled} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button className={classNames} onClick={onClick} type={type} disabled={disabled} {...rest}>
      {content}
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
