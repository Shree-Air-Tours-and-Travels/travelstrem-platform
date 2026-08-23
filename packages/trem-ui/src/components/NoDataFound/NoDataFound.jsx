import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./NoDataFound.styles.scss";

export default function NoDataFound({
  icon = "info",
  title,
  description = "",
  actionLabel = "",
  actionHref = "",
  actionAriaLabel = "",
  onAction,
  compact = false,
  className = "",
}) {
  const showAction = Boolean(actionLabel && (onAction || actionHref));
  return (
    <div
      className={["trem-no-data", compact ? "trem-no-data--compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      {icon ? (
        <span className="trem-no-data__icon" aria-hidden="true">
          <Icon name={icon} size={compact ? 22 : 30} />
        </span>
      ) : null}
      <div className="trem-no-data__copy">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {showAction ? (
        <Button
          variant="text"
          color="primary"
          size="small"
          text={actionLabel}
          iconRight="chevronRight"
          iconSize={17}
          className="trem-no-data__action"
          aria-label={actionAriaLabel || actionLabel}
          href={onAction ? undefined : actionHref}
          onClick={onAction || undefined}
        />
      ) : null}
    </div>
  );
}

NoDataFound.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  actionHref: PropTypes.string,
  actionAriaLabel: PropTypes.string,
  onAction: PropTypes.func,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
