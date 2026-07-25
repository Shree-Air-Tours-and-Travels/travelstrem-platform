import React from "react";

export default function BookingReviewStepView({
  labels,
  tour,
  startDate,
  endDate,
  guests,
  contactEmail,
  contactPhone,
  travelers,
  pricePreview,
  loading,
  onSubmit,
  onBack,
}) {
  const perPerson = pricePreview?.perPerson || tour?.priceInfo?.min || 0;
  const total = pricePreview?.total || perPerson * Number(guests);
  const currency = pricePreview?.currency || tour?.priceInfo?.currency || "INR";

  return (
    <div className="booking-page__card-body">
      <div className="booking-page__section-title" style={{ marginTop: 0 }}>Trip Summary</div>
      <div className="booking-page__review-grid">
        <div className="booking-page__review-row">
          <strong>{labels.tour || "Tour"}</strong>
          <span>{tour?.title || ""}</span>
        </div>
        <div className="booking-page__review-row">
          <strong>{labels.dates || "Dates"}</strong>
          <span>{startDate || "TBD"} → {endDate || "TBD"}</span>
        </div>
        <div className="booking-page__review-row">
          <strong>{labels.guests || "Travelers"}</strong>
          <span>{guests}</span>
        </div>
        <div className="booking-page__review-row">
          <strong>{labels.contact || "Contact"}</strong>
          <span>{contactEmail} · {contactPhone}</span>
        </div>
      </div>

      <div className="booking-page__section-title">{labels.travelers || "Travelers"}</div>
      <div className="booking-page__review-travelers">
        {travelers.map((traveler, index) => (
          <div key={index} className="booking-page__review-traveler">
            <div>
              <strong>{traveler.firstName || "?"} {traveler.lastName || ""}</strong>
              <span>{traveler.nationality || "Nationality not set"} · {(labels.age || "Age {value}").replace("{value}", traveler.age || "?")}</span>
            </div>
            <span>{traveler.passport ? `ID: ${traveler.passport.slice(0, 4)}****` : "No ID"}</span>
          </div>
        ))}
      </div>

      {Number(total) > 0 && (
        <div className="booking-page__price-summary" style={{ marginTop: "1rem" }}>
          <div>
            <span>{labels.pricePerPerson || "per person"}</span>
            <strong>{currency} {Number(perPerson).toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span>{labels.guests || "Travelers"}</span>
            <strong>x {guests}</strong>
          </div>
          <div className="total">
            <span>{labels.totalPrice || "Estimate Cost"}</span>
            <strong>{currency} {Number(total).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
