import React from "react";
import Button from "../../../../components/Button/Button.jsx";
import Paragraph from "../../../../components/Paragraph/Paragraph.jsx";
import Icon from "../../../../icons/Icon/Icon.jsx";

export default function PricingCardView({ labels, tour, priceText, packagePrices = [], priceDisplayMode, cityDisplay, onContact, onShare, isFavorited, onFavorite }) {
  if (!tour) return null;

  const isFav = isFavorited?.(tour) ?? false;
  const seatsAvailable = tour.availability?.seatsAvailable ?? tour.seatsAvailable;
  const isSoldOut = seatsAvailable === 0;
  const hasExplicitRoute = Boolean(
    typeof tour.city === "string"
      ? tour.city.trim()
      : (tour.city?.from && tour.city?.to)
  );
  const priceLabel = priceDisplayMode === "FINAL"
    ? (packagePrices.length > 1 ? "Final package prices" : (labels.confirmedRate || "Final price"))
    : priceDisplayMode === "STARTING_FROM"
      ? (labels.startingFrom || "Starting from")
      : (labels.estimatedPrice || "Estimated price");


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
          <span>{priceLabel}</span>
          <strong>{priceText}</strong>
          <Paragraph text={tour?.priceInfo?.isFinal ? (labels.confirmedRate || "Confirmed rate") : (labels.estimateNote || "Rate may vary by season and availability")} />
        </div>
        {packagePrices.length > 0 && (
          <div className="tour-detail__package-prices" aria-label={priceDisplayMode === "FINAL" ? "Final package prices" : "Package price estimates"}>
            {packagePrices.map((item) => (
              <div className="tour-detail__package-price" key={item.key}>
                <span>{item.name}</span>
                <strong>{item.priceText}</strong>
                {item.requiresRepricing && <small>Repricing required</small>}
              </div>
            ))}
          </div>
        )}
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
      </div>
      <div className="tour-detail__booking-widget-footer">
        <div className="tour-detail__action-grid tour-detail__action-grid--1">
          <Button fullWidth primaryClassName="tour-detail__button tour-detail__button--outline" variant="outline" onClick={() => onContact(tour)}>
            <Icon name="messageCircle" />
            {labels.enquire || labels.contactAgent || "Get a quote"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
