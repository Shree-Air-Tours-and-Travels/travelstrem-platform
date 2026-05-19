import React from "react";
import { Icon } from "@packages/trem-ui";

export default function PricingCardView({ labels, tour, priceText, cityDisplay, onBook, onContact, onShare, isFavorited, onFavorite }) {
  if (!tour) return null;

  const isFav = isFavorited?.(tour) ?? false;

  return (
    <aside className="tour-detail__booking-widget" aria-label={labels.pricingTitle || "Trip actions"}>
      <div className="tour-detail__booking-widget-header">
        <button className={`tour-detail__fav-toggle${isFav ? " is-fav" : ""}`} type="button" onClick={() => onFavorite?.(tour)}>
          <Icon name="heart" />
          <span>{isFav ? (labels.saved || "Saved") : (labels.save || "Save")}</span>
        </button>
        <button className="tour-detail__icon-button" type="button" onClick={() => onShare(tour)} aria-label="Share tour">
          <Icon name="share" />
        </button>
      </div>
      <div className="tour-detail__booking-widget-body">
        <div className="tour-detail__booking-widget-price">
          <span>{labels.startingFrom || "Starting from"}</span>
          <strong>{priceText}</strong>
          <p>{tour?.priceInfo?.isFinal ? (labels.confirmedRate || "Confirmed rate") : (labels.estimateNote || "Rate may vary by season and availability")}</p>
        </div>
        <div className="tour-detail__booking-meta">
          <div className="tour-detail__fact">
            <span>{labels.route || "Route"}</span>
            <strong>{cityDisplay}</strong>
          </div>
          <div className="tour-detail__fact">
            <span>{labels.distance || "Distance"}</span>
            <strong>{tour.distance ? `${tour.distance} ${labels.kmUnit || "km"}` : (labels.flexible || "Flexible")}</strong>
          </div>
        </div>
      </div>
      <div className="tour-detail__booking-widget-footer">
        <div className="tour-detail__action-grid">
          <button className="tour-detail__button tour-detail__button--primary" type="button" onClick={() => onBook(tour)}>
            {labels.bookNow || "Book now"}
          </button>
          <button className="tour-detail__button tour-detail__button--outline" type="button" onClick={() => onContact(tour)}>
            <Icon name="messageCircle" />
            {labels.contactAgent || "Enquire"}
          </button>
        </div>
      </div>
    </aside>
  );
}
