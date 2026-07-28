import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import "./FavoriteCard.styles.scss";

const money = (value, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString("en-IN")}`;
  }
};

export default function FavoriteCard({ tour = {}, onView, onRemove, className }) {
  const image = tour.image || tour.photo || tour.photos?.[0];
  const price = tour.price ?? tour.priceInfo?.min;
  const currency = tour.priceInfo?.currency;
  const location = tour.location || tour.address?.city || tour.city?.to || "";
  const duration = tour.duration || (tour.period?.days || tour.period?.nights
    ? `${tour.period?.days || 0}D / ${tour.period?.nights || 0}N`
    : "");
  const rating = Number(tour.avgRating ?? tour.rating);
  const ratingLabel = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "";

  return (
    <article className={`fav-card${className ? ` ${className}` : ""}`}>
      <div className="fav-card__image" style={image ? { backgroundImage: `url("${image}")` } : undefined}>
        {ratingLabel ? (
          <span className="fav-card__rating">
            <Icon name="star" size={12} /> {ratingLabel}
          </span>
        ) : null}
        {onRemove && (
          <button
            type="button"
            className="fav-card__remove"
            aria-label="Remove from favorites"
            onClick={(e) => { e.stopPropagation(); onRemove(tour); }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
      <div className="fav-card__body">
        <h3 className="fav-card__title">{tour.title || "Saved trip"}</h3>
        {(location || duration) && (
          <p className="fav-card__meta">
            {location && <span className="fav-card__meta-item"><Icon name="mapPin" size={13} /> {location}</span>}
            {location && duration && <span className="fav-card__meta-sep">·</span>}
            {duration && <span className="fav-card__meta-item"><Icon name="calendar" size={13} /> {duration}</span>}
          </p>
        )}
        <div className="fav-card__footer">
          {price != null && (
            <span className="fav-card__price"><small>Per person</small><strong>{money(price, currency)}</strong></span>
          )}
          {onView && (
            <Button variant="text" color="primary" size="small" text="View" iconRight="arrowUpRight" onClick={() => onView(tour)} />
          )}
        </div>
      </div>
    </article>
  );
}
