import React from "react";
import InfoTooltip from "../InfoTooltip/InfoTooltip.jsx";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import Preloader from "../Preloader/Preloader.jsx";
import "./HotelCard.styles.scss";

export default function HotelCard({
  hotel,
  labels = {},
  variant = "full",
  previewPriority = ["highlights", "amenities", "description", "facts"],
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
  if (hidden) return null;
  if (loading)
    return <Preloader variant="featured" label={labels.loading || ""} className={className} />;

  const unavailable = disabled || hotel.disabled;
  const rating = typeof hotel.rating === "object" ? hotel.rating : { value: hotel.rating };
  const availablePreviewSections = {
    highlights: Boolean(hotel.highlights?.length),
    amenities: Boolean(hotel.amenities?.length),
    description: Boolean(hotel.description?.trim()),
    facts: Boolean(hotel.facts?.length),
  };
  const compactSections = new Set(
    previewPriority.filter((section) => availablePreviewSections[section]).slice(0, previewSectionLimit),
  );
  const showSection = (section) => variant !== "compact" || compactSections.has(section);

  return (
    <article
      className={`trem-hotel-card trem-hotel-card--${variant}${unavailable ? " trem-hotel-card--disabled" : ""}${hideImage || !hotel.image ? " trem-hotel-card--no-image" : ""}${hidePrice ? " trem-hotel-card--no-price" : ""}${hidePrice && hideAction ? " trem-hotel-card--no-footer" : ""} ${className}`}
      aria-disabled={unavailable || undefined}
    >
      {!hideImage && hotel.image ? (
        <div className="trem-hotel-card__media">
          <img src={hotel.image} alt={hotel.imageAlt || hotel.title} loading="lazy" />
          {showFavorite && onFavorite ? (
            <Button
              primaryClassName="trem-hotel-card__favorite"
              variant="text"
              iconLeft="heart"
              isCircular
              aria-label={favorite ? labels.removeFavorite : labels.addFavorite}
              aria-pressed={favorite}
              disabled={unavailable}
              onClick={() => onFavorite(hotel, !favorite)}
            />
          ) : null}
          {hotel.imageCountLabel ? (
            <span className="trem-hotel-card__photo-count">
              <Icon name="camera" size={17} aria-hidden="true" />
              {hotel.imageCountLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="trem-hotel-card__body">
        <div className="trem-hotel-card__topline">
          {hotel.badge?.value ? <StatusBadge {...hotel.badge} /> : null}
          {rating.value != null ? (
            <div className="trem-hotel-card__rating">
              <strong>{rating.value}</strong>
              {rating.labelRef ? <span>{labels[rating.labelRef]}</span> : null}
            </div>
          ) : null}
          {rating.reviews ? (
            <span className="trem-hotel-card__reviews">{rating.reviews}</span>
          ) : null}
          {popular ? <StatusBadge value={labels.popular} tone="success" /> : null}
        </div>

        <div className="trem-hotel-card__heading">
          <h3>{hotel.title}</h3>
          {hotel.location?.value || hotel.subtitle ? (
            <p className="trem-hotel-card__location">
              <Icon name="mapPin" size={17} aria-hidden="true" />
              <span>{hotel.location?.value || hotel.subtitle}</span>
              {hotel.location?.distance ? <small>· {hotel.location.distance}</small> : null}
            </p>
          ) : null}
        </div>

        {hotel.highlights?.length && showSection("highlights") ? (
          <div className="trem-hotel-card__highlights">
            {(variant === "compact" ? hotel.highlights.slice(0, 2) : hotel.highlights).map((highlight) => (
              <span
                key={highlight.id}
                className={`trem-hotel-card__highlight trem-hotel-card__highlight--${highlight.tone || "info"}`}
              >
                <Icon name={highlight.icon} size={17} aria-hidden="true" />
                {labels[highlight.labelRef]}
              </span>
            ))}
          </div>
        ) : null}

        {hotel.description && showSection("description") ? <p className="trem-hotel-card__description">{hotel.description}</p> : null}

        {hotel.amenities?.length && showSection("amenities") ? (
          <ul className="trem-hotel-card__amenities">
            {(variant === "compact" ? hotel.amenities.slice(0, 3) : hotel.amenities).map((amenity) => {
              const item = typeof amenity === "string" ? { value: amenity } : amenity;
              return (
                <li key={item.value}>
                  {item.icon ? <Icon name={item.icon} size={16} aria-hidden="true" /> : null}
                  {item.value}
                </li>
              );
            })}
          </ul>
        ) : null}

        {hotel.facts?.length && showSection("facts") ? (
          <dl className="trem-hotel-card__facts">
            {(variant === "compact" ? hotel.facts.slice(0, 2) : hotel.facts).map((fact) => (
              <div key={fact.id}>
                <Icon name={fact.icon} size={20} aria-hidden="true" />
                <span>
                  <dt>{labels[fact.labelRef]}</dt>
                  <dd>{fact.value}</dd>
                </span>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {!hidePrice || !hideAction ? (
        <aside className="trem-hotel-card__price">
          {!hidePrice ? (
            <>
              <div className="trem-hotel-card__price-copy">
                <span>{labels[hotel.price?.labelRef]}</span>
                <strong>{hotel.price?.value}</strong>
                <p>{hotel.staySummary}</p>
                <small>{labels[hotel.priceDescriptionLabelRef] || labels.priceIncludesFees}</small>
              </div>
              {hotel.priceFields?.length ? (
                <dl className="trem-hotel-card__price-breakdown">
                  {hotel.priceFields.map((field) => (
                    <div key={field.id}>
                      <dt>{labels[field.labelRef]}{field.help ? <InfoTooltip label={`About ${labels[field.labelRef]}`} text={field.help} hide={field.id === "fee"} /> : null}</dt>
                      <dd>{field.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          ) : null}
          {hotel.cancellationNotice ? (
            <p className="trem-hotel-card__cancellation">
              <Icon name="check" size={17} aria-hidden="true" />
              {hotel.cancellationNotice}
            </p>
          ) : null}
          {!hideAction ? (
            <div className="trem-hotel-card__actions">
              <Button
                text={unavailable ? labels.unavailable : labels[hotel.actionLabelRef]}
                iconRight="chevronRight"
                fullWidth
                disabled={unavailable || !onView}
                onClick={() => onView?.(hotel)}
              />
              {hotel.secondaryActionLabelRef && variant !== "compact" ? (
                <Button
                  text={labels[hotel.secondaryActionLabelRef]}
                  variant="outline"
                  fullWidth
                  disabled={unavailable || (!onViewRooms && !onView)}
                  onClick={() => (onViewRooms || onView)?.(hotel)}
                />
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}
    </article>
  );
}

HotelCard.propTypes = {
  hotel: PropTypes.shape({
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    imageAlt: PropTypes.string,
    imageCountLabel: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    badge: PropTypes.object,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
    location: PropTypes.object,
    highlights: PropTypes.arrayOf(PropTypes.object),
    amenities: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    facts: PropTypes.arrayOf(PropTypes.object),
    price: PropTypes.shape({ labelRef: PropTypes.string, value: PropTypes.string }),
    priceFields: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        labelRef: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ),
    priceDescriptionLabelRef: PropTypes.string,
    cancellationNotice: PropTypes.string,
    staySummary: PropTypes.string,
    actionLabelRef: PropTypes.string,
    secondaryActionLabelRef: PropTypes.string,
    disabled: PropTypes.bool,
  }).isRequired,
  labels: PropTypes.object,
  variant: PropTypes.oneOf(["full", "compact", "vertical"]),
  previewPriority: PropTypes.arrayOf(PropTypes.oneOf(["highlights", "amenities", "description", "facts"])),
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
