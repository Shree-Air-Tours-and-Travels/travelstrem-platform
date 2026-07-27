import React from "react";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function BookingSidebar({ product, productData, trip, guestsCount, availability, computedPricing }) {
  const data = productData || {};
  const title = data.title || data.name || "—";
  const location = data.city || data.location || "";
  const image = data.photo || data.image || "";

  const guests = Number(guestsCount || 1);
  const isTrevio = product === "trevio";

  const basePricePerPerson = isTrevio
    ? (data.price || trip.pricePerPerson || 0)
    : (data.price?.min || data.price || 0);

  const baseTripTotal = computedPricing?.baseTripTotal || (basePricePerPerson * guests);
  const totalPrefExtras = computedPricing?.totalPrefExtras || 0;
  const total = computedPricing?.total || (baseTripTotal + totalPrefExtras);
  const tokenAmount = computedPricing?.tokenAmount || 0;
  const tokenPercent = baseTripTotal > 0 ? Math.round((tokenAmount / baseTripTotal) * 100) : 0;

  const cancellationPolicy = data.cancellationPolicy || "";
  const seatsAvailable = availability?.seatsAvailable;
  const isLowSeats = isTrevio && seatsAvailable != null && seatsAvailable > 0 && seatsAvailable <= 3;

  return (
    <div className="be-sidebar">
      <div className="be-sidebar__trip">
        {image && (
          <div className="be-sidebar__image">
            <img src={image} alt={title} />
          </div>
        )}
        <div className="be-sidebar__info">
          <h3 className="be-sidebar__title">{title}</h3>
          {location && <p className="be-sidebar__location">{location}</p>}
          {data.duration && <span className="be-sidebar__duration">{data.duration}</span>}
        </div>
      </div>

      <div className="be-sidebar__section">
        <h4 className="be-sidebar__heading">Trip Details</h4>
        <div className="be-sidebar__row">
          <span className="be-sidebar__label">Dates</span>
          <span className="be-sidebar__value">
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
          </span>
        </div>
        <div className="be-sidebar__row">
          <span className="be-sidebar__label">Guests</span>
          <span className="be-sidebar__value">{guestsCount || "—"}</span>
        </div>
        {trip.roomType && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Room</span>
            <span className="be-sidebar__value">{trip.roomType}</span>
          </div>
        )}
        {isTrevio && seatsAvailable != null && (
          <div className={`be-sidebar__row ${isLowSeats ? "be-sidebar__row--low-seats" : ""}`}>
            <span className="be-sidebar__label">Seats left</span>
            <span className="be-sidebar__value">{seatsAvailable}</span>
          </div>
        )}
      </div>

      <div className="be-sidebar__section">
        <h4 className="be-sidebar__heading">Price</h4>
        <div className="be-sidebar__row">
          <span className="be-sidebar__label">Per person</span>
          <span className="be-sidebar__value">{formatMoney(basePricePerPerson)}</span>
        </div>
        <div className="be-sidebar__row">
          <span className="be-sidebar__label">× {guests} guest{guests !== 1 ? "s" : ""}</span>
          <span className="be-sidebar__value">{formatMoney(baseTripTotal)}</span>
        </div>
        {totalPrefExtras > 0 && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Preferences</span>
            <span className="be-sidebar__value be-sidebar__value--positive">+{formatMoney(totalPrefExtras)}</span>
          </div>
        )}
        {tokenAmount > 0 && (
          <div className="be-sidebar__row be-sidebar__row--token">
            <span className="be-sidebar__label">Token ({tokenPercent}% of trip)</span>
            <span className="be-sidebar__value">{formatMoney(tokenAmount)}</span>
          </div>
        )}
        <div className="be-sidebar__row be-sidebar__row--total">
          <span className="be-sidebar__label">Total</span>
          <span className="be-sidebar__value">{formatMoney(total)}</span>
        </div>
      </div>

      {cancellationPolicy && (
        <div className="be-sidebar__section be-sidebar__section--policy">
          <h4 className="be-sidebar__heading">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: -2 }}>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 5v3.5M8 10.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Cancellation Policy
          </h4>
          <p className="be-sidebar__policy-text">{cancellationPolicy}</p>
        </div>
      )}

      {product === "trevista" && (
        <div className="be-sidebar__section be-sidebar__section--note">
          <p className="be-sidebar__note-text">
            After submission, our travel specialist will prepare a personalized quote for you.
          </p>
        </div>
      )}
    </div>
  );
}
