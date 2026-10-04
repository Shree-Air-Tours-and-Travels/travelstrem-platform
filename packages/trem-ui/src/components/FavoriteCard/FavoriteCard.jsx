import React, { useMemo, useState } from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./FavoriteCard.styles.scss";

const money = (value, currency = "INR") => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "INR"} ${amount.toLocaleString("en-IN")}`;
  }
};

const formatSavedDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
};

const resolveImage = (tour) => {
  const rawImage = tour?.image || tour?.photo || tour?.photos?.[0] || tour?.images?.[0];

  if (typeof rawImage === "string") {
    return rawImage;
  }

  return rawImage?.url || rawImage?.src || rawImage?.secure_url || "";
};

const resolveLocation = (tour) => {
  const location = tour?.location || tour?.address?.city || tour?.city?.to || "";

  if (typeof location === "string") {
    return location;
  }

  return location?.label || location?.name || location?.city || "";
};

const resolveDuration = (tour) => {
  if (tour?.duration) {
    return String(tour.duration);
  }

  const days = Number(tour?.period?.days);
  const nights = Number(tour?.period?.nights);

  const hasDays = Number.isFinite(days) && days > 0;

  const hasNights = Number.isFinite(nights) && nights > 0;

  if (!hasDays && !hasNights) {
    return "";
  }

  if (hasDays && hasNights) {
    return `${days}D / ${nights}N`;
  }

  if (hasDays) {
    return `${days} ${days === 1 ? "Day" : "Days"}`;
  }

  return `${nights} ${nights === 1 ? "Night" : "Nights"}`;
};

export default function FavoriteCard({
  tour = {},
  onView,
  onRemove,
  labels = {},
  removing = false,
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const image = useMemo(() => resolveImage(tour), [tour]);

  const price = Number(tour?.priceInfo?.min ?? tour?.price);

  const hasPrice = Number.isFinite(price);

  const currency = tour?.priceInfo?.currency || "INR";

  const location = useMemo(() => resolveLocation(tour), [tour]);

  const duration = useMemo(() => resolveDuration(tour), [tour]);

  const rating = Number(tour?.avgRating ?? tour?.rating);

  const ratingLabel = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "";

  const savedDate = useMemo(() => formatSavedDate(tour?.savedAt), [tour?.savedAt]);

  const title = tour?.title || "Saved trip";

  const productLabel = tour?.productLabel || "";

  const showImage = Boolean(image) && !imageFailed;

  const rootClassName = [
    "fav-card",
    removing ? "fav-card--removing" : "",
    !showImage ? "fav-card--no-image" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleRemove = (event) => {
    event.stopPropagation();

    if (removing || !onRemove) {
      return;
    }

    onRemove(tour);
  };

  return (
    <article className={rootClassName} aria-busy={removing}>
      {/* ================================================================ */}
      {/* Media                                                            */}
      {/* ================================================================ */}

      <div className="fav-card__media">
        {showImage ? (
          <img
            className="fav-card__image"
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="fav-card__image-fallback" aria-hidden="true">
            <Icon name="mapPin" size={28} />

            <span>{labels.noImage || "Journey"}</span>
          </div>
        )}

        <div className="fav-card__media-overlay" aria-hidden="true" />

        {/* -------------------------------------------------------------- */}
        {/* Top controls                                                   */}
        {/* -------------------------------------------------------------- */}

        <div className="fav-card__media-top">
          {onRemove ? (
            <button
              type="button"
              className={["fav-card__remove", removing ? "is-removing" : ""]
                .filter(Boolean)
                .join(" ")}
              aria-label={labels.remove || "Remove from saved journeys"}
              title={labels.remove || "Remove from saved journeys"}
              disabled={removing}
              onClick={handleRemove}
            >
              <Icon name={removing ? "refreshCw" : "heart"} size={18} />
            </button>
          ) : (
            <span />
          )}

          {ratingLabel ? (
            <span className="fav-card__rating">
              <Icon name="star" size={12} />

              <span>{ratingLabel}</span>
            </span>
          ) : null}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Bottom media content                                           */}
        {/* -------------------------------------------------------------- */}

        <div className="fav-card__media-bottom">
          {productLabel ? <span className="fav-card__product">{productLabel}</span> : null}

          {duration ? (
            <span className="fav-card__duration-badge">
              <Icon name="calendar" size={12} />

              {duration}
            </span>
          ) : null}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Content                                                          */}
      {/* ================================================================ */}

      <div className="fav-card__body">
        <div className="fav-card__main">
          <div className="fav-card__heading">
            <h3 className="fav-card__title" title={title}>
              {title}
            </h3>

            {location ? (
              <div className="fav-card__location">
                <Icon name="mapPin" size={13} />

                <span title={location}>{location}</span>
              </div>
            ) : null}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Meta                                                         */}
          {/* ------------------------------------------------------------ */}

          {duration || savedDate ? (
            <div className="fav-card__meta">
              {duration ? (
                <span className="fav-card__meta-item fav-card__meta-item--duration">
                  <Icon name="calendar" size={13} />

                  <span>{duration}</span>
                </span>
              ) : null}

              {savedDate ? (
                <span className="fav-card__meta-item fav-card__meta-item--saved">
                  <Icon name="bookmark" size={13} />

                  <span>
                    {labels.savedOn || "Saved"} {savedDate}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ================================================================ */}
        {/* Footer                                                           */}
        {/* ================================================================ */}

        <div className="fav-card__footer">
          <div className="fav-card__price-area">
            {hasPrice ? (
              <div className="fav-card__price">
                <span className="fav-card__price-label">
                  {labels.startingFrom || labels.perPerson || "Starting from"}
                </span>

                <div className="fav-card__price-value">
                  <strong>{money(price, currency)}</strong>

                  <small>{labels.perPersonSuffix || "/ person"}</small>
                </div>
              </div>
            ) : (
              <span className="fav-card__price-placeholder">
                {labels.priceOnRequest || "Price on request"}
              </span>
            )}
          </div>

          {onView ? (
            <Button
              type="button"
              variant="text"
              color="primary"
              size="small"
              text={labels.view || "View tour"}
              iconRight="arrowUpRight"
              iconSize={15}
              disabled={removing}
              primaryClassName="fav-card__view"
              onClick={() => onView(tour)}
            />
          ) : null}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Removing overlay                                                  */}
      {/* ================================================================ */}

      {removing ? (
        <div className="fav-card__removing-overlay" aria-hidden="true">
          <span className="fav-card__removing-indicator">
            <Icon name="refreshCw" size={17} />
          </span>
        </div>
      ) : null}
    </article>
  );
}
