import React from "react";

export default function BookingTripStepView({
  labels,
  startDate,
  endDate,
  guests,
  adults,
  children,
  infants,
  maxGuests,
  fieldErrors,
  tour,
  onStartDateChange,
  onEndDateChange,
  onGuestsChange,
  onClearError,
}) {
  const maxSize = tour?.maxGroupSize;
  const seatsAvail = tour?.availability?.seatsAvailable;

  const handleAdult = (delta) => onGuestsChange("adults", Math.max(1, Number(adults || 0) + delta));
  const handleChild = (delta) => onGuestsChange("children", Math.max(0, Number(children || 0) + delta));
  const handleInfant = (delta) => onGuestsChange("infants", Math.max(0, Number(infants || 0) + delta));

  const total = Number(adults || 0) + Number(children || 0) + Number(infants || 0);
  const overMax = maxGuests && total > maxGuests;

  return (
    <div className="booking-page__card-body">
      <div className="booking-page__form-row">
        <div className="booking-page__form-group">
          <label>{labels.startDate || "Start Date"} <span className="booking-page__required">*</span></label>
          <input
            className={`booking-page__input${fieldErrors.startDate ? " has-error" : ""}`}
            type="date"
            value={startDate}
            onChange={(e) => { onStartDateChange(e.target.value); onClearError("startDate"); }}
          />
          {fieldErrors.startDate && <div className="booking-page__field-error">{fieldErrors.startDate}</div>}
        </div>
        <div className="booking-page__form-group">
          <label>{labels.endDate || "End Date"} <span className="booking-page__required">*</span></label>
          <input
            className={`booking-page__input${fieldErrors.endDate ? " has-error" : ""}`}
            type="date"
            value={endDate}
            onChange={(e) => { onEndDateChange(e.target.value); onClearError("endDate"); }}
          />
          {fieldErrors.endDate && <div className="booking-page__field-error">{fieldErrors.endDate}</div>}
        </div>
      </div>

      <div className="booking-page__form-group">
        <label>{labels.guests || "Travelers"} <span className="booking-page__required">*</span></label>
        <div className="booking-page__guest-breakdown" style={{ marginTop: 0 }}>
          <div className="booking-page__breakdown-row">
            <span>{labels.adultCount || "Adults"} <small>{labels.adultAgeHint || "12+ yrs"}</small></span>
            <div className="booking-page__qty-group">
              <button className="booking-page__qty-btn" type="button" onClick={() => handleAdult(-1)} disabled={Number(adults || 0) <= 1} aria-label="Decrease adults">−</button>
              <span className="booking-page__qty-num">{adults || 0}</span>
              <button className="booking-page__qty-btn" type="button" onClick={() => handleAdult(1)} disabled={overMax} aria-label="Increase adults">+</button>
            </div>
          </div>
          <div className="booking-page__breakdown-row">
            <span>{labels.childCount || "Children"} <small>{labels.childAgeHint || "2\u201311 yrs"}</small></span>
            <div className="booking-page__qty-group">
              <button className="booking-page__qty-btn" type="button" onClick={() => handleChild(-1)} disabled={Number(children || 0) <= 0} aria-label="Decrease children">−</button>
              <span className="booking-page__qty-num">{children || 0}</span>
              <button className="booking-page__qty-btn" type="button" onClick={() => handleChild(1)} disabled={overMax} aria-label="Increase children">+</button>
            </div>
          </div>
          <div className="booking-page__breakdown-row">
            <span>{labels.infantCount || "Infants"} <small>{labels.infantAgeHint || "0\u201323 mo"}</small></span>
            <div className="booking-page__qty-group">
              <button className="booking-page__qty-btn" type="button" onClick={() => handleInfant(-1)} disabled={Number(infants || 0) <= 0} aria-label="Decrease infants">−</button>
              <span className="booking-page__qty-num">{infants || 0}</span>
              <button className="booking-page__qty-btn" type="button" onClick={() => handleInfant(1)} disabled={overMax} aria-label="Increase infants">+</button>
            </div>
          </div>
        </div>
        {overMax && <div className="booking-page__field-error">{labels.maxExceeded || "Total travelers exceeds the maximum allowed"}</div>}
        {fieldErrors.guests && <div className="booking-page__field-error">{fieldErrors.guests}</div>}
        <span className="booking-page__hint" style={{ marginTop: "0.35rem", display: "block" }}>
          {maxSize ? `${maxSize} ${labels.maxLabel || "max total"}` : labels.flexibleGroup || "Flexible group size"}
          {seatsAvail != null ? ` \u00B7 ${seatsAvail} ${labels.seatsAvailable || "available"}` : ""}
          {total > 0 && !overMax ? ` \u00B7 ${total} ${labels.totalGuests || "total"}` : ""}
        </span>
      </div>

      {tour?.priceInfo && (
        <div className="booking-page__price-summary">
          <div>
            <span>{labels.pricePerPerson || "per person"}</span>
            <strong>{tour.priceInfo.currency || "INR"} {Number(tour.priceInfo.min || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div className="total">
            <span>{labels.totalPrice || "Estimate Cost"}</span>
            <strong>{tour.priceInfo.currency || "INR"} {Number((tour.priceInfo.min || 0) * Number(guests)).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
