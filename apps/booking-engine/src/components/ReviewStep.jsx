import React from "react";
import { formatTourLocation } from "../utils/format.js";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function ReviewStep({ tour, trip, travellers, contact, pricing, product, addons = [], onEdit }) {
  const totalGuests = Number(trip.adults || 1) + Number(trip.children || 0) + Number(trip.infants || 0);
  const perPerson = pricing?.perPerson || 0;
  const baseTripTotal = product === "trevio"
    ? Number(pricing?.baseTripTotal ?? pricing?.baseAmount ?? 0)
    : Number(pricing?.baseTripTotal || perPerson);
  const totalPrefExtras = pricing?.totalPrefExtras || 0;
  const roomTypeExtra = pricing?.roomTypeExtra || 0;
  const perTravellerExtras = pricing?.perTravellerExtras || [];

  const formatPrefValue = (val) => {
    if (!val) return "—";
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="be-step be-step--review">
      <div className="be-review">
        <section className="be-review__section">
          <header className="be-review__section-header">
            <h3 className="be-review__heading">{product === "trevista" ? "Package Summary" : "Trip Summary"}</h3>
            <button type="button" onClick={() => onEdit?.(product === "trevista" ? "departure" : "trip")}>Edit</button>
          </header>
          <div className="be-review__card">
            <div className="be-review__card-row">
              <span className="be-review__label">Tour</span>
              <span className="be-review__value">{tour?.title || tour?.name || "—"}</span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">Location</span>
              <span className="be-review__value">{formatTourLocation(tour) || "—"}</span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">{product === "trevista" ? "Departure" : "Dates"}</span>
              <span className="be-review__value">
                {product === "trevista"
                  ? (trip.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—")
                  : `${trip.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} → ${trip.endDate ? new Date(trip.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}`}
              </span>
            </div>
            {product === "trevista" && (
              <div className="be-review__card-row">
                <span className="be-review__label">Departure city</span>
                <span className="be-review__value">{trip.departureCity || "—"}</span>
              </div>
            )}
            {product === "trevista" && (
              <div className="be-review__card-row">
                <span className="be-review__label">Flights</span>
                <span className="be-review__value">{trip.addFlights === "flights" ? "Yes, include flights" : "Not now"}</span>
              </div>
            )}
            <div className="be-review__card-row">
              <span className="be-review__label">Guests</span>
              <span className="be-review__value">{totalGuests} ({trip.adults} adults, {trip.children} children, {trip.infants} infants)</span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">Room</span>
              <span className="be-review__value">{formatPrefValue(trip.roomType)}</span>
            </div>
          </div>
        </section>

        {product === "trevista" && (
          <section className="be-review__section">
            <header className="be-review__section-header">
              <h3 className="be-review__heading">Customisation</h3>
              <button type="button" onClick={() => onEdit?.("customize")}>Edit</button>
            </header>
            <div className="be-review__card">
              <div className="be-review__card-row">
                <span className="be-review__label">Transfers</span>
                <span className="be-review__value">{formatPrefValue(trip.transport) || "—"}</span>
              </div>
              <div className="be-review__card-row">
                <span className="be-review__label">Experiences</span>
                <span className="be-review__value">
                  {addons.filter((addon) => addon.selected).length
                    ? addons.filter((addon) => addon.selected).map((addon) => addon.name).join(", ")
                    : "None"}
                </span>
              </div>
              <div className="be-review__card-row">
                <span className="be-review__label">Meal preference</span>
                <span className="be-review__value">{formatPrefValue(trip.mealPreference) || "No preference"}</span>
              </div>
              <div className="be-review__card-row">
                <span className="be-review__label">Bed preference</span>
                <span className="be-review__value">{formatPrefValue(trip.bedPreference) || "No preference"}</span>
              </div>
              {trip.notes && (
                <div className="be-review__card-row">
                  <span className="be-review__label">Notes</span>
                  <span className="be-review__value">{trip.notes}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="be-review__section">
          <header className="be-review__section-header">
            <h3 className="be-review__heading">Contact</h3>
            <button type="button" onClick={() => onEdit?.("contact")}>Edit</button>
          </header>
          <div className="be-review__card">
            <div className="be-review__card-row"><span className="be-review__label">Name</span><span className="be-review__value">{contact.name || "—"}</span></div>
            <div className="be-review__card-row"><span className="be-review__label">Email</span><span className="be-review__value">{contact.email || "—"}</span></div>
            <div className="be-review__card-row"><span className="be-review__label">Phone</span><span className="be-review__value">{contact.phone || "—"}</span></div>
          </div>
        </section>

        <section className="be-review__section">
          <header className="be-review__section-header">
            <h3 className="be-review__heading">Travellers ({travellers.length})</h3>
            <button type="button" onClick={() => onEdit?.("travellers")}>Edit</button>
          </header>
          <div className="be-review__travellers">
            {travellers.map((t, i) => (
              <div key={i} className="be-review__traveller">
                <span className="be-review__traveller-name">
                  {t.title ? `${t.title}. ` : ""}{t.firstName} {t.lastName}
                </span>
                <span className="be-review__traveller-meta">
                  {t.nationality || "—"} · {t.email || "—"}
                </span>
                {(t.mealPreference || t.packageType || t.drinkType) && (
                  <div className="be-review__traveller-prefs">
                    {t.mealPreference && <span>Meal: {formatPrefValue(t.mealPreference)}</span>}
                    {t.packageType && <span>Package: {formatPrefValue(t.packageType)}</span>}
                    {t.drinkType && <span>Drink: {formatPrefValue(t.drinkType)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {(product === "trevio" || addons.length > 0) && (
          <section className="be-review__section">
            <header className="be-review__section-header">
              <h3 className="be-review__heading">Add-ons</h3>
              <button type="button" onClick={() => onEdit?.("addons")}>Edit</button>
            </header>
            <div className="be-review__travellers">
              {addons.filter((addon) => addon.selected).length ? (
                addons.filter((addon) => addon.selected).map((addon) => (
                  <div className="be-review__card-row" key={addon.id || addon.code || addon.name}>
                    <span className="be-review__label">{addon.name || addon.label}</span>
                    <span className="be-review__value">
                      {formatMoney(
                        pricing?.breakdown?.find(
                          (row) => row.id === (addon.id || addon.code),
                        )?.amount ?? addon.price ?? addon.amount,
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <span className="be-review__empty-value">No add-ons selected</span>
              )}
            </div>
          </section>
        )}

        <section className="be-review__section">
          <h3 className="be-review__heading">Price Breakdown</h3>
          <div className="be-review__pricing">
            <div className="be-review__price-row">
              <span>Base price × {totalGuests} guests</span>
              <span>{formatMoney(baseTripTotal)}</span>
            </div>
            {roomTypeExtra !== 0 && (
              <div className="be-review__price-row">
                <span>Room preference</span>
                <span className={roomTypeExtra > 0 ? "be-review__price-positive" : "be-review__price-negative"}>
                  {roomTypeExtra > 0 ? `+${formatMoney(roomTypeExtra)}` : formatMoney(roomTypeExtra)}
                </span>
              </div>
            )}
            {product === "trevista" && Number(pricing?.transportExtra || 0) !== 0 && (
              <div className="be-review__price-row">
                <span>Transfer upgrade</span>
                <span className="be-review__price-positive">+{formatMoney(pricing.transportExtra)}</span>
              </div>
            )}
            {product === "trevista" && Number(pricing?.addonAmount || 0) > 0 && (
              <div className="be-review__price-row">
                <span>Experiences</span>
                <span className="be-review__price-positive">+{formatMoney(pricing.addonAmount)}</span>
              </div>
            )}
            {perTravellerExtras.map((extra, i) => {
              if (extra.total === 0) return null;
              return (
                <div key={i} className="be-review__price-row">
                  <span>Traveller {i + 1} preferences</span>
                  <span className={extra.total > 0 ? "be-review__price-positive" : "be-review__price-negative"}>
                    {extra.total > 0 ? `+${formatMoney(extra.total)}` : formatMoney(extra.total)}
                  </span>
                </div>
              );
            })}
            {pricing?.convenienceFee > 0 && (
              <div className="be-review__price-row">
                <span>Convenience fee</span>
                <span>{formatMoney(pricing.convenienceFee)}</span>
              </div>
            )}
            {pricing?.tax > 0 && (
              <div className="be-review__price-row">
                <span>GST</span>
                <span>{formatMoney(pricing.tax)}</span>
              </div>
            )}
            {pricing?.taxes >= 0 && pricing?.tax == null && (
              <div className="be-review__price-row">
                <span>Taxes &amp; GST</span>
                <span>{formatMoney(pricing.taxes)}</span>
              </div>
            )}
            {pricing?.discounts > 0 && (
              <div className="be-review__price-row be-review__price-negative">
                <span>Coupon discount</span>
                <span>−{formatMoney(pricing.discounts)}</span>
              </div>
            )}
            <div className="be-review__price-row be-review__price-row--total">
              <span>Total</span>
              <span>{formatMoney(pricing?.grandTotal ?? pricing?.total ?? baseTripTotal)}</span>
            </div>
            {product === "trevio" && pricing?.tokenAmount > 0 && (
              <div className="be-review__price-row be-review__price-row--token">
                <span>Token amount (pay now)</span>
                <span>{formatMoney(pricing.tokenAmount)}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {product === "trevista" && (
        <div className="be-review__note">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" /><path d="M8 5v3.5M8 10.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          After submission, our travel specialist will prepare a personalized quote for you.
        </div>
      )}
      {product === "trevista" && (
        <section className="be-review__section">
          <h3 className="be-review__heading">Payment schedule</h3>
          <div className="be-review__pricing">
            <div className="be-review__price-row">
              <span>Booking amount (due now, 30%)</span>
              <span>{formatMoney(Math.round((pricing?.total || 0) * 0.3))}</span>
            </div>
            <div className="be-review__price-row">
              <span>Balance (after quote confirmation)</span>
              <span>{formatMoney(Math.round((pricing?.total || 0) * 0.7))}</span>
            </div>
          </div>
        </section>
      )}

      {product === "trevista" && (
        <div className="be-review__terms">
          <span className="be-review__terms-check">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="3" fill="currentColor" /><path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span>
            I agree to the terms and understand that a refundable booking amount of ₹{Math.round((pricing?.total || 0) * 0.3).toLocaleString("en-IN")} will be charged now. The balance is payable after my quote is confirmed.
          </span>
        </div>
      )}
    </div>
  );
}
