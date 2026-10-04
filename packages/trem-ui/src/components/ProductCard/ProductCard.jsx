import React from "react";
import PropTypes from "prop-types";

import Icon from "../../icons/Icon/Icon.jsx";

import "./ProductCard.styles.scss";
import SubTitle from "../SubTitle/SubTitle.jsx";
import Title from "../Title/Title.jsx";

export default function ProductCard({
  title,
  description = "",
  productName = "",
  image,
  imageAlt = "",
  icon = "sparkles",
  tone = "primary",
  status = "Active",
  highlights = [],
  detailsLabel = "View details",
  actionLabel = "Explore",
  href,
  target = "_self",
  rel = "",
  ariaLabel = "",
  fallbackHref = null,
  disabled = false,
  comingSoon = false,
  comingSoonLabel = "Coming soon",
  onDetails,
  onExplore,
  className = "",
}) {
  const resolvedStatus =
    comingSoon && comingSoonLabel
      ? comingSoonLabel
      : status || (disabled ? "Unavailable" : "Active");

  const relationship = rel || (target === "_blank" ? "noopener noreferrer" : undefined);

  const cardClassName = [
    "trem-product-card",
    disabled ? "trem-product-card--disabled" : "",
    comingSoon ? "trem-product-card--coming-soon" : "",
    `trem-product-card--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleExploreClick = () => {
    if (!disabled && onExplore) onExplore();
  };

  const exploreHref = disabled ? null : href || fallbackHref;

  return (
    <article className={cardClassName} aria-label={ariaLabel || title}>
      <button
        className="trem-product-card__main"
        type="button"
        onClick={onDetails}
        aria-label={`${detailsLabel}: ${title}`}
      >
        <span className="trem-product-card__media">
          <img src={image} alt={imageAlt} loading="lazy" />

          <span className="trem-product-card__scrim" aria-hidden="true" />

          {icon ? (
            <span className="trem-product-card__icon" aria-hidden="true">
              <Icon name={icon} size={26} strokeWidth={1.8} />
            </span>
          ) : null}
        </span>

        <span className="trem-product-card__body">
          {productName ? (
            <Title text={productName} align={"center"} variant="secondary"></Title>
          ) : null}

          <SubTitle className="trem-product-card__title" text={title}></SubTitle>

          {description ? <SubTitle text={description} variant="secondary" /> : null}

          {highlights.length ? (
            <span className="trem-product-card__highlights">
              {highlights.map((highlight) => (
                <span
                  className="trem-product-card__highlight"
                  key={highlight.id || highlight.label}
                >
                  {highlight.icon ? (
                    <span className="trem-product-card__highlight-icon" aria-hidden="true">
                      <Icon name={highlight.icon} size={15} strokeWidth={2} />
                    </span>
                  ) : null}

                  <span className="trem-product-card__highlight-label">{highlight.label}</span>
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </button>

      <footer className="trem-product-card__footer">
        {onDetails ? (
          <button
            className="trem-product-card__details"
            type="button"
            onClick={onDetails}
            aria-label={`${detailsLabel}: ${title}`}
          >
            <Icon name="info" size={15} strokeWidth={2} />
            <span>{detailsLabel}</span>
          </button>
        ) : (
          <span />
        )}

        {!disabled && exploreHref ? (
          <a
            className="trem-product-card__explore"
            href={exploreHref}
            target={target}
            rel={relationship}
            aria-label={actionLabel}
          >
            <span>{actionLabel}</span>
            <Icon name="arrowUpRight" size={16} strokeWidth={2.2} />
          </a>
        ) : !disabled && onExplore ? (
          <button
            className="trem-product-card__explore"
            type="button"
            onClick={handleExploreClick}
            aria-label={actionLabel}
          >
            <span>{actionLabel}</span>
            <Icon name="arrowUpRight" size={16} strokeWidth={2.2} />
          </button>
        ) : null}
      </footer>
    </article>
  );
}

ProductCard.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  productName: PropTypes.string,
  image: PropTypes.string.isRequired,
  imageAlt: PropTypes.string,
  icon: PropTypes.string,
  tone: PropTypes.oneOf(["primary", "olive", "blue", "green", "teal", "purple"]),
  status: PropTypes.string,
  highlights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
    }),
  ),
  detailsLabel: PropTypes.string,
  actionLabel: PropTypes.string,
  details: PropTypes.object,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  ariaLabel: PropTypes.string,
  fallbackHref: PropTypes.string,
  disabled: PropTypes.bool,
  comingSoon: PropTypes.bool,
  comingSoonLabel: PropTypes.string,
  onDetails: PropTypes.func,
  onExplore: PropTypes.func,
  className: PropTypes.string,
};
