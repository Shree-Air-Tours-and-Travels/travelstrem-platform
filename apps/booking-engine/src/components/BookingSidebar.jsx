import React, { useMemo, useState } from "react";
import BottomSheet from "@packages/trem-ui/components/BottomSheet/BottomSheet.jsx";
import { formatTourLocation } from "../utils/format.js";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function BookingSidebar({
  product,
  productData,
  trip,
  guestsCount,
  availability,
  computedPricing,
  couponCode = "",
  couponStatus,
  onCouponChange,
  onApplyCoupon,
  travellers = [],
}) {
  const [preferenceHelpOpen, setPreferenceHelpOpen] = useState(false);
  const data = productData || {};
  const title = data.title || data.name || "—";
  const location = formatTourLocation(data);
  const image = data.photo || data.image || "";

  const guests = Number(guestsCount || 1);
  const isTrevio = product === "trevio";
  const isV2 = !isTrevio && computedPricing?.moneyUnit === "PAISE";
  const v2Items = isV2 ? (computedPricing.items || []) : [];
  const v2Amount = (code) => Number(v2Items.find((item) => item.code === code)?.amountMinor || 0) / 100;

  const basePricePerPerson = isTrevio
    ? (data.price || trip.pricePerPerson || 0)
    : (data.price?.min || data.price || 0);

  const baseTripTotal = isV2 ? Number(computedPricing.tourSubtotalMinor || 0) / 100 : isTrevio
    ? Number(computedPricing?.baseTripTotal ?? computedPricing?.baseAmount ?? 0)
    : Number(computedPricing?.baseTripTotal || basePricePerPerson);
  const totalPrefExtras = computedPricing?.totalPrefExtras || 0;
  const addonAmount = isV2 ? Number(computedPricing.addonsSubtotalMinor || 0) / 100 : Number(computedPricing?.addonAmount || 0);
  const roomTypeExtra = Number(computedPricing?.roomTypeExtra || 0);
  const transportExtra = Number(computedPricing?.transportExtra || 0);
  const agentFee = isV2 ? Number(computedPricing.agencyFee?.customerAmountMinor || 0) / 100 : Number(computedPricing?.agentFee || 0);
  const serviceFee = Number(computedPricing?.serviceFee || 0);
  const platformFee = isV2 ? Number(computedPricing.platformFee?.amountMinor || 0) / 100 : Number(computedPricing?.platformFee || 0);
  const taxes = isV2 ? Number(computedPricing.taxAmountMinor || 0) / 100 : Number(computedPricing?.taxes ?? computedPricing?.tax ?? 0);
  const discounts = isV2 ? Number(computedPricing.discount?.amountMinor || 0) / 100 : Number(computedPricing?.discounts || 0);
  const total = isV2 ? Number(computedPricing.finalPayableMinor || 0) / 100 : isTrevio
    ? Number(computedPricing?.grandTotal ?? computedPricing?.total ?? 0)
    : Number(computedPricing?.total ?? baseTripTotal);
  const tokenAmount = computedPricing?.tokenAmount || 0;
  const tokenPercent = baseTripTotal > 0 ? Math.round((tokenAmount / baseTripTotal) * 100) : 0;

  const cancellationPolicy = data.cancellationPolicy || "";
  const seatsAvailable = availability?.seatsAvailable;
  const isLowSeats = isTrevio && Boolean(availability?.isLowSeats);
  const preferenceItems = useMemo(() => {
    const preferences = data.preferences || {};
    const items = [];
    const room = (preferences.roomTypes || []).find((option) => option.value === trip.roomType);
    if (room) items.push({ label: "Room type", value: room.label, amount: Number(room.extraPrice || 0) });

    const travellerFields = [
      ["mealPreference", "Meal", "mealPreferences"],
      ["packageType", "Package", "packageTypes"],
      ["drinkType", "Drink", "drinkTypes"],
    ];
    travellers.forEach((traveller, index) => {
      travellerFields.forEach(([field, label, optionsKey]) => {
        const selected = (preferences[optionsKey] || []).find((option) => option.value === traveller[field]);
        if (selected) {
          items.push({
            label: `${travellers.length > 1 ? `Traveller ${index + 1} · ` : ""}${label}`,
            value: selected.label,
            amount: Number(selected.extraPrice || 0),
          });
        }
      });
    });
    return items;
  }, [data.preferences, travellers, trip.roomType]);
  const preferenceDetails = (
    <div className="be-preferences-help__content">
      <p>These selections customise your trip and are included in the booking total.</p>
      {preferenceItems.length ? preferenceItems.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <span>{item.label}</span>
          <strong>{item.value}{item.amount ? ` · +${formatMoney(item.amount)}` : ""}</strong>
        </div>
      )) : (
        <div><span>Selections</span><strong>Not selected</strong></div>
      )}
      <div className="be-preferences-help__total">
        <span>Preference total</span>
        <strong>{totalPrefExtras > 0 ? `+${formatMoney(totalPrefExtras)}` : formatMoney(0)}</strong>
      </div>
    </div>
  );

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
          <span className="be-sidebar__label">{isTrevio ? "Dates" : "Departure"}</span>
          <span className="be-sidebar__value">
            {isTrevio ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}` : formatDate(trip.startDate)}
          </span>
        </div>
        {!isTrevio && trip.departureCity && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Departure city</span>
            <span className="be-sidebar__value">{trip.departureCity}</span>
          </div>
        )}
        {!isTrevio && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Flights</span>
            <span className="be-sidebar__value">{trip.addFlights === "included" ? "Included" : trip.addFlights === "flights" ? "Yes, include flights" : "Not included"}</span>
          </div>
        )}
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
        {!isTrevio && trip.transport && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Transfers</span>
            <span className="be-sidebar__value">{trip.transport}</span>
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
        <h4 className="be-sidebar__heading">Price summary</h4>
        {!isTrevio && !isV2 ? (
          <div className="be-customize__loading">Calculating your quote…</div>
        ) : <>
        {!isV2 && <div className="be-sidebar__row">
          <span className="be-sidebar__label">Per person</span>
          <span className="be-sidebar__value">{formatMoney(basePricePerPerson)}</span>
        </div>}
        <div className="be-sidebar__row">
          <span className="be-sidebar__label">Trip fare · {guests} guest{guests !== 1 ? "s" : ""}</span>
          <span className="be-sidebar__value">{formatMoney(baseTripTotal)}</span>
        </div>
        {isV2 && v2Items.filter((item) => item.category === "ADDON").map((item) => (
          <div className="be-sidebar__row" key={item.code}>
            <span className="be-sidebar__label">{item.label}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
            <span className="be-sidebar__value be-sidebar__value--positive">+{formatMoney(item.amountMinor / 100)}</span>
          </div>
        ))}
        {!isTrevio && !isV2 && roomTypeExtra > 0 && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Room upgrade</span>
            <span className="be-sidebar__value be-sidebar__value--positive">+{formatMoney(roomTypeExtra)}</span>
          </div>
        )}
        {!isTrevio && !isV2 && transportExtra > 0 && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Transfer upgrade</span>
            <span className="be-sidebar__value be-sidebar__value--positive">+{formatMoney(transportExtra)}</span>
          </div>
        )}
        {totalPrefExtras > 0 && (
          <div className="be-sidebar__row">
            <div className="be-sidebar__label be-sidebar__label--with-info">
              Preferences
              <div className="be-preferences-help">
                <button
                  type="button"
                  className="be-preferences-help__trigger"
                  aria-label="View preference price breakdown"
                  onClick={() => {
                    if (window.matchMedia("(max-width: 768px)").matches) setPreferenceHelpOpen(true);
                  }}
                >
                  i
                </button>
                <div className="be-preferences-help__tooltip" role="tooltip">{preferenceDetails}</div>
              </div>
            </div>
            <span className="be-sidebar__value be-sidebar__value--positive">+{formatMoney(totalPrefExtras)}</span>
          </div>
        )}
        {!isV2 && <div className="be-sidebar__row">
          <span className="be-sidebar__label">{isTrevio ? "Add-ons" : "Experiences"}</span>
          <span className="be-sidebar__value">{formatMoney(addonAmount)}</span>
        </div>}
        {!isTrevio && agentFee > 0 && <div className="be-sidebar__row"><span className="be-sidebar__label">Agency service fee</span><span className="be-sidebar__value">{formatMoney(agentFee)}</span></div>}
        {!isTrevio && serviceFee > 0 && <div className="be-sidebar__row"><span className="be-sidebar__label">Service fee</span><span className="be-sidebar__value">{formatMoney(serviceFee)}</span></div>}
        {!isTrevio && platformFee > 0 && <div className="be-sidebar__row"><span className="be-sidebar__label">Platform fee</span><span className="be-sidebar__value">{formatMoney(platformFee)}</span></div>}
        {(isTrevio || isV2) && taxes > 0 && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Taxes &amp; GST</span>
            <span className="be-sidebar__value">{formatMoney(taxes)}</span>
          </div>
        )}
        {discounts > 0 && (
          <div className="be-sidebar__row">
            <span className="be-sidebar__label">Coupon discount</span>
            <span className="be-sidebar__value be-sidebar__value--discount">−{formatMoney(discounts)}</span>
          </div>
        )}
        {typeof onApplyCoupon === "function" && (
          <div className="be-sidebar__coupon">
            <label htmlFor="booking-coupon">Coupon code</label>
            <div>
              <input
                id="booking-coupon"
                value={couponCode}
                onChange={(event) => onCouponChange?.(event.target.value.toUpperCase())}
                placeholder="Enter code"
              />
              <button type="button" onClick={onApplyCoupon} disabled={!couponCode.trim()}>
                Apply
              </button>
            </div>
            {couponStatus?.message && (
              <small className={couponStatus.valid ? "is-success" : "is-error"}>
                {couponStatus.message}
              </small>
            )}
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
        <p className="be-sidebar__tax-note">Inclusive of applicable tax</p>
        </>}
      </div>
      <BottomSheet open={preferenceHelpOpen} onClose={() => setPreferenceHelpOpen(false)} title="Preference breakdown">
        {preferenceDetails}
      </BottomSheet>

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
