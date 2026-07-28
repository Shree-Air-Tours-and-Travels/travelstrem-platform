import React, { useEffect, useRef, useState } from "react";
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
  const cardRef = useRef(null);
  const [open, setOpen] = useState(false);
  const coverImage = trip.coverImage || trip.image || "";
  const country = trip.country || "";
  const title = trip.title || "";
  const location = trip.location || "";
  const duration = trip.duration || "";
  const tag = trip.tag || "";
  const price = trip.price?.amount || 0;
  const currency = trip.price?.currency || "";
  const rating = Number(trip.avgRating ?? trip.rating) || 0;
  const formattedPrice = price > 0
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 0,
      }).format(price)
    : "";

  useEffect(() => {
    if (!open) return undefined;
    const closeWhenOutside = (event) => {
      if (!cardRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, [open]);

  const handleClick = () => {
    const usesTouchInteraction = typeof window !== "undefined"
      && window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (usesTouchInteraction && !open) {
      setOpen(true);
      return;
    }
    onView?.(trip);
  };

  return (
    <button
      ref={cardRef}
      type="button"
      className={`intl-card${open ? " is-open" : ""}`}
      onClick={handleClick}
      aria-label={open ? `View ${title}` : `Preview ${title}`}
      aria-expanded={open}
    >
      <div className="intl-card__book">
        <div className="intl-card__back">
          <div className="intl-card__back-kicker">Inside this journey</div>
          <div className="intl-card__back-content">
            <h3 className="intl-card__title">{title}</h3>
            <p className="intl-card__location">
              <Icon name="mapPin" size={15} />
              {location}
            </p>
            <div className="intl-card__back-meta">
              {duration && <span><Icon name="calendar" size={14} />{duration}</span>}
              {rating > 0 && <span><Icon name="star" size={14} />{rating.toFixed(1)}</span>}
            </div>
            {formattedPrice && (
              <p className="intl-card__price">
                <span className="intl-card__price-from">Starting from</span>
                <span className="intl-card__price-value">{formattedPrice}</span>
              </p>
            )}
            <span className="intl-card__cta">
              View trip
              <Icon name="chevronRight" size={16} />
            </span>
          </div>
        </div>

        <div className="intl-card__pages" aria-hidden="true">
          <div className="intl-card__page intl-card__page--3" />
          <div className="intl-card__page intl-card__page--2" />
          <div className="intl-card__page intl-card__page--1" />
        </div>

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

          <div className="intl-card__cover-title">
            <span>Curated travel journal</span>
            <h3>{title}</h3>
            {location && <p><Icon name="mapPin" size={14} />{location}</p>}
            {formattedPrice && <strong>{formattedPrice}</strong>}
          </div>

          <div className="intl-card__cover-footer">
            {tag && <span className="intl-card__tag">{tag}</span>}
            <span className="intl-card__duration">{duration}</span>
          </div>
        </div>

        <div className="intl-card__spine" aria-hidden="true" />
      </div>
    </button>
  );
}
