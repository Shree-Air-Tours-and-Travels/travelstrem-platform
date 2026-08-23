import React from "react";
import QuotePreviewDialog from "./QuotePreviewDialog";
import "./quoteDocument.css";

const fields = [
  ["basePrice", "Base tour/package cost"],
  ["flightPrice", "Flight cost"],
  ["hotelPrice", "Hotel cost"],
  ["transferPrice", "Transfers"],
  ["activitiesPrice", "Activities"],
  ["mealsPrice", "Meals"],
  ["visaFee", "Visa"],
  ["insuranceFee", "Insurance"],
  ["platformFee", "TravelsTREM platform fee"],
  ["serviceFee", "Agent/service fee"],
  ["discount", "Discount / adjustment"],
];
const pricingTypes = [
  "FIXED",
  "PER_PERSON",
  "PER_ADULT",
  "PER_CHILD",
  "PER_ROOM",
  "PER_NIGHT",
  "PER_BOOKING",
  "PERCENTAGE",
];
const number = (value) => Math.max(0, Number(value) || 0);
const catalogAmount = (item = {}) =>
  number(item.pricing?.amountMinor) / 100 ||
  number(item.price) ||
  number(String(item.cost || "").replace(/[^0-9.]/g, ""));
const catalogPricingType = (item = {}) =>
  item.perTraveller || item.pricing?.unit === "PER_PERSON"
    ? "PER_PERSON"
    : item.pricing?.unit === "PER_ROOM"
      ? "PER_ROOM"
      : item.pricing?.unit === "PER_NIGHT"
        ? "PER_NIGHT"
        : "FIXED";

export function createQuoteDraft(booking = {}, quote = {}) {
  const product = booking.trip || booking.tour || {};
  const people = number(booking.guestsCount || booking.tripSelection?.adultCount || 1);
  const catalogBase = product.price?.amount
    ? number(product.price.amount) * people
    : number(
        booking.priceSnapshot?.baseTripTotal ||
          product.price?.min * people ||
          booking.priceSnapshot?.total,
      );
  const catalogItems = [
    ...(product.extras || [])
      .filter((item) => item.active !== false && !item.included && catalogAmount(item) > 0)
      .map((item) => ({
        label: item.title || "Optional add-on",
        pricingType: catalogPricingType(item),
        unitAmount: catalogAmount(item),
        quantity: 1,
        optional: true,
        selected: false,
        catalogSource: true,
      })),
    ...(product.hotelOptions || [])
      .filter((item) => item.active !== false && catalogAmount(item) > 0)
      .map((item) => ({
        label: item.title || "Hotel upgrade",
        pricingType: catalogPricingType(item),
        unitAmount: catalogAmount(item),
        quantity: 1,
        optional: true,
        selected: false,
        catalogSource: true,
      })),
  ];
  const existingItems = Array.isArray(quote.items) ? quote.items.filter((item) => !item.code) : [];
  return {
    currency: quote.currency || product.price?.currency || booking.priceSnapshot?.currency || "INR",
    ...Object.fromEntries(fields.map(([key]) => [key, number(quote[key])])),
    basePrice: number(quote.basePrice || catalogBase),
    platformFee: number(quote.platformFee || booking.priceSnapshot?.platformFee),
    serviceFee: number(
      quote.serviceFee || booking.priceSnapshot?.serviceFee || booking.priceSnapshot?.agentFee,
    ),
    amountPayableNow: number(quote.amountPayableNow || product.price?.tokenAmount),
    expirationDate: quote.expirationDate ? String(quote.expirationDate).slice(0, 10) : "",
    balanceDueDate: quote.balanceDueDate ? String(quote.balanceDueDate).slice(0, 10) : "",
    notes: quote.notes || "",
    terms: quote.terms || product.cancellation?.policy || product.cancellationPolicy || "",
    items: existingItems.length ? existingItems : catalogItems,
  };
}

