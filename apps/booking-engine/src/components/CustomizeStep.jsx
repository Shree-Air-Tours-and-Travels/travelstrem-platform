import React from "react";
import { FormField } from "./FormElements.jsx";

const formatMoney = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const MEAL_OPTIONS = [
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Non-vegetarian", label: "Non-vegetarian" },
  { value: "Jain meals", label: "Jain meals" },
  { value: "No preference", label: "No preference" },
];

const BED_OPTIONS = [
  { value: "Double bed", label: "Double bed" },
  { value: "Twin beds", label: "Twin beds" },
  { value: "No preference", label: "No preference" },
];

function SelectCard({ name, desc, price, currency, selected, onSelect }) {
  return (
    <div className={`be-select-card${selected ? " is-selected" : ""}`}>
      <span className={`be-select-card__pill${selected ? " is-selected" : ""}`}>
        {selected ? "Selected" : "Available"}
      </span>
      <h3 className="be-select-card__title">{name}</h3>
      <p className="be-select-card__desc">{desc}</p>
      <div className="be-select-card__amount">
        {price > 0 ? `+ ${formatMoney(price, currency)}` : "Included"}
      </div>
      <button type="button" className={`be-select-card__btn${selected ? " is-selected" : ""}`} onClick={onSelect}>
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

function OptionGrid({ options, onSelect }) {
  if (!Array.isArray(options) || options.length === 0) return null;
  return (
    <div className="be-customize__select-grid">
      {options.map((option) => (
        <SelectCard
          key={option.value}
          name={option.label || option.value}
          desc={option.desc}
          price={option.price}
          currency={option.currency}
          selected={option.selected}
          onSelect={() => onSelect(option)}
        />
      ))}
    </div>
  );
}

export default function CustomizeStep({
  trip,
  updateTrip,
  errors,
  addons = [],
  currency = "INR",
  onToggleAddon,
  roomOptions = null,
  transportOptions = null,
}) {
  return (
    <div className="be-step be-step--customize">
      <div className="be-customize__section-head">
        <div>
          <h2 className="be-customize__title">Choose your room category</h2>
          <p className="be-customize__subtitle">Pricing is calculated for the complete package duration.</p>
        </div>
      </div>
      {roomOptions ? (
        <OptionGrid
          options={roomOptions.map((option) => ({
            ...option,
            selected: trip.roomType === option.value,
          }))}
          onSelect={(option) => {
            updateTrip("roomType", option.value);
            updateTrip("roomPrice", option.price);
          }}
        />
      ) : (
        <div className="be-customize__loading">Loading room options...</div>
      )}
      {errors.roomType && <span className="be-field__error" data-invalid="true">{errors.roomType}</span>}

      <div className="be-customize__section-head">
        <div>
          <h2 className="be-customize__title">Choose local transfers</h2>
          <p className="be-customize__subtitle">Select shared or private transportation throughout the itinerary.</p>
        </div>
      </div>
      {transportOptions ? (
        <OptionGrid
          options={transportOptions.map((option) => ({
            ...option,
            selected: trip.transport === option.value,
          }))}
          onSelect={(option) => {
            updateTrip("transport", option.value);
            updateTrip("transportPrice", option.price);
          }}
        />
      ) : (
        <div className="be-customize__loading">Loading transfer options...</div>
      )}
      {errors.transport && <span className="be-field__error" data-invalid="true">{errors.transport}</span>}

      <div className="be-customize__section-head">
        <div>
          <h2 className="be-customize__title">Add experiences</h2>
          <p className="be-customize__subtitle">Selected experiences are added for all adult travellers.</p>
        </div>
      </div>
      {addons.length ? (
        <div className="be-addons" role="group" aria-label="Available add-ons">
          {addons.map((addon) => {
            const id = addon.id || addon.name;
            const selected = Boolean(addon.selected);
            return (
              <label key={id} className={`be-addon-card${selected ? " is-selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => onToggleAddon(id, event.target.checked)}
                />
                <span className="be-addon-card__check" aria-hidden="true" />
                <span className="be-addon-card__content">
                  <strong>{addon.name}</strong>
                  <span>{addon.description}</span>
                </span>
                <strong className="be-addon-card__price">
                  {addon.included ? "Included" : Number(addon.price || 0) > 0
                    ? formatMoney(addon.price, addon.currency || currency)
                    : "Free"}
                  {addon.priceLabel ? <small> · {addon.priceLabel}</small> : null}
                </strong>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="be-addons__empty">
          <strong>No optional add-ons for this tour</strong>
          <span>You can continue without changing your booking.</span>
        </div>
      )}

      <div className="be-customize__panel">
        <h3 className="be-step__heading">Special preferences</h3>
        <div className="be-step__row">
          <FormField
            field={{ name: "mealPreference", label: "Meal preference", type: "select", required: false, placeholder: "Select", options: MEAL_OPTIONS }}
            value={trip.mealPreference}
            error={errors.mealPreference}
            onChange={updateTrip}
          />
          <FormField
            field={{ name: "bedPreference", label: "Bed preference", type: "select", required: false, placeholder: "Select", options: BED_OPTIONS }}
            value={trip.bedPreference}
            error={errors.bedPreference}
            onChange={updateTrip}
          />
        </div>
        <FormField
          field={{
            name: "notes",
            label: "Notes for the holiday expert",
            type: "text",
            required: false,
            placeholder: "Anniversary setup, accessibility, elderly travellers, activity preferences...",
          }}
          value={trip.notes}
          error={errors.notes}
          onChange={updateTrip}
        />
      </div>
    </div>
  );
}
