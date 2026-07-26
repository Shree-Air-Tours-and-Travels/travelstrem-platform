import React from "react";
import { FormField, CounterField } from "./FormElements.jsx";

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
};

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function TripStep({ tour, trip, updateTrip, errors, isFirst, product, seatsAvailable, tokenPerPerson }) {
  const isTrevio = product === "trevio";
  const adultsMax = isTrevio && seatsAvailable != null ? seatsAvailable : 20;
  const isLowSeats = isTrevio && seatsAvailable != null && seatsAvailable > 0 && seatsAvailable <= 3;
  const computedToken = isTrevio && tokenPerPerson > 0
    ? Math.round(tokenPerPerson * (Number(trip.adults || 1) + Number(trip.children || 0)))
    : 0;

  return (
    <div className="be-step be-step--trip">
      {tour && (
        <div className="be-step__tour-card">
          <div className="be-step__tour-image">
            {tour.photo || tour.image ? (
              <img src={tour.photo || tour.image} alt={tour.title || tour.name} />
            ) : (
              <div className="be-step__tour-placeholder">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#e5e7eb" /><path d="M8 22l5-7 4 5 3-4 4 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            )}
          </div>
          <div className="be-step__tour-info">
            <h2 className="be-step__tour-title">{tour.title || tour.name}</h2>
            <p className="be-step__tour-location">
              {tour.city || tour.location || ""}
              {tour.address ? `, ${tour.address}` : ""}
            </p>
            {tour.duration && <span className="be-step__tour-period">{tour.duration}</span>}
            {isTrevio && trip.pricePerPerson > 0 && (
              <span className="be-step__tour-price">
                {formatMoney(trip.pricePerPerson)}/person
              </span>
            )}
            {!isTrevio && tour.price && (
              <span className="be-step__tour-price">
                From ₹{(tour.price.min || tour.price || 0).toLocaleString()}/person
              </span>
            )}
          </div>
        </div>
      )}

      {isTrevio ? (
        <div className="be-step__form">
          <h3 className="be-step__heading">Trip Dates</h3>
          <div className="be-step__readonly-card">
            <div className="be-step__readonly-row">
              <span className="be-step__readonly-label">Start Date</span>
              <span className="be-step__readonly-value">{formatDate(trip.startDate)}</span>
            </div>
            <div className="be-step__readonly-row">
              <span className="be-step__readonly-label">End Date</span>
              <span className="be-step__readonly-value">{formatDate(trip.endDate)}</span>
            </div>
            {seatsAvailable != null && (
              <div className={`be-step__readonly-row ${isLowSeats ? "be-step__readonly-row--low" : ""}`}>
                <span className="be-step__readonly-label">Seats Available</span>
                <span className={`be-step__readonly-value ${isLowSeats ? "be-step__readonly-value--danger" : ""}`}>{seatsAvailable}</span>
              </div>
            )}
          </div>

          <h3 className="be-step__heading">Price</h3>
          <div className="be-step__readonly-card">
            <div className="be-step__readonly-row">
              <span className="be-step__readonly-label">Per person</span>
              <span className="be-step__readonly-value be-step__readonly-value--primary">{formatMoney(trip.pricePerPerson)}</span>
            </div>
            {computedToken > 0 && (
              <div className="be-step__readonly-row">
                <span className="be-step__readonly-label">Token amount (pay now)</span>
                <span className="be-step__readonly-value">{formatMoney(computedToken)}</span>
              </div>
            )}
          </div>

          <h3 className="be-step__heading">Guests</h3>
          <div className="be-step__counters">
            <CounterField label="Adults" value={trip.adults} onChange={(v) => updateTrip("adults", v)} min={1} max={adultsMax} />
            <CounterField label="Children" value={trip.children} onChange={(v) => updateTrip("children", v)} min={0} max={10} />
            <CounterField label="Infants" value={trip.infants} onChange={(v) => updateTrip("infants", v)} min={0} max={5} />
          </div>
          {errors.adults && <span className="be-field__error">{errors.adults}</span>}

          <h3 className="be-step__heading">Preferences</h3>
          <div className="be-step__row">
            <FormField
              field={{
                name: "roomType", label: "Room Type", type: "select",
                options: [
                  { value: "single", label: "Single" },
                  { value: "double", label: "Double" },
                  { value: "triple", label: "Triple" },
                  { value: "shared", label: "Shared" },
                ],
              }}
              value={trip.roomType}
              onChange={updateTrip}
            />
          </div>
        </div>
      ) : (
        <div className="be-step__form">
          <h3 className="be-step__heading">Travel Dates</h3>
          <div className="be-step__row">
            <FormField
              field={{ name: "startDate", label: "Start Date", type: "date", required: true }}
              value={trip.startDate}
              error={errors.startDate}
              onChange={updateTrip}
            />
            <FormField
              field={{ name: "endDate", label: "End Date", type: "date", required: true }}
              value={trip.endDate}
              error={errors.endDate}
              onChange={updateTrip}
            />
          </div>

          <h3 className="be-step__heading">Guests</h3>
          <div className="be-step__counters">
            <CounterField label="Adults" value={trip.adults} onChange={(v) => updateTrip("adults", v)} min={1} max={20} />
            <CounterField label="Children" value={trip.children} onChange={(v) => updateTrip("children", v)} min={0} max={10} />
            <CounterField label="Infants" value={trip.infants} onChange={(v) => updateTrip("infants", v)} min={0} max={5} />
          </div>
          {errors.adults && <span className="be-field__error">{errors.adults}</span>}

          <h3 className="be-step__heading">Preferences</h3>
          <div className="be-step__row">
            <FormField
              field={{
                name: "roomType", label: "Room Type", type: "select",
                options: [
                  { value: "single", label: "Single" },
                  { value: "double", label: "Double" },
                  { value: "triple", label: "Triple" },
                  { value: "shared", label: "Shared" },
                ],
              }}
              value={trip.roomType}
              onChange={updateTrip}
            />
          </div>
        </div>
      )}
    </div>
  );
}
