import React from "react";
import { Link } from "react-router-dom";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./TourCard.styles.scss";

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

const getPriceText = (tour = {}) => {
  const price = tour.priceInfo || tour.price;
  if (!price) return "Price on request";
  const currency = price.currency || "INR";
  if (Number(price.min) <= 0 && Number(price.max) <= 0) return "Price on request";
  if (price.isFinal || Number(price.min) === Number(price.max))
    return formatMoney(price.min, currency);
  return `${formatMoney(price.min, currency)} – ${formatMoney(price.max, currency)}`;
};

const getRouteText = (tour = {}) => {
  const origin = tour.city?.from || "Flexible start";
  const destination = tour.city?.to || tour.address?.city || "Curated destination";
  return `${origin} to ${destination}`;
};

const getLocationText = (tour) => {
  const city = tour.address?.city || tour.city?.to || tour.city?.from;
  const country = tour.address?.country;
  return [city, country].filter(Boolean).join(", ") || "Curated destination";
};

const getCategory = (tour) => {
  const tag = Array.isArray(tour.tags) && tour.tags.length ? tour.tags[0] : "";
  return tag ? `${tag.charAt(0).toUpperCase()}${tag.slice(1)}` : "Tour";
};

const TourCard = React.memo(function TourCard({
  tour,
  path,
  onView,
  favorited,
  onFavorite,
  isAdmin = false,
  onEdit,
  onDelete,
  className = "",
  variant = "list",
}) {
  const {
    _id,
    title,
    photo,
    photos = [],
    period = {},
    desc,
    avgRating,
    maxGroupSize,
    featured,
    reviews = [],
    tags = [],
  } = tour || {};

  const imageSrc = photo ? photo : photos?.length ? photos[0] : null;
  const numericRating = Number(avgRating);
  const displayRating = Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : "0.0";
  const priceText = getPriceText(tour);
  const routeText = getRouteText(tour);
  const locationText = getLocationText(tour);
  const category = getCategory(tour);
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
  const truncatedDesc = desc
    ? `${desc.slice(0, 170)}${desc.length > 170 ? "..." : ""}`
    : "No description";
  const showHeart =
    typeof favorited === "boolean" && typeof onFavorite === "function";
  const hasTags = Array.isArray(tags) && tags.length > 0;

  const handleClick = () => {
    if (!path && typeof onView === "function") onView(tour);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (path) return;
      onView?.(tour);
    }
  };

  const handleFavClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onFavorite?.(tour);
  };

  const handleView = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onView?.(tour);
  };

  const cardContent = (
    <>
      <div className="tour-card__media" aria-hidden={!imageSrc}>
        {showHeart && (
          <Button
            variant="text"
            isCircular
            iconLeft="heart"
            primaryClassName={`tour-card__heart${favorited ? " is-favorited" : ""}`}
            onClick={handleFavClick}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          />
        )}
        {featured && (
          <span className="tour-card__badge">
            <Icon name="bookmark" /> Trending
          </span>
        )}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title || "Tour image"}
            loading="lazy"
            className="tour-card__img"
          />
        ) : (
          <div className="tour-card__placeholder">
            <span>TravelsTREM</span>
          </div>
        )}
      </div>

      <div className="tour-card__body">
        <div className="tour-card__kicker">{routeText}</div>

        <h3
          className="tour-card__title"
          id={_id ? `tour-card-${_id}-title` : undefined}
        >
          {title || "Untitled Tour"}
        </h3>

        <div className="tour-card__meta">
          <span className="tour-card__category">
            <Icon name="bookmark" /> {category}
          </span>
          <span className="tour-card__rating">
            <strong>{displayRating}</strong> ({reviewCount})
          </span>
          <span className="tour-card__location">
            <Icon name="mapPin" /> {locationText}
          </span>
        </div>

        <p className="tour-card__desc">{truncatedDesc}</p>

        {hasTags && (
          <div className="tour-card__tags">
            {tags.slice(0, 3).map((t, i) => (
              <span key={i} className="tour-card__tag">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="tour-card__footer">
          <div className="tour-card__facts">
            <span className="tour-card__fact">
              <Icon name="calendar" /> {period?.days ?? "-"}d,{" "}
              {period?.nights ?? "-"}n
            </span>
            <span className="tour-card__fact">
              <Icon name="usersRound" /> {maxGroupSize ?? "-"} guests
            </span>
          </div>
          <div className="tour-card__actions">
            <span className="tour-card__price">
              From <strong>{priceText}</strong>
            </span>
            {variant !== "grid" && (
              <>
                <Button
                  text="View tour"
                  variant="solid"
                  color="primary"
                  size="small"
                  onClick={handleView}
                  primaryClassName="tour-card__view-btn"
                />
                {isAdmin && (
                  <div
                    className="tour-card__admin"
                    role="group"
                    aria-label="admin actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      text="Edit"
                      variant="outline"
                      color="secondary"
                      size="small"
                      onClick={onEdit}
                    />
                    <Button
                      text="Delete"
                      variant="solid"
                      color="danger"
                      size="small"
                      onClick={onDelete}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (path) {
    return (
      <Link
        to={path}
        className={`tour-card tour-card--${variant}${featured ? " is-featured" : ""}${className ? ` ${className}` : ""}`}
        aria-labelledby={_id ? `tour-card-${_id}-title` : undefined}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article
      className={`tour-card tour-card--${variant}${featured ? " is-featured" : ""}${className ? ` ${className}` : ""}`}
      aria-labelledby={_id ? `tour-card-${_id}-title` : undefined}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {cardContent}
    </article>
  );
});

export default TourCard;
