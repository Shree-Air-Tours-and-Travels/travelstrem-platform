import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import {
  DESTINATION_CARD_VARIANTS,
  DESTINATION_CARD_ASPECT_RATIOS,
  DESTINATION_CARD_SIZES,
  DESTINATION_CARD_OVERLAYS,
} from "./DestinationCard.constants.js";
import "./DestinationCard.styles.scss";

const isOneOf = (value, list, fallback) => (list.includes(value) ? value : fallback);

const formatMoney = (value, currency = "INR") => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

const getBadgeLabel = (badge) => (typeof badge === "string" ? badge : badge?.label || "");

export default function DestinationCard({
  id,
  title,
  description,
  image = {},
  price = {},
  rating,
  reviewCount,
  duration = {},
  location,
  badges = [],
  ctaLabel,
  href,
  onClick,
  variant = "default",
  size = "medium",
  aspectRatio = "landscape",
  overlay = "strong",
  favorite,
  onFavorite,
  loading = false,
  disabled = false,
  className = "",
}) {
  const [imgSrc, setImgSrc] = useState(image?.src || "");
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(image?.src || "");
    setImgFailed(false);
  }, [image?.src]);

  const imageAlt = image?.alt || title || "Destination image";
  const fallbackSrc = image?.fallbackSrc || "";
  const titleText = title || "Destination";
  const descriptionText = description || "";
  const locationText = location || "";
  const badgeList = badges.filter((badge) => getBadgeLabel(badge));

  const ratingNumber = Number(rating);
  const displayRating =
    Number.isFinite(ratingNumber) && ratingNumber > 0 ? ratingNumber.toFixed(1) : "";
  const reviewCountNumber = Number(reviewCount);
  const displayReviewCount =
    Number.isFinite(reviewCountNumber) && reviewCountNumber > 0 ? reviewCountNumber : "";

  const priceAmount = Number(price?.amount);
  const currencyValue = price?.currency || "INR";
  const priceText = formatMoney(priceAmount, currencyValue);
  const priceLabel = price?.label || "From";

  const durationDays = Number(duration?.days);
  const durationNights = Number(duration?.nights);
  const durationText =
    (Number.isFinite(durationDays) && durationDays > 0) ||
    (Number.isFinite(durationNights) && durationNights > 0)
      ? `${durationDays > 0 ? durationDays : 0}d ${durationNights > 0 ? durationNights : 0}n`
      : "";

  const variantClass = isOneOf(variant, DESTINATION_CARD_VARIANTS, "default");
  const sizeClass = isOneOf(size, DESTINATION_CARD_SIZES, "medium");
  const ratioClass = isOneOf(aspectRatio, DESTINATION_CARD_ASPECT_RATIOS, "landscape");
  const overlayClass = isOneOf(overlay, DESTINATION_CARD_OVERLAYS, "strong");

  const isCompact = variantClass === "compact" || variantClass === "minimal";
  const isOverlayCard = variantClass === "overlay";
  const isInteractive = variantClass === "interactive";

  const showRating = !isCompact && displayRating;
  const showDescription = !isCompact && descriptionText;
  const showPrice = !isCompact && priceText;
  const showDuration = !isCompact && durationText;
  const hasFavorite = typeof favorite === "boolean" && typeof onFavorite === "function";

  const cardPayload = {
    id,
    title: titleText,
    description,
    image,
    price,
    rating,
    reviewCount,
    duration,
    location,
    badges,
    href,
  };

  const handleImageError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      return;
    }
    setImgFailed(true);
  };

  const handleFavorite = (event) => {
    event.stopPropagation();
    event.preventDefault();
    onFavorite(cardPayload);
  };

  const handleClick = () => {
    if (typeof onClick === "function") onClick(cardPayload);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const baseClasses = `trem-destination-card trem-destination-card--${variantClass} trem-destination-card--${sizeClass} trem-destination-card--${ratioClass} trem-destination-card--overlay-${overlayClass}${className ? ` ${className}` : ""}${isOverlayCard ? " is-overlay" : ""}${disabled ? " is-disabled" : ""}`;

  if (loading) {
    return (
      <div
        className={`${baseClasses} is-loading`}
        role="status"
        aria-busy="true"
        aria-label="Loading destination card"
      >
        <div className="trem-destination-card__media">
          <div className="trem-destination-card__skeleton" />
        </div>
        <div className="trem-destination-card__body">
          <span className="trem-destination-card__skeleton-line" />
          <span className="trem-destination-card__skeleton-line trem-destination-card__skeleton-line--short" />
        </div>
      </div>
    );
  }

  const visibleImage = imgFailed ? "" : imgSrc;

  const ratingElement = showRating ? (
    <span className="trem-destination-card__rating">
      <Icon name="star" size={12} />
      {displayRating}
      {displayReviewCount ? <small>({displayReviewCount})</small> : null}
    </span>
  ) : null;

  const content = (
    <>
      <div className="trem-destination-card__media">
        {visibleImage ? (
          <img
            className="trem-destination-card__img"
            src={visibleImage}
            alt={imageAlt}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="trem-destination-card__placeholder">
            <Icon name="mountain" size={40} />
          </div>
        )}
        <div className="trem-destination-card__shade" aria-hidden="true" />

        {badgeList.length > 0 && (
          <div className="trem-destination-card__badges">
            {badgeList.slice(0, 2).map((badge, index) => (
              <span
                key={`${getBadgeLabel(badge)}-${index}`}
                className="trem-destination-card__badge"
              >
                {getBadgeLabel(badge)}
              </span>
            ))}
          </div>
        )}

        {hasFavorite && (
          <button
            type="button"
            className={`trem-destination-card__favorite${favorite ? " is-favorite" : ""}`}
            onClick={handleFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Icon name="heart" size={16} />
          </button>
        )}

        {!isOverlayCard && ratingElement}
      </div>

      <div className="trem-destination-card__body">
        {locationText && (
          <p className="trem-destination-card__location">
            <Icon name="mapPin" size={13} />
            {locationText}
          </p>
        )}

        <h3 className="trem-destination-card__title">{titleText}</h3>

        {showDescription && <p className="trem-destination-card__desc">{descriptionText}</p>}

        {isOverlayCard && ratingElement}

        {!isCompact && (showPrice || showDuration) && (
          <div className="trem-destination-card__footer">
            {showPrice && (
              <span className="trem-destination-card__price">
                {priceLabel ? <small>{priceLabel}</small> : null}
                <strong>{priceText}</strong>
              </span>
            )}
            {showDuration && (
              <span className="trem-destination-card__count">
                <Icon name="calendar" size={13} />
                {durationText}
              </span>
            )}
          </div>
        )}

        {ctaLabel && (variantClass === "featured" || isInteractive) && (
          <span className="trem-destination-card__cta">
            {ctaLabel}
            <Icon name="arrowUpRight" size={14} />
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        className={baseClasses}
        href={href}
        onClick={disabled ? undefined : handleClick}
        aria-label={titleText}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <article
      className={baseClasses}
      aria-label={titleText}
      role={onClick ? "button" : undefined}
      tabIndex={disabled ? -1 : onClick ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : handleClick}
      onKeyDown={disabled ? undefined : handleKeyDown}
    >
      {content}
    </article>
  );
}

DestinationCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.shape({
    src: PropTypes.string,
    alt: PropTypes.string,
    fallbackSrc: PropTypes.string,
  }),
  price: PropTypes.shape({
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    label: PropTypes.string,
  }),
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  reviewCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  duration: PropTypes.shape({
    days: PropTypes.number,
    nights: PropTypes.number,
  }),
  location: PropTypes.string,
  badges: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ label: PropTypes.string })]),
  ),
  ctaLabel: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(DESTINATION_CARD_VARIANTS),
  size: PropTypes.oneOf(DESTINATION_CARD_SIZES),
  aspectRatio: PropTypes.oneOf(DESTINATION_CARD_ASPECT_RATIOS),
  overlay: PropTypes.oneOf(DESTINATION_CARD_OVERLAYS),
  favorite: PropTypes.bool,
  onFavorite: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

DestinationCard.defaultProps = {
  id: "",
  title: "",
  description: "",
  image: {},
  price: {},
  rating: "",
  reviewCount: "",
  duration: {},
  location: "",
  badges: [],
  ctaLabel: "",
  href: "",
  onClick: undefined,
  variant: "default",
  size: "medium",
  aspectRatio: "landscape",
  overlay: "strong",
  favorite: undefined,
  onFavorite: undefined,
  loading: false,
  disabled: false,
  className: "",
};
