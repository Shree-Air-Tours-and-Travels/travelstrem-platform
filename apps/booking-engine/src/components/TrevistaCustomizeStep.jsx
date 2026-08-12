import React from "react";
import { Button } from "@packages/trem-ui";
import { FormField } from "./FormElements.jsx";

const money = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function ChoiceGrid({ options, selected, onSelect, error }) {
  if (error)
    return <div className="be-customize__loading" role="alert">Unable to load options. Please refresh and try again.</div>;
  if (!options)
    return <div className="be-customize__loading">Loading options…</div>;
  return (
    <div className="be-customize__select-grid">
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <article
            key={option.value}
            className={`be-select-card${active ? " is-selected" : ""}`}
          >
            <span
              className={`be-select-card__pill${active ? " is-selected" : ""}`}
            >
              {active ? "Selected" : "Available"}
            </span>
            <h3 className="be-select-card__title">
              {option.label || option.value}
            </h3>
            <p className="be-select-card__desc">
              {option.desc || "Available for your complete trip."}
            </p>
            <strong className="be-select-card__amount">
              {Number(option.price || 0)
                ? `+ ${money(option.price)}`
                : "Included"}
            </strong>
            <Button
              variant={active ? "solid" : "outline"}
              color="primary"
              size="small"
              text={active ? "Selected" : "Select"}
              onClick={() => onSelect(option)}
              primaryClassName="be-select-card__btn"
            />
          </article>
        );
      })}
    </div>
  );
}

function ExperienceCard({ addon, currency, onToggle }) {
  const id = addon.id || addon.code || addon.name;
  const selected = Boolean(addon.selected);
  const included = Boolean(addon.included);
  return (
    <article className={`be-experience-card${selected ? " is-selected" : ""}`}>
      <span
        className={`be-experience-card__badge${included ? " is-included" : ""}`}
      >
        {included ? "Added" : "Optional"}
      </span>
      <h3>{addon.name}</h3>
      <p>{addon.description || "Available for your trip."}</p>
      <strong>
        {included || !Number(addon.price || 0)
          ? "Included"
          : money(addon.price, addon.currency || currency)}
      </strong>
      <Button
        variant={selected ? "solid" : "outline"}
        color="primary"
        size="small"
        text={included ? "Included" : selected ? "Added" : "Add experience"}
        disabled={included}
        onClick={() => onToggle(id, !selected)}
        primaryClassName="be-experience-card__action"
      />
    </article>
  );
}

export default function TrevistaCustomizeStep({
  trip,
  updateTrip,
  errors,
  addons = [],
  currency = "INR",
  onToggleAddon,
  roomOptions,
  transportOptions,
  optionsError,
}) {
  return (
    <div className="be-step be-step--customize">
      <div className="be-customize__section-head">
        <div>
          <h2 className="be-customize__title">Choose your room category</h2>
          <p className="be-customize__subtitle">
            Pricing is calculated for the complete package duration.
          </p>
        </div>
      </div>
      <ChoiceGrid
        options={roomOptions}
        selected={trip.roomType}
        onSelect={(option) => {
          updateTrip("roomType", option.value);
          updateTrip("roomPrice", option.price);
        }}
        error={optionsError}
      />
      {errors.roomType && (
        <span className="be-field__error">{errors.roomType}</span>
      )}
      <div className="be-customize__section-head">
        <div>
          <h2 className="be-customize__title">Choose local transfers</h2>
          <p className="be-customize__subtitle">
            Select shared or private transportation throughout the itinerary.
          </p>
        </div>
      </div>
      <ChoiceGrid
        options={transportOptions}
        selected={trip.transport}
        onSelect={(option) => {
          updateTrip("transport", option.value);
          updateTrip("transportPrice", option.price);
        }}
        error={optionsError}
      />
      <div className="be-customize__section-head">
        <div>
          <h2 className="be-customize__title">Add experiences</h2>
          <p className="be-customize__subtitle">
            Selected experiences are added for all adult travellers.
          </p>
        </div>
      </div>
      {addons.length ? (
        <div
          className="be-experiences"
          role="group"
          aria-label="Available experiences"
        >
          {addons.map((addon) => (
            <ExperienceCard
              key={addon.id || addon.code || addon.name}
              addon={addon}
              currency={currency}
              onToggle={onToggleAddon}
            />
          ))}
        </div>
      ) : (
        <div className="be-addons__empty">
          <strong>No optional experiences for this tour</strong>
          <span>You can continue without changing your booking.</span>
        </div>
      )}
      <div className="be-customize__panel">
        <h3 className="be-step__heading">Special preferences</h3>
        <div className="be-step__row">
          <FormField
            field={{
              name: "mealPreference",
              label: "Meal preference",
              type: "select",
              placeholder: "Select",
              options: [
                "Vegetarian",
                "Non-vegetarian",
                "Jain meals",
                "No preference",
              ],
            }}
            value={trip.mealPreference}
            onChange={updateTrip}
          />
          <FormField
            field={{
              name: "bedPreference",
              label: "Bed preference",
              type: "select",
              placeholder: "Select",
              options: ["Double bed", "Twin beds", "No preference"],
            }}
            value={trip.bedPreference}
            onChange={updateTrip}
          />
        </div>
        <FormField
          field={{
            name: "notes",
            label: "Notes for the holiday expert",
            type: "text",
            placeholder:
              "Anniversary setup, accessibility, elderly travellers…",
          }}
          value={trip.notes}
          onChange={updateTrip}
        />
      </div>
    </div>
  );
}
