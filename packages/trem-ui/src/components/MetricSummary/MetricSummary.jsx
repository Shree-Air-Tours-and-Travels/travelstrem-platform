import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./MetricSummary.styles.scss";

export default function MetricSummary({
  items = [],
  ariaLabel = "Overview summary",
  className = "",
  variant = "joined",
}) {
  return (
    <section
      className={`trem-metric-summary trem-metric-summary--${variant} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const Tag = item.onClick ? "button" : "div";
        return (
          <Tag
            key={item.id}
            type={item.onClick ? "button" : undefined}
            className={`trem-metric-summary__item${item.onClick ? " is-clickable" : ""}`}
            onClick={item.onClick}
          >
            <span className="trem-metric-summary__icon" aria-hidden="true">
              <Icon name={item.icon} size={18} />
            </span>
            <span className="trem-metric-summary__copy">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              {item.helper ? <small>{item.helper}</small> : null}
            </span>
            {item.trailingIcon ? (
              <Icon
                name={item.trailingIcon}
                size={17}
                className="trem-metric-summary__trailing"
                aria-hidden="true"
              />
            ) : null}
          </Tag>
        );
      })}
    </section>
  );
}

MetricSummary.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
      helper: PropTypes.string,
      trailingIcon: PropTypes.string,
    }),
  ),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["joined", "cards"]),
};
