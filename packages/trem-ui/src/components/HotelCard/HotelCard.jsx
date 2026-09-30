import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import BrandLogo from "../BrandLogo/BrandLogo.jsx";
import InfoTooltip from "../InfoTooltip/InfoTooltip.jsx";
import Button from "../Button/Button.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import Preloader from "../Preloader/Preloader.jsx";
import Icon from "../../icons/Icon/Icon.jsx";

import "./HotelCard.styles.scss";

const PREVIEW_SECTIONS = ["highlights", "amenities", "description", "facts"];

const hasValue = (value) =>
  value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "");

const displayValue = (value, fallback = "") => {
  if (!hasValue(value)) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return value;
};

const resolveLabel = (labels, labelRef, fallback = "") => {
  if (labelRef && hasValue(labels?.[labelRef])) return labels[labelRef];
  return fallback;
};

const getStableKey = (item, index, prefix) =>
  item?.id || item?.value || item?.labelRef || `${prefix}-${index}`;

export default function HotelCard({
  hotel,
  labels = {},
  variant = "full",
  previewPriority = PREVIEW_SECTIONS,
  previewSectionLimit = 2,
  disabled = false,
  hidden = false,
  loading = false,
  favorite = false,
  popular = false,
  showFavorite = false,
  hideImage = false,
  hidePrice = false,
  hideAction = false,
  onView,
  onViewRooms,
  onFavorite,
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const safeHotel = hotel || {};
  const image = displayValue(safeHotel.image);
  const shouldShowImage = !hideImage && Boolean(image) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const unavailable = Boolean(disabled || safeHotel.disabled);

  const rating =
    typeof safeHotel.rating === "object" && safeHotel.rating !== null
      ? safeHotel.rating
      : { value: safeHotel.rating };

  const highlights = Array.isArray(safeHotel.highlights)
    ? safeHotel.highlights.filter(Boolean)
    : [];
  const amenities = Array.isArray(safeHotel.amenities) ? safeHotel.amenities.filter(Boolean) : [];
  const facts = Array.isArray(safeHotel.facts) ? safeHotel.facts.filter(Boolean) : [];
  const priceFields = Array.isArray(safeHotel.priceFields)
    ? safeHotel.priceFields.filter(Boolean)
    : [];

  const description =
    typeof safeHotel.description === "string"
      ? safeHotel.description.trim()
      : displayValue(safeHotel.description);

  const compactSections = useMemo(() => {
    const available = {
      highlights: highlights.length > 0,
      amenities: amenities.length > 0,
      description: Boolean(description),
      facts: facts.length > 0,
    };

    const priority = Array.isArray(previewPriority)
      ? previewPriority.filter((section) => PREVIEW_SECTIONS.includes(section))
      : PREVIEW_SECTIONS;

    return new Set(
      priority
        .filter((section) => available[section])
        .slice(0, Math.max(0, Number(previewSectionLimit) || 0)),
    );
  }, [
    amenities.length,
    description,
    facts.length,
    highlights.length,
    previewPriority,
    previewSectionLimit,
  ]);

  if (hidden) return null;

  if (loading) {
    return <Preloader variant="featured" label={labels.loading || ""} className={className} />;
  }

  const showSection = (section) => variant !== "compact" || compactSections.has(section);

  const title = displayValue(safeHotel.title, labels.hotelFallbackTitle || labels.hotel || "Hotel");
  const locationValue = displayValue(safeHotel.location?.value || safeHotel.subtitle);
  const locationDistance = displayValue(safeHotel.location?.distance);
  const badgeValue = displayValue(safeHotel.badge?.value);

  const priceLabel = resolveLabel(
    labels,
    safeHotel.price?.labelRef,
    displayValue(safeHotel.price?.label),
  );
  const priceValue = displayValue(safeHotel.price?.value);
  const staySummary = displayValue(safeHotel.staySummary);
  const priceDescription = resolveLabel(
    labels,
    safeHotel.priceDescriptionLabelRef,
    labels.priceIncludesFees || "",
  );

  const actionText = unavailable
    ? labels.unavailable || "Unavailable"
    : resolveLabel(
        labels,
        safeHotel.actionLabelRef,
        safeHotel.actionLabel || labels.viewDetails || "View details",
      );

  const secondaryActionText = resolveLabel(
    labels,
    safeHotel.secondaryActionLabelRef,
    safeHotel.secondaryActionLabel || "",
  );

  const hasPrimaryAction = !hideAction && Boolean(actionText);
  const hasSecondaryAction = !hideAction && variant !== "compact" && Boolean(secondaryActionText);

  const hasPriceContent =
    !hidePrice &&
    Boolean(priceLabel || priceValue || staySummary || priceDescription || priceFields.length);

  const hasFooterContent =
    hasPriceContent ||
    Boolean(safeHotel.cancellationNotice) ||
    hasPrimaryAction ||
    hasSecondaryAction;

  if (variant === "included") {
    return (
      <article
        className={`trem-hotel-card trem-hotel-card--included ${className}`}
        aria-disabled={unavailable || undefined}
      >
        {!hideImage && (
          <div className="trem-hotel-card__stay-image">
            {shouldShowImage ? (
              <img
                src={image}
                alt={displayValue(safeHotel.imageAlt, title)}
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <BrandLogo name="TravelsTREM" />
            )}
          </div>
        )}
        <div className="trem-hotel-card__stay-body">
          <header className="trem-hotel-card__stay-heading">
            <div>
              <h3>{title}</h3>
              {locationValue && <p>{locationValue}</p>}
            </div>
            {priceLabel && <span className="trem-hotel-card__stay-status">{priceLabel}</span>}
          </header>
          <div className="trem-hotel-card__stay-tags">
            {badgeValue && <span>{badgeValue}</span>}
            {hasValue(rating.value) && (
              <span>
                {labels.travellerRating || "Traveller rating"} {rating.value}
              </span>
            )}
            {amenities.map((item, index) => (
              <span key={getStableKey(item, index, "amenity")}>
                {typeof item === "string" ? item : item.value}
              </span>
            ))}
          </div>
          {description && <p>{description}</p>}
          <dl className="trem-hotel-card__stay-facts">
            {facts.map((fact, index) => (
              <div key={getStableKey(fact, index, "fact")}>
                <dt>{resolveLabel(labels, fact.labelRef, fact.label)}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {hasPrimaryAction && (
            <Button
              text={actionText}
              variant="outline"
              disabled={unavailable || !onView}
              onClick={() => onView?.(safeHotel)}
            />
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={[
        "trem-hotel-card",
        `trem-hotel-card--${variant}`,
        unavailable ? "trem-hotel-card--disabled" : "",
        !shouldShowImage ? "trem-hotel-card--no-image" : "",
        !hasPriceContent ? "trem-hotel-card--no-price" : "",
        !hasFooterContent ? "trem-hotel-card--no-footer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-disabled={unavailable || undefined}
    >
      <div className="trem-hotel-card__layout">
        {shouldShowImage ? (
          <div className="trem-hotel-card__media">
            <img
              src={image}
              alt={displayValue(safeHotel.imageAlt, title)}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />

            {showFavorite && onFavorite ? (
              <Button
                primaryClassName="trem-hotel-card__favorite"
                variant="text"
                iconLeft="heart"
                isCircular
                aria-label={
                  favorite
                    ? labels.removeFavorite || "Remove from favourites"
                    : labels.addFavorite || "Add to favourites"
                }
                aria-pressed={favorite}
                disabled={unavailable}
                onClick={() => onFavorite(safeHotel, !favorite)}
              />
            ) : null}

            {hasValue(safeHotel.imageCountLabel) ? (
              <span className="trem-hotel-card__photo-count">
                <Icon name="camera" size={17} aria-hidden="true" />
                <span>{safeHotel.imageCountLabel}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="trem-hotel-card__body">
          {badgeValue || hasValue(rating.value) || hasValue(rating.reviews) || popular ? (
            <div className="trem-hotel-card__topline">
              {badgeValue ? <StatusBadge {...safeHotel.badge} value={badgeValue} /> : null}

              {hasValue(rating.value) ? (
                <div className="trem-hotel-card__rating">
                  <strong>{displayValue(rating.value)}</strong>
                  {rating.labelRef ? (
                    <span>{resolveLabel(labels, rating.labelRef, rating.label || "")}</span>
                  ) : rating.label ? (
                    <span>{rating.label}</span>
                  ) : null}
                </div>
              ) : null}

              {hasValue(rating.reviews) ? (
                <span className="trem-hotel-card__reviews">{rating.reviews}</span>
              ) : null}

              {popular ? <StatusBadge value={labels.popular || "Popular"} tone="success" /> : null}
            </div>
          ) : null}

          <div className="trem-hotel-card__heading">
            <h3 title={typeof title === "string" ? title : undefined}>{title}</h3>

            {locationValue ? (
              <p className="trem-hotel-card__location">
                <Icon name="mapPin" size={17} aria-hidden="true" />
                <span>{locationValue}</span>
                {locationDistance ? <small>· {locationDistance}</small> : null}
              </p>
            ) : null}
          </div>

          {highlights.length && showSection("highlights") ? (
            <div className="trem-hotel-card__highlights">
              {(variant === "compact" ? highlights.slice(0, 2) : highlights).map(
                (highlight, index) => {
                  const text = resolveLabel(
                    labels,
                    highlight?.labelRef,
                    displayValue(highlight?.value || highlight?.label),
                  );

                  if (!text) return null;

                  return (
                    <span
                      key={getStableKey(highlight, index, "highlight")}
                      className={`trem-hotel-card__highlight trem-hotel-card__highlight--${
                        highlight?.tone || "info"
                      }`}
                    >
                      {highlight?.icon ? (
                        <Icon name={highlight.icon} size={17} aria-hidden="true" />
                      ) : null}
                      <span>{text}</span>
                    </span>
                  );
                },
              )}
            </div>
          ) : null}

          {description && showSection("description") ? (
            <p className="trem-hotel-card__description">{description}</p>
          ) : null}

          {amenities.length && showSection("amenities") ? (
            <ul className="trem-hotel-card__amenities">
              {(variant === "compact" ? amenities.slice(0, 3) : amenities).map((amenity, index) => {
                const item = typeof amenity === "string" ? { value: amenity } : amenity || {};
                const value = displayValue(item.value || item.label);

                if (!value) return null;

                return (
                  <li key={getStableKey(item, index, "amenity")}>
                    {item.icon ? <Icon name={item.icon} size={16} aria-hidden="true" /> : null}
                    <span>{value}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {facts.length && showSection("facts") ? (
            <dl className="trem-hotel-card__facts">
              {(variant === "compact" ? facts.slice(0, 2) : facts).map((fact, index) => {
                const value = displayValue(fact?.value);
                if (!value) return null;

                const factLabel = resolveLabel(labels, fact?.labelRef, displayValue(fact?.label));

                return (
                  <div key={getStableKey(fact, index, "fact")}>
                    {fact?.icon ? <Icon name={fact.icon} size={20} aria-hidden="true" /> : null}
                    <span>
                      {factLabel ? <dt>{factLabel}</dt> : null}
                      <dd>{value}</dd>
                    </span>
                  </div>
                );
              })}
            </dl>
          ) : null}
        </div>

        {hasFooterContent ? (
          <aside className="trem-hotel-card__price">
            {hasPriceContent ? (
              <>
                <div className="trem-hotel-card__price-copy">
                  {priceLabel ? <span>{priceLabel}</span> : null}
                  {priceValue ? <strong>{priceValue}</strong> : null}
                  {staySummary ? <p>{staySummary}</p> : null}
                  {priceDescription ? <small>{priceDescription}</small> : null}
                </div>

                {priceFields.length ? (
                  <dl className="trem-hotel-card__price-breakdown">
                    {priceFields.map((field, index) => {
                      const fieldLabel = resolveLabel(
                        labels,
                        field?.labelRef,
                        displayValue(field?.label),
                      );
                      const fieldValue = displayValue(field?.value);

                      if (!fieldLabel && !fieldValue) return null;

                      return (
                        <div key={getStableKey(field, index, "price-field")}>
                          <dt>
                            <span>{fieldLabel}</span>
                            {field?.help ? (
                              <InfoTooltip
                                label={`About ${fieldLabel || "this charge"}`}
                                text={field.help}
                                hide={field.id === "fee"}
                              />
                            ) : null}
                          </dt>
                          {fieldValue ? <dd>{fieldValue}</dd> : null}
                        </div>
                      );
                    })}
                  </dl>
                ) : null}
              </>
            ) : null}

            {safeHotel.cancellationNotice ? (
              <p className="trem-hotel-card__cancellation">
                <Icon name="check" size={17} aria-hidden="true" />
                <span>{safeHotel.cancellationNotice}</span>
              </p>
            ) : null}

            {hasPrimaryAction || hasSecondaryAction ? (
              <div className="trem-hotel-card__actions">
                {hasPrimaryAction ? (
                  <Button
                    text={actionText}
                    iconRight="chevronRight"
                    fullWidth
                    disabled={unavailable || !onView}
                    onClick={() => onView?.(safeHotel)}
                  />
                ) : null}

                {hasSecondaryAction ? (
                  <Button
                    text={secondaryActionText}
                    variant="outline"
                    fullWidth
                    disabled={unavailable || (!onViewRooms && !onView)}
                    onClick={() => (onViewRooms || onView)?.(safeHotel)}
                  />
                ) : null}
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </article>
  );
}

HotelCard.propTypes = {
  hotel: PropTypes.shape({
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    image: PropTypes.string,
    imageAlt: PropTypes.string,
    imageCountLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    badge: PropTypes.object,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
    location: PropTypes.object,
    highlights: PropTypes.arrayOf(PropTypes.object),
    amenities: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    facts: PropTypes.arrayOf(PropTypes.object),
    price: PropTypes.shape({
      labelRef: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    priceFields: PropTypes.arrayOf(PropTypes.object),
    priceDescriptionLabelRef: PropTypes.string,
    cancellationNotice: PropTypes.string,
    staySummary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    actionLabelRef: PropTypes.string,
    actionLabel: PropTypes.string,
    secondaryActionLabelRef: PropTypes.string,
    secondaryActionLabel: PropTypes.string,
    disabled: PropTypes.bool,
  }).isRequired,
  labels: PropTypes.object,
  variant: PropTypes.oneOf(["full", "compact", "vertical", "included"]),
  previewPriority: PropTypes.arrayOf(PropTypes.oneOf(PREVIEW_SECTIONS)),
  previewSectionLimit: PropTypes.number,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
  loading: PropTypes.bool,
  favorite: PropTypes.bool,
  popular: PropTypes.bool,
  showFavorite: PropTypes.bool,
  hideImage: PropTypes.bool,
  hidePrice: PropTypes.bool,
  hideAction: PropTypes.bool,
  onView: PropTypes.func,
  onViewRooms: PropTypes.func,
  onFavorite: PropTypes.func,
  className: PropTypes.string,
};
