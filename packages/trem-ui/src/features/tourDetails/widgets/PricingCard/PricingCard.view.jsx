import React from "react";
import Button from "../../../../components/Button/Button.jsx";
import Paragraph from "../../../../components/Paragraph/Paragraph.jsx";
import Icon from "../../../../icons/Icon/Icon.jsx";

export default function PricingCardView({ labels, tour, priceText, cityDisplay, onBook, onContact, onShare, isFavorited, onFavorite, showBookNow = false, selectedFlight, onSelectFlight, selectedActivities, onSelectActivity, selectedDeparture, onSelectDeparture }) {
  if (!tour) return null;

  const isFav = isFavorited?.(tour) ?? false;
  const seatsAvailable = tour.availability?.seatsAvailable ?? tour.seatsAvailable;
  const isSoldOut = seatsAvailable === 0;
  const packageType = tour.packageType || "fixed_departure";
  const departures = Array.isArray(tour.departures) ? tour.departures : [];
  const hasDepartures = packageType === "fixed_departure" && departures.length > 0;
  const activeDepartures = departures.filter((d) => d.status !== "cancelled" && d.status !== "completed");
  const actions = [
    ...(showBookNow ? [{ id: "book" }] : []),
    ...(packageType !== "custom" ? [{ id: "quote" }] : []),
  ];
  const hasExplicitRoute = Boolean(
    typeof tour.city === "string"
      ? tour.city.trim()
      : (tour.city?.from && tour.city?.to)
  );

  const flights = tour.flights || {};
  const hasFlights = Boolean(flights.included);
  const flightOptions = hasFlights ? [
    { value: "no", label: "Without flights", price: 0 },
    { value: "yes", label: `With flights${flights.pricePerPerson ? ` (+₹${flights.pricePerPerson.toLocaleString()}/person)` : " (included)"}`, price: flights.pricePerPerson || 0 },
  ] : [];

  const extras = Array.isArray(tour.extras) ? tour.extras : [];
  const bookableActivities = extras.filter((e) => e.category === "activity" && e.active !== false);

  return (
    <aside className="tour-detail__booking-widget" aria-label={labels.pricingTitle || "Trip actions"}>
      <div className="tour-detail__booking-widget-header">
        <Button primaryClassName={`tour-detail__fav-toggle${isFav ? " is-fav" : ""}`} variant="text" onClick={() => onFavorite?.(tour)}>
          <Icon name="heart" />
          <span>{isFav ? (labels.saved || "Saved") : (labels.save || "Save")}</span>
        </Button>
        <Button primaryClassName="tour-detail__icon-button" variant="text" isCircular iconLeft="share" onClick={() => onShare(tour)} aria-label="Share tour" />
      </div>
      {isSoldOut && (
        <div className="tour-detail__sold-out-banner">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7.13 1.66a1 1 0 011.74 0l5.8 10.05A1 1 0 0113.8 13H2.2a1 1 0 01-.87-1.27L7.13 1.66zM8 6v3m0 2.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <strong>All spots are full</strong>
            <span>Contact our agent for waitlist or alternative dates.</span>
          </div>
        </div>
      )}
      <div className="tour-detail__booking-widget-body">
        <div className="tour-detail__booking-widget-price">
          <span>{labels.startingFrom || "Starting from"}</span>
          <strong>{priceText}</strong>
          <Paragraph text={tour?.priceInfo?.isFinal ? (labels.confirmedRate || "Confirmed rate") : (labels.estimateNote || "Rate may vary by season and availability")} />
        </div>
        <div className="tour-detail__booking-meta">
          <div className="tour-detail__fact">
            <span>{hasExplicitRoute ? (labels.route || "Route") : "Destination"}</span>
            <strong>{cityDisplay}</strong>
          </div>
          {tour.distance != null && Number(tour.distance) > 0 ? (
            <div className="tour-detail__fact">
              <span>{labels.distance || "Distance"}</span>
              <strong>{tour.distance} {labels.kmUnit || "km"}</strong>
            </div>
          ) : null}
        </div>
        {hasDepartures && activeDepartures.length > 0 && (
          <div className="tour-detail__booking-options">
            <span className="tour-detail__booking-options-label">{labels.departureLabel || "Select Departure"}</span>
            <div className="tour-detail__departure-list">
              {activeDepartures.map((dep) => {
                const depId = dep._id || dep.id;
                const depDate = dep.departureDate ? new Date(dep.departureDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "";
                const returnDate = dep.returnDate ? new Date(dep.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "";
                const seatsLeft = dep.seatsAvailable != null ? dep.seatsAvailable : null;
                const isDepSoldOut = dep.status === "sold_out" || (seatsLeft !== null && seatsLeft <= 0);
                return (
                  <button key={depId} type="button" className={`tour-detail__departure-option${selectedDeparture === depId ? " is-selected" : ""}${isDepSoldOut ? " is-sold-out" : ""}`} onClick={() => !isDepSoldOut && onSelectDeparture?.(depId)} disabled={isDepSoldOut}>
                    <span className="tour-detail__departure-dates">{dep.label || `${depDate} – ${returnDate}`}</span>
                    {dep.pricing?.min != null && <span className="tour-detail__departure-price">₹{dep.pricing.min.toLocaleString("en-IN")}</span>}
                    {seatsLeft !== null && <span className="tour-detail__departure-seats">{isDepSoldOut ? "Sold out" : `${seatsLeft} left`}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {flightOptions.length > 0 && (
          <div className="tour-detail__booking-options">
            <span className="tour-detail__booking-options-label">{labels.flightsLabel || "Flights"}</span>
            <div className="tour-detail__booking-option-group">
              {flightOptions.map((opt) => (
                <button key={opt.value} type="button" className={`tour-detail__booking-option${selectedFlight === opt.value ? " is-selected" : ""}`} onClick={() => onSelectFlight?.(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {bookableActivities.length > 0 && (
          <div className="tour-detail__booking-options">
            <span className="tour-detail__booking-options-label">{labels.activitiesLabel || "Activities"}</span>
            <div className="tour-detail__booking-activities">
              {bookableActivities.map((activity, idx) => {
                const isSelected = selectedActivities?.includes(activity.title);
                return (
                  <label key={idx} className={`tour-detail__booking-activity${isSelected ? " is-selected" : ""}`}>
                    <input type="checkbox" checked={!!isSelected} onChange={() => onSelectActivity?.(activity.title)} />
                    <span>{activity.title}</span>
                    {activity.price > 0 && <span className="tour-detail__booking-activity-price">+₹{activity.price.toLocaleString()}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="tour-detail__booking-widget-footer">
        <div className={`tour-detail__action-grid tour-detail__action-grid--${actions.length}`}>
          {showBookNow && <Button fullWidth={actions.length === 1} primaryClassName="tour-detail__button tour-detail__button--primary" variant="solid" color="primary" onClick={() => onBook(tour)} disabled={isSoldOut}>
            {isSoldOut ? (labels.waitlist || "Join Waitlist") : (labels.bookNow || "Book now")}
          </Button>}
          <Button fullWidth={actions.length === 1} primaryClassName="tour-detail__button tour-detail__button--outline" variant="outline" onClick={() => onContact(tour)}>
            <Icon name="messageCircle" />
            {labels.enquire || labels.contactAgent || "Get a quote"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
