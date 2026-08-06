import React from "react";
import { FormField } from "./FormElements.jsx";
import { formatTourLocation, formatTourDuration } from "../utils/format.js";

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "";

const DEFAULT_DEPARTURE_CITIES = ["Delhi", "Mumbai", "Jaipur", "Bengaluru"];

function buildDepartureOptions(tour) {
  const cities = [];
  if (tour?.city?.from) cities.push(tour.city.from);
  DEFAULT_DEPARTURE_CITIES.forEach((city) => {
    if (!cities.includes(city)) cities.push(city);
  });
  return cities;
}

function DepartureCard({ date, label, status, tag, selected, onSelect }) {
  const statusTone = status === "Available" ? "available" : "request";
  return (
    <button
      type="button"
      className={`be-departure-card${selected ? " is-selected" : ""}`}
      onClick={onSelect}
    >
      <strong className="be-departure-card__date">{label}</strong>
      <span className="be-departure-card__status">{status}</span>
      {tag && <span className={`be-departure-card__tag be-departure-card__tag--${statusTone}`}>{tag}</span>}
      {selected && <span className="be-departure-card__check" aria-hidden="true" />}
    </button>
  );
}

export default function DepartureStep({
  tour,
  trip,
  updateTrip,
  errors,
  availability,
}) {
  const seatsAvailable = availability?.seatsAvailable;
  const isLowSeats = Boolean(availability?.isLowSeats);

  const departures = [];
  if (trip.startDate) {
    const status = seatsAvailable === 0 ? "Sold out" : "Available";
    const tag = isLowSeats
      ? "Limited seats"
      : seatsAvailable != null && seatsAvailable > 0
        ? `${seatsAvailable} seats left`
        : "Fixed departure";
    departures.push({
      value: trip.startDate,
      label: formatDate(trip.startDate),
      status,
      tag,
    });
  }
  if (!departures.length) {
    departures.push({ value: "", label: "On request", status: "On request", tag: "Supplier confirmation" });
  }

  const departureCities = buildDepartureOptions(tour);
  const selectedDepartureCity = trip.departureCity || tour?.city?.from || departureCities[0];

  return (
    <div className="be-step be-step--departure">
      <div className="be-departure__tour-card">
        <div className="be-step__tour-image">
          {tour?.photo || tour?.image ? (
            <img src={tour.photo || tour.image} alt={tour.title || tour.name} />
          ) : (
            <div className="be-step__tour-placeholder">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#e5e7eb" /><path d="M8 22l5-7 4 5 3-4 4 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
          )}
        </div>
        <div className="be-step__tour-info">
          <h2 className="be-step__tour-title">{tour?.title || tour?.name}</h2>
          <p className="be-step__tour-location">{formatTourLocation(tour) || ""}</p>
          {formatTourDuration(tour) && <span className="be-step__tour-period">{formatTourDuration(tour)}</span>}
          {tour?.price?.min != null && (
            <span className="be-step__tour-price">
              From ₹{(tour.price.min || tour.price || 0).toLocaleString()}/person
            </span>
          )}
        </div>
      </div>

      <h3 className="be-step__heading">Select a departure</h3>
      <div className="be-departure__grid">
        {departures.map((departure) => (
          <DepartureCard
            key={departure.label}
            label={departure.label}
            status={departure.status}
            tag={departure.tag}
            selected={trip.startDate === departure.value || (!trip.startDate && !departure.value)}
            onSelect={() => updateTrip("startDate", departure.value)}
          />
        ))}
      </div>
      {errors.startDate && <span className="be-field__error" data-invalid="true">{errors.startDate}</span>}

      <h3 className="be-step__heading">Traveller count</h3>
      <div className="be-step__counters">
        <div className="be-counter be-counter--split">
          <div className="be-counter__text">
            <strong>Adults</strong>
            <span>12 years and above</span>
          </div>
          <div className="be-counter__controls">
            <button type="button" className="be-counter__btn" onClick={() => updateTrip("adults", Math.max(1, trip.adults - 1))} disabled={trip.adults <= 1} aria-label="Decrease Adults">−</button>
            <span className="be-counter__value">{trip.adults}</span>
            <button type="button" className="be-counter__btn" onClick={() => updateTrip("adults", Math.min(20, trip.adults + 1))} disabled={trip.adults >= 20} aria-label="Increase Adults">+</button>
          </div>
        </div>
        <div className="be-counter be-counter--split">
          <div className="be-counter__text">
            <strong>Children</strong>
            <span>2–11 years</span>
          </div>
          <div className="be-counter__controls">
            <button type="button" className="be-counter__btn" onClick={() => updateTrip("children", Math.max(0, trip.children - 1))} disabled={trip.children <= 0} aria-label="Decrease Children">−</button>
            <span className="be-counter__value">{trip.children}</span>
            <button type="button" className="be-counter__btn" onClick={() => updateTrip("children", Math.min(10, trip.children + 1))} disabled={trip.children >= 10} aria-label="Increase Children">+</button>
          </div>
        </div>
      </div>
      {errors.adults && <span className="be-field__error" data-invalid="true">{errors.adults}</span>}

      <h3 className="be-step__heading">Departure city</h3>
      <div className="be-step__row">
        <FormField
          field={{
            name: "departureCity",
            label: "Starting city",
            type: "select",
            required: true,
            placeholder: "Select city",
            options: departureCities.map((city) => ({ value: city, label: city })),
          }}
          value={selectedDepartureCity}
          error={errors.departureCity}
          onChange={updateTrip}
        />
        <FormField
          field={{
            name: "addFlights",
            label: "Add flights?",
            type: "select",
            required: false,
            placeholder: "Not now",
            options: [
              { value: "", label: "Not now" },
              { value: "flights", label: "Yes, include flights" },
            ],
          }}
          value={trip.addFlights}
          error={errors.addFlights}
          onChange={updateTrip}
        />
      </div>
    </div>
  );
}
