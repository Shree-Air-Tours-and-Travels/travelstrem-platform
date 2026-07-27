import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./ErrorState.styles.scss";

export default function ErrorState({
  icon = "alertTriangle",
  title = "Something went wrong",
  description,
  error,
  actions,
  retry,
  retryText = "Try again",
  className = "",
  ...rest
}) {
  const renderedActions = actions || (retry ? (
    <Button text={retryText} onClick={retry} />
  ) : null);

  return (
    <div className={`tt-error-state ${className}`} {...rest}>
      <div className="tt-error-state__icon">
        <Icon name={icon} size={56} />
      </div>
      <h2 className="tt-error-state__title">{title}</h2>
      {description ? <p className="tt-error-state__desc">{description}</p> : null}
      {error ? <p className="tt-error-state__error">{error}</p> : null}
      {renderedActions ? <div className="tt-error-state__actions">{renderedActions}</div> : null}
    </div>
  );
}
