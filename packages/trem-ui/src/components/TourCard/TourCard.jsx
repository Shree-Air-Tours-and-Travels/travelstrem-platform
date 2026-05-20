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

const getPriceParts = (tour) => {
  const price = tour.priceInfo || tour.price;
  if (!price) return { current: "Price on request", original: "" };
  const currency = price.currency || "INR";
  const current = formatMoney(price.min, currency);
  const original = Number(price.max) > Number(price.min) ? formatMoney(price.max, currency) : "";
  return { current: current || "Price on request", original };
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

const getGuideAvatar = (tour) => {
  const review = Array.isArray(tour.reviews) && tour.reviews.length ? tour.reviews[0] : null;
  return review?.avatar || review?.photo || "";
};

const TourCard = React.memo(function TourCard({ tour, path, onView, favorited, onFavorite, isAdmin = false, onEdit, onDelete, className = "", variant = "list" }) {
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
  } = tour || {};

  const imageSrc = photo ? photo : photos?.length ? photos[0] : null;
  const displayRating = Number.isFinite(avgRating) ? Number(avgRating).toFixed(1) : "0.0";
  const price = getPriceParts(tour);
  const locationText = getLocationText(tour);
  const category = getCategory(tour);
  const guideAvatar = getGuideAvatar(tour);
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
  const truncatedDesc = desc ? `${desc.slice(0, 170)}${desc.length > 170 ? "..." : ""}` : "No description";
  const showHeart = typeof favorited === "boolean" && typeof onFavorite === "function";

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
            <Icon name="bookmark" />
            Trending
          </span>
        )}
        {imageSrc ? (
          <img src={imageSrc} alt={title || "Tour image"} loading="lazy" className="tour-card__img" />
        ) : (
          <div className="tour-card__placeholder">
            <span>TravelsTREM</span>
          </div>
        )}
        <div className="tour-card__dots" aria-hidden="true">
          <span className="is-active" />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="tour-card__content">
        <div className="tour-card__header">
          <div className="tour-card__title-row">
            <h3 className="tour-card__title">{title || "Untitled Tour"}</h3>
            <div className="tour-card__taxonomy">
              <span className="tour-card__category">
                <Icon name="bookmark" />
                {category}
              </span>
              <span className="tour-card__rating">
                <strong>{displayRating}</strong>
                <span>({reviewCount || 0} Reviews)</span>
              </span>
            </div>
          </div>
          <div className="tour-card__location">
            <Icon name="mapPin" />
            <span>{locationText}</span>
          </div>
        </div>

        <p className="tour-card__desc">{truncatedDesc}</p>

        <div className="tour-card__footer">
          <div className="tour-card__facts">
            <span>
              <Icon name="calendar" />
              {period?.days ?? "-"} Day,{period?.nights ?? "-"} Night
            </span>
            <span>
              <Icon name="usersRound" />
              {maxGroupSize ?? "-"} Guests
            </span>
          </div>
          <div className="tour-card__price">
            <span className="tour-card__price-label">Starts From</span>
            <strong>{price.current}</strong>
            {price.original ? <del>{price.original}</del> : null}
            <span className="tour-card__avatar" aria-hidden="true">
              {guideAvatar ? <img src={guideAvatar} alt="" /> : <span>{String(title || "T").charAt(0)}</span>}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="tour-card__admin-actions" role="group" aria-label="admin actions" onClick={(e) => e.stopPropagation()}>
            <Button text="Edit" variant="outline" color="secondary" size="small" onClick={onEdit} />
            <Button text="Delete" variant="solid" color="danger" size="small" onClick={onDelete} />
          </div>
        )}
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
