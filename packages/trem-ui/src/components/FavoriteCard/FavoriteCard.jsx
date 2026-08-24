import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./FavoriteCard.styles.scss";

const money = (value, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString("en-IN")}`;
  }
};

export default function FavoriteCard({
  tour = {},
  onView,
  onRemove,
  labels = {},
  removing = false,
  className,
}) {
  const rawImage = tour.image || tour.photo || tour.photos?.[0] || tour.images?.[0];
  const image =
    typeof rawImage === "string"
      ? rawImage
      : rawImage?.url || rawImage?.src || rawImage?.secure_url || "";
  const price = Number(tour.priceInfo?.min ?? tour.price);
  const hasPrice = Number.isFinite(price);
  const currency = tour.priceInfo?.currency;
  const location = tour.location || tour.address?.city || tour.city?.to || "";
  const duration =
    tour.duration ||
    (tour.period?.days || tour.period?.nights
      ? `${tour.period?.days || 0}D / ${tour.period?.nights || 0}N`
      : "");
  const rating = Number(tour.avgRating ?? tour.rating);
  const ratingLabel = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "";
  const savedDate = tour.savedAt
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(tour.savedAt),
      )
    : "";

  return (
    <article className={`fav-card${className ? ` ${className}` : ""}`}>
      <div
        className="fav-card__image"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      >
        {tour.productLabel ? <span className="fav-card__product">{tour.productLabel}</span> : null}
        {ratingLabel ? (
          <span className="fav-card__rating">
            <Icon name="star" size={12} /> {ratingLabel}
          </span>
        ) : null}
        {onRemove && (
          <button
            type="button"
            className={`fav-card__remove${removing ? " is-removing" : ""}`}
            aria-label={labels.remove || "Remove from saved journeys"}
            title={labels.remove || "Remove from saved journeys"}
            disabled={removing}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(tour);
            }}
          >
            <Icon name={removing ? "refreshCw" : "heart"} size={20} />
          </button>
        )}
      </div>
      <div className="fav-card__body">
        <h3 className="fav-card__title">{tour.title || "Saved trip"}</h3>
        {(location || duration) && (
          <p className="fav-card__meta">
            {location && (
              <span className="fav-card__meta-item">
                <Icon name="mapPin" size={13} /> {location}
              </span>
            )}
            {location && duration && <span className="fav-card__meta-sep">·</span>}
            {duration && (
              <span className="fav-card__meta-item">
                <Icon name="calendar" size={13} /> {duration}
              </span>
            )}
          </p>
        )}
        {savedDate ? (
          <p className="fav-card__saved">
            <Icon name="bookmark" size={13} /> {labels.savedOn || "Saved on"} {savedDate}
          </p>
        ) : null}
        <div className="fav-card__footer">
          {hasPrice && (
            <span className="fav-card__price">
              <small>{labels.perPerson || "Per person"}</small>
              <strong>{money(price, currency)}</strong>
            </span>
          )}
          {onView && (
            <Button
              variant="text"
              color="primary"
              size="small"
              text={labels.view || "Explore this tour"}
              iconRight="arrowUpRight"
              disabled={removing}
              onClick={() => onView(tour)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
