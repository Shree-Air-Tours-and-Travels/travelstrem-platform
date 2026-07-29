import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./NoDataFound.styles.scss";

export default function NoDataFound({
  icon = "info",
  title,
  description = "",
  actionLabel = "",
  actionHref = "",
  actionAriaLabel = "",
  compact = false,
  className = "",
}) {
  return (
    <div
      className={[
        "trem-no-data",
        compact ? "trem-no-data--compact" : "",
        className,
      ].filter(Boolean).join(" ")}
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
      {actionLabel && actionHref ? (
        <a
          className="trem-no-data__action"
          href={actionHref}
          aria-label={actionAriaLabel || actionLabel}
        >
          {actionLabel}
          <Icon name="chevronRight" size={17} aria-hidden="true" />
        </a>
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
  compact: PropTypes.bool,
  className: PropTypes.string,
};
