import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./PlanCard.styles.scss";

export default function PlanCard({
  title,
  description = "",
  productName = "",
  image,
  imageAlt = "",
  href,
  target = "_self",
  rel = "",
  ariaLabel = "",
  className = "",
  disabled = false,
  comingSoon = false,
  comingSoonLabel = "",
  mobileIcon = "",
  tone = "primary",
  highlights = [],
  highlightsAriaLabel = "",
  actionLabel = "",
}) {
  const relationship = rel || (target === "_blank" ? "noopener noreferrer" : undefined);
  const cardClassName = [
    "trem-plan-card",
    disabled ? "trem-plan-card--disabled" : "",
    comingSoon ? "trem-plan-card--coming-soon" : "",
    `trem-plan-card--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span className="trem-plan-card__media">
        <img src={image} alt={imageAlt} loading="lazy" />
        {mobileIcon ? (
          <span className="trem-plan-card__mobile-icon" aria-hidden="true">
            <Icon name={mobileIcon} size={30} strokeWidth={1.8} />
          </span>
        ) : null}
      </span>
      {comingSoon && comingSoonLabel ? (
        <span className="trem-plan-card__availability">{comingSoonLabel}</span>
      ) : null}
      <span className="trem-plan-card__body">
        <span className="trem-plan-card__copy">
          {productName ? <span className="trem-plan-card__product">{productName}</span> : null}
          <strong className="trem-plan-card__title">{title}</strong>
          {description ? <span className="trem-plan-card__description">{description}</span> : null}
          {highlights.length ? (
            <span className="trem-plan-card__highlights" aria-label={highlightsAriaLabel || undefined}>
              {highlights.map((highlight) => (
                <span key={highlight.id || highlight.label}>
                  {highlight.icon ? (
                    <Icon name={highlight.icon} size={16} strokeWidth={2} aria-hidden="true" />
                  ) : null}
                  {highlight.label}
                </span>
              ))}
            </span>
          ) : null}
          {actionLabel && !disabled ? (
            <span className="trem-plan-card__action-label">{actionLabel}</span>
          ) : null}
        </span>
        {!disabled ? (
          <span className="trem-plan-card__action" aria-hidden="true">
            <Icon name="chevronRight" size={20} strokeWidth={2.4} />
          </span>
        ) : null}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div
        className={cardClassName}
        role="group"
        aria-label={ariaLabel || title}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <a
      className={cardClassName}
      href={href}
      target={target}
      rel={relationship}
      aria-label={ariaLabel || title}
    >
      {content}
    </a>
  );
}

PlanCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  productName: PropTypes.string,
  image: PropTypes.string.isRequired,
  imageAlt: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  comingSoon: PropTypes.bool,
  comingSoonLabel: PropTypes.string,
  mobileIcon: PropTypes.string,
  tone: PropTypes.string,
  highlights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
    }),
  ),
  highlightsAriaLabel: PropTypes.string,
  actionLabel: PropTypes.string,
};