export default function QuoteComposer({ booking, value, onChange }) {
  const quote = value || createQuoteDraft(booking, booking.currentQuote);
  const update = (patch) => onChange?.({ ...quote, ...patch });
  const counts = {
    people: number(booking.guestsCount || booking.tripSelection?.adultCount || 1),
    adults: number(booking.tripSelection?.adultCount || booking.guestsCount || 1),
    children: number(booking.tripSelection?.childCount),
    rooms: number(booking.tripSelection?.roomCount || 1),
    nights: Math.max(
      1,
      Math.ceil(
        (new Date(booking.endDate || booking.travelWindow?.endDate) -
          new Date(booking.startDate || booking.travelWindow?.startDate)) /
          86400000,
      ) || 1,
    ),
  };
  const lineTotal = (item) => {
    const unit = number(item.unitAmount);
    const quantity =
      item.pricingType === "PER_PERSON"
        ? counts.people
        : item.pricingType === "PER_ADULT"
          ? counts.adults
          : item.pricingType === "PER_CHILD"
            ? counts.children
            : item.pricingType === "PER_ROOM"
              ? counts.rooms
              : item.pricingType === "PER_NIGHT"
                ? counts.nights
                : item.pricingType === "PER_BOOKING" || item.pricingType === "FIXED"
                  ? 1
                  : number(item.quantity || 1);
    return unit * quantity;
  };
  const total = Math.max(
    0,
    fields
      .filter(([key]) => key !== "discount")
      .reduce((sum, [key]) => sum + number(quote[key]), 0) +
      (quote.items || [])
        .filter((item) => item.selected !== false)
        .reduce((sum, item) => sum + number(item.amount ?? lineTotal(item)), 0) -
      number(quote.discount),
  );
  const addItem = () =>
    update({
      items: [
        ...(quote.items || []),
        {
          label: "Optional add-on",
          pricingType: "FIXED",
          unitAmount: 0,
          quantity: 1,
          optional: true,
          selected: false,
        },
      ],
    });
  const updateItem = (index, patch) =>
    update({
      items: quote.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...patch, amount: lineTotal({ ...item, ...patch }) }
          : item,
      ),
    });
  const previewQuote = { ...quote, finalAmount: total };
  return (
    <div className="trem-quote-composer">
      <div className="trem-quote-composer__caption">
        <strong>Build customer quote</strong>
        <span>Catalog values are prefilled. Verify and update before sending.</span>
      </div>
      <div className="trem-quote-composer__grid">
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min="0"
              value={quote[key] || ""}
              onChange={(event) => update({ [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="trem-quote-composer__section">
        <strong>Optional add-ons</strong>
        {quote.items.map((item, index) => (
          <div className="trem-quote-composer__line" key={index}>
            <input
              value={item.label}
              onChange={(event) => updateItem(index, { label: event.target.value })}
            />
            <select
              value={item.pricingType || "FIXED"}
              onChange={(event) => updateItem(index, { pricingType: event.target.value })}
            >
              {pricingTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={item.unitAmount || ""}
              onChange={(event) => updateItem(index, { unitAmount: event.target.value })}
            />
            <input
              type="number"
              min="0"
              value={item.quantity || 1}
              onChange={(event) => updateItem(index, { quantity: event.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={item.selected !== false}
                onChange={(event) => updateItem(index, { selected: event.target.checked })}
              />{" "}
              Include
            </label>
          </div>
        ))}
        <button type="button" onClick={addItem}>
          + Add add-on
        </button>
      </div>
      <div className="trem-quote-composer__grid">
        <label>
          Amount payable now
          <input
            type="number"
            min="0"
            value={quote.amountPayableNow || ""}
            onChange={(event) => update({ amountPayableNow: event.target.value })}
          />
        </label>
        <label>
          Quote valid until
          <input
            type="date"
            value={quote.expirationDate || ""}
            onChange={(event) => update({ expirationDate: event.target.value })}
          />
        </label>
        <label>
          Balance due date
          <input
            type="date"
            value={quote.balanceDueDate || ""}
            onChange={(event) => update({ balanceDueDate: event.target.value })}
          />
        </label>
      </div>
      <label>
        Notes
        <textarea
          value={quote.notes || ""}
          onChange={(event) => update({ notes: event.target.value })}
        />
      </label>
      <label>
        Terms / cancellation information
        <textarea
          value={quote.terms || ""}
          onChange={(event) => update({ terms: event.target.value })}
        />
      </label>
      <div className="trem-quote-composer__footer">
        <strong>Calculated total: ₹{total.toLocaleString("en-IN")}</strong>
        <QuotePreviewDialog booking={booking} quote={previewQuote} currency={quote.currency} />
      </div>
    </div>
  );
}
