import React from "react";

const formatMoney = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function AddOnsStep({ addons = [], currency = "INR", onToggle }) {
  return (
    <div className="be-step be-step--addons">
      <div className="be-addons__intro">
        <span className="be-addons__eyebrow">Optional</span>
        <h2>Make your trip work better for you</h2>
        <p>Select only what you need. Your total updates automatically.</p>
      </div>

      {addons.length ? (
        <div className="be-addons" role="group" aria-label="Available add-ons">
          {addons.map((addon) => {
            const id = addon.id || addon.code || addon.name;
            const selected = Boolean(addon.selected);
            return (
              <label
                key={id}
                className={`be-addon-card${selected ? " is-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => onToggle(id, event.target.checked)}
                />
                <span className="be-addon-card__check" aria-hidden="true" />
                <span className="be-addon-card__content">
                  <strong>{addon.name || addon.label}</strong>
                  <span>{addon.description}</span>
                </span>
                <strong className="be-addon-card__price">
                  {Number(addon.price || addon.amount) > 0
                    ? formatMoney(addon.price || addon.amount, currency)
                    : "Included"}
                  {addon.perTraveller ? <small> / traveller</small> : null}
                </strong>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="be-addons__empty">
          <strong>No optional add-ons for this trip</strong>
          <span>You can continue without changing your booking.</span>
        </div>
      )}
    </div>
  );
}
