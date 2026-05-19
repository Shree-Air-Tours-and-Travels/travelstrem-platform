import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./EmptyState.styles.scss";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  ...rest
}) {
  return (
    <div className={`tt-empty-state ${className}`} {...rest}>
      {icon ? (
        <div className="tt-empty-state__icon">
          <Icon name={icon} size={48} />
        </div>
      ) : null}
      {title ? <h2 className="tt-empty-state__title">{title}</h2> : null}
      {description ? <p className="tt-empty-state__desc">{description}</p> : null}
      {action ? <div className="tt-empty-state__action">{action}</div> : null}
    </div>
  );
}
