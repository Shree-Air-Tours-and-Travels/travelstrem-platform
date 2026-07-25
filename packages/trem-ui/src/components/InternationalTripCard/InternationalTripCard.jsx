import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./InternationalTripCard.scss";

const flagEmoji = (country = "") => {
  const flags = {
    indonesia: "\uD83C\uDDEE\uD83C\uDDE9",
    vietnam: "\uD83C\uDDFB\uD83C\uDDF3",
    georgia: "\uD83C\uDDEC\uD83C\uDDEA",
    japan: "\uD83C\uDDEF\uD83C\uDDF5",
    thailand: "\uD83C\uDDF9\uD83C\uDDED",
    nepal: "\uD83C\uDDF3\uD83C\uDDF5",
    sriLanka: "\uD83C\uDDF1\uD83C\uDDF0",
    maldives: "\uD83C\uDDF2\uD83C\uDDFB",
  };
  const key = country.toLowerCase().replace(/[^a-z]/g, "");
  return flags[key] || "\uD83C\uDF0D";
};

export default function InternationalTripCard({ trip = {}, onView }) {
  const coverImage = trip.coverImage || trip.image || "";
  const country = trip.country || "";
  const title = trip.title || "";
  const location = trip.location || "";
  const duration = trip.duration || "";
  const tag = trip.tag || "";
  const price = trip.price?.amount || 0;
  const currency = trip.price?.currency || "";
  const rating = trip.rating || 0;

  return (
    <button
      type="button"
      className="intl-card"
      onClick={() => onView?.(trip)}
      aria-label={`Open ${title}`}
    >
      <div className="intl-card__book">
        <div className="intl-card__spine" aria-hidden="true" />

        <div className="intl-card__cover">
          {coverImage && (
            <img
              className="intl-card__cover-img"
              src={coverImage}
              alt={title}
              loading="lazy"
            />
          )}
          <div className="intl-card__cover-overlay" />

          <div className="intl-card__cover-content">
            <span className="intl-card__flag">{flagEmoji(country)}</span>
            <span className="intl-card__country">{country}</span>
          </div>

          <div className="intl-card__cover-footer">
            {tag && <span className="intl-card__tag">{tag}</span>}
            <span className="intl-card__duration">{duration}</span>
          </div>
        </div>

        <div className="intl-card__pages" aria-hidden="true">
          <div className="intl-card__page intl-card__page--3" />
          <div className="intl-card__page intl-card__page--2" />
          <div className="intl-card__page intl-card__page--1" />
        </div>

        <div className="intl-card__back">
          <div className="intl-card__back-content">
            <h3 className="intl-card__title">{title}</h3>
            <p className="intl-card__location">
              <Icon name="mapPin" size={14} />
              {location}
            </p>
            {rating > 0 && (
              <div className="intl-card__rating">
                <Icon name="star" size={14} />
                <span>{rating}</span>
              </div>
            )}
            {price > 0 && (
              <p className="intl-card__price">
                <span className="intl-card__price-from">From</span>
                <span className="intl-card__price-value">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  }).format(price)}
                </span>
              </p>
            )}
            <span className="intl-card__cta">
              Open itinerary
              <Icon name="arrowRight" size={16} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
