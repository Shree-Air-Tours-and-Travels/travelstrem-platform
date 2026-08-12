import React from "react";

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "";

function DepartureCard({ label, status, tag, selected, onSelect }) {
  return (
    <button type="button" className={`be-departure-card${selected ? " is-selected" : ""}`} onClick={onSelect}>
      <strong className="be-departure-card__date">{label}</strong>
      <span className="be-departure-card__status">{status}</span>
      {tag && <span className="be-departure-card__tag">{tag}</span>}
      {selected && <span className="be-departure-card__check" aria-hidden="true" />}
    </button>
  );
}

function Counter({ option, value, totalTravellers, maximumTravellers, onChange }) {
  const minimum = Number(option.minimum ?? 0);
  const typeMaximum = Number(option.maximum ?? maximumTravellers);
  const canIncrease = totalTravellers < maximumTravellers && value < typeMaximum;
  return (
    <div className="be-counter be-counter--split">
      <div className="be-counter__text"><strong>{option.label}</strong><span>{option.ageLabel}</span></div>
      <div className="be-counter__controls">
        <button type="button" className="be-counter__btn" onClick={() => onChange(Math.max(minimum, value - 1))} disabled={value <= minimum} aria-label={`Decrease ${option.label}`}>−</button>
        <span className="be-counter__value">{value}</span>
        <button type="button" className="be-counter__btn" onClick={() => onChange(value + 1)} disabled={!canIncrease} aria-label={`Increase ${option.label}`}>+</button>
      </div>
    </div>
  );
}

export default function DepartureStep({ tour, trip, updateTrip, errors, availability, travellerTypes, optionsError }) {
  const flightInventoryManaged = Boolean(tour?.flights?.included && tour?.flights?.inventoryManaged);
  const seatsAvailable = flightInventoryManaged ? availability?.seatsAvailable : null;
  const totalTravellers = Number(trip.adults || 0) + Number(trip.children || 0) + Number(trip.infants || 0);
  const configuredGroupMaximum = Number(tour?.maxGroupSize);
  const maximumTravellers = seatsAvailable == null
    ? configuredGroupMaximum
    : Math.min(configuredGroupMaximum, Number(seatsAvailable));
  const departureStatus = seatsAvailable === 0 ? "Sold out" : "Available";
  const departureTag = seatsAvailable == null ? null : `${seatsAvailable} seats left`;

  return (
    <div className="be-step be-step--departure">
      <h3 className="be-step__heading">Select a departure</h3>
      <div className="be-departure__grid">
        <DepartureCard label={formatDate(trip.startDate)} status={departureStatus} tag={departureTag} selected={Boolean(trip.startDate)} onSelect={() => updateTrip("startDate", trip.startDate)} />
      </div>
      {errors.startDate && <span className="be-field__error" data-invalid="true">{errors.startDate}</span>}

      <h3 className="be-step__heading">Traveller count</h3>
      {optionsError ? <div className="be-field__error" role="alert">Unable to load traveller options.</div> : !Array.isArray(travellerTypes) ? (
        <div className="be-customize__loading">Loading traveller options…</div>
      ) : (
        <div className="be-step__counters">
          {travellerTypes.map((option) => (
            <Counter key={option.value} option={option} value={Number(trip[option.stateField] || 0)} totalTravellers={totalTravellers} maximumTravellers={maximumTravellers} onChange={(value) => updateTrip(option.stateField, value)} />
          ))}
        </div>
      )}
      {errors.adults && <span className="be-field__error" data-invalid="true">{errors.adults}</span>}
      {flightInventoryManaged && seatsAvailable != null && <p className="be-step__availability" aria-live="polite">Live flight inventory: {seatsAvailable} seats left</p>}

      <h3 className="be-step__heading">Departure details</h3>
      <div className="be-step__row">
        <div className="be-field"><span className="be-field__label">Starting city</span><strong>{trip.departureCity || tour?.city?.from}</strong></div>
        <div className="be-field"><span className="be-field__label">Flights</span><strong>{tour?.flights?.included ? "Included with this tour" : "Not included"}</strong></div>
      </div>
    </div>
  );
}
