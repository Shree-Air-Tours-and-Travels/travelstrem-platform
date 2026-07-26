import React from "react";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function ReviewStep({ tour, trip, travellers, contact, pricing, product }) {
  const totalGuests = Number(trip.adults || 1) + Number(trip.children || 0) + Number(trip.infants || 0);
  const perPerson = pricing?.perPerson || Math.round((pricing?.total || 0) / totalGuests) || 0;

  return (
    <div className="be-step be-step--review">
      <div className="be-review">
        <section className="be-review__section">
          <h3 className="be-review__heading">Trip Summary</h3>
          <div className="be-review__card">
            <div className="be-review__card-row">
              <span className="be-review__label">Tour</span>
              <span className="be-review__value">{tour?.title || tour?.name || "—"}</span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">Location</span>
              <span className="be-review__value">{tour?.city || tour?.location || "—"}</span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">Dates</span>
              <span className="be-review__value">
                {trip.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                {" → "}
                {trip.endDate ? new Date(trip.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">Guests</span>
              <span className="be-review__value">{totalGuests} ({trip.adults} adults, {trip.children} children, {trip.infants} infants)</span>
            </div>
            <div className="be-review__card-row">
              <span className="be-review__label">Room</span>
              <span className="be-review__value">{trip.roomType || "—"}</span>
            </div>
          </div>
        </section>

        <section className="be-review__section">
          <h3 className="be-review__heading">Contact</h3>
          <div className="be-review__card">
            <div className="be-review__card-row"><span className="be-review__label">Name</span><span className="be-review__value">{contact.name || "—"}</span></div>
            <div className="be-review__card-row"><span className="be-review__label">Email</span><span className="be-review__value">{contact.email || "—"}</span></div>
            <div className="be-review__card-row"><span className="be-review__label">Phone</span><span className="be-review__value">{contact.phone || "—"}</span></div>
          </div>
        </section>

        <section className="be-review__section">
          <h3 className="be-review__heading">Travellers ({travellers.length})</h3>
          <div className="be-review__travellers">
            {travellers.map((t, i) => (
              <div key={i} className="be-review__traveller">
                <span className="be-review__traveller-name">
                  {t.title ? `${t.title}. ` : ""}{t.firstName} {t.lastName}
                </span>
                <span className="be-review__traveller-meta">
                  {t.nationality || "—"} · {t.email || "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="be-review__section">
          <h3 className="be-review__heading">Price Breakdown</h3>
          <div className="be-review__pricing">
            <div className="be-review__price-row">
              <span>Per person</span>
              <span>{formatMoney(perPerson)}</span>
            </div>
            <div className="be-review__price-row">
              <span>× {totalGuests} guests</span>
              <span>{formatMoney(perPerson * totalGuests)}</span>
            </div>
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
            <div className="be-review__price-row be-review__price-row--total">
              <span>Total</span>
              <span>{formatMoney(pricing?.total || perPerson * totalGuests)}</span>
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
    </div>
  );
}
