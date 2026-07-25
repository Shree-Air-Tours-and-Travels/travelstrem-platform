import React from "react";
import "./TrevioTripCard.scss";

const money = (value, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString("en-IN")}`;
  }
};

export default function TrevioTripCard({ trip = {}, favorited = false, onFavorite, onView }) {
  const image = trip.image || trip.photo || trip.photos?.[0];
  const price = trip.price ?? trip.priceInfo?.min;
  const chips = trip.chips || trip.tags || [];
  const location = trip.location || trip.address?.city || trip.city?.to || "India";
  const duration = trip.duration || `${trip.period?.days || 0}D / ${trip.period?.nights || 0}N`;

  return (
    <article className="trevio-trip-card">
      <div className="trevio-trip-card__image" style={image ? { backgroundImage: `url("${image}")` } : undefined}>
        <span className="trevio-trip-card__tag">{trip.tag || trip.category || "Adventure"}</span>
        {trip.rating || trip.avgRating ? <span className="trevio-trip-card__rating">★ {trip.rating || trip.avgRating}</span> : null}
        <button
          type="button"
          className={`trevio-trip-card__favorite${favorited ? " is-saved" : ""}`}
          aria-label={favorited ? "Remove trip from wishlist" : "Save trip to wishlist"}
          aria-pressed={favorited}
          onClick={(event) => { event.stopPropagation(); onFavorite?.(trip); }}
        >
          <span>
            {favorited ? "♥" : "♡"}
          </span>

        </button>
      </div>
      <div className="trevio-trip-card__body">
        <h3 className="trevio-trip-card__title">{trip.title || "Trevio adventure"}</h3>
        <p className="trevio-trip-card__desc">{trip.desc || trip.description || "A thoughtfully planned group experience with local moments and a trip captain."}</p>
        <div className="trevio-trip-card__meta">📍 {location} · 🗓 {duration}</div>
        <div className="trevio-trip-card__chips">
          {chips.slice(0, 3).map((chip) => <span key={chip} className="trevio-trip-card__chip">{chip}</span>)}
        </div>
        <div className="trevio-trip-card__footer">
          <div className="trevio-trip-card__price"><small>Per person</small><strong>{money(price, trip.priceInfo?.currency)}</strong></div>
          <button type="button" className="trevio-trip-card__link" onClick={() => onView?.(trip)}>View itinerary →</button>
        </div>
      </div>
    </article>
  );
}
