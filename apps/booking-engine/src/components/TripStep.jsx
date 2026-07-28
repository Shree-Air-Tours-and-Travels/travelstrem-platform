import React from "react";
import { FormField, CounterField } from "./FormElements.jsx";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

function buildPrefOptions(options = []) {
  if (!options.length) return [];
  return options.map((opt) => ({
    value: opt.value,
    label: opt.extraPrice > 0
      ? `${opt.label} (+${formatMoney(opt.extraPrice)})`
      : opt.extraPrice < 0
        ? `${opt.label} (${formatMoney(opt.extraPrice)})`
        : opt.label,
  }));
}

export default function TripStep({ tour, trip, updateTrip, errors, isFirst, product, seatsAvailable, isLowSeats, availabilityMessage, pricing }) {
  const isTrevio = product === "trevio";
  const adultsMax = isTrevio && seatsAvailable != null ? seatsAvailable : 20;
  const computedToken = Number(pricing?.tokenAmount || 0);
  const baseTripTotal = Number(pricing?.baseTripTotal ?? pricing?.baseAmount ?? 0);

  const prefs = isTrevio ? (tour?.preferences || {}) : {};
  const roomOptions = buildPrefOptions(prefs.roomTypes);

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
          <div className="be-step__row">
            <FormField
              field={{ name: "startDate", label: "Start Date", type: "date", readOnly: true }}
              value={trip.startDate}
              error={errors.startDate}
              onChange={updateTrip}
            />
            <FormField
              field={{ name: "endDate", label: "End Date", type: "date", readOnly: true }}
              value={trip.endDate}
              error={errors.endDate}
              onChange={updateTrip}
            />
          </div>
          <p className="be-step__hint">Trip dates are set by the itinerary and cannot be changed.</p>

          {seatsAvailable != null && (
            <div className={`be-step__seats-badge ${isLowSeats ? "be-step__seats-badge--low" : ""}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              {availabilityMessage || `${seatsAvailable} seats available`}
            </div>
          )}

          <h3 className="be-step__heading">Guests</h3>
          <div className="be-step__counters">
            <CounterField label="Adults" value={trip.adults} onChange={(v) => updateTrip("adults", v)} min={1} max={adultsMax} />
            <CounterField label="Children" value={trip.children} onChange={(v) => updateTrip("children", v)} min={0} max={10} />
            <CounterField label="Infants" value={trip.infants} onChange={(v) => updateTrip("infants", v)} min={0} max={5} />
          </div>
          {errors.adults && <span className="be-field__error">{errors.adults}</span>}

          <h3 className="be-step__heading">Preferences</h3>
          <div className="be-step__row">
            {roomOptions.length > 0 && (
              <FormField
                field={{ name: "roomType", label: "Room Type", type: "select", options: roomOptions }}
                value={trip.roomType}
                onChange={updateTrip}
              />
            )}
          </div>

          <h3 className="be-step__heading">Price Breakdown</h3>
          <div className="be-step__readonly-card">
            <div className="be-step__readonly-row">
              <span className="be-step__readonly-label">Base price × {Number(trip.adults || 1) + Number(trip.children || 0)} guests</span>
              <span className="be-step__readonly-value">{formatMoney(baseTripTotal)}</span>
            </div>
            {computedToken > 0 && (
              <div className="be-step__readonly-row be-step__readonly-row--highlight">
                <span className="be-step__readonly-label">Token amount (pay now)</span>
                <span className="be-step__readonly-value">{formatMoney(computedToken)}</span>
              </div>
            )}
          </div>

          <div className="be-step__whatsapp-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            <p>Have special requests? After booking, you can share them directly with our team on the WhatsApp group.</p>
          </div>
        </div>
      ) : (
        <div className="be-step__form">
          <h3 className="be-step__heading">Travel Dates</h3>
          <div className="be-step__row">
            <FormField
              field={{ name: "startDate", label: "Start Date", type: "date", required: true, readOnly: true }}
              value={trip.startDate}
              error={errors.startDate}
              onChange={updateTrip}
            />
            <FormField
              field={{ name: "endDate", label: "End Date", type: "date", required: true, readOnly: true }}
              value={trip.endDate}
              error={errors.endDate}
              onChange={updateTrip}
            />
          </div>
          <p className="be-step__hint">Travel dates are set by the itinerary and cannot be changed.</p>

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
