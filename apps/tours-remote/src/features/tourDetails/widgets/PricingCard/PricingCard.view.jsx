import React from "react";
import { Icon } from "@packages/trem-ui";
import { Fact } from "../../shared";

export default function PricingCardView({ labels, tour, priceText, cityDisplay, onBook, onContact, onShare }) {
    if (!tour) return null;

    return (
        <aside className="tour-detail__booking-widget" aria-label={labels.pricingTitle || "Trip actions"}>
            <div>
                <span>Starting from</span>
                <strong>{priceText}</strong>
                <p>{tour?.priceInfo?.isFinal ? "Confirmed rate" : "Rate may vary by season and availability"}</p>
            </div>
            <div className="tour-detail__booking-meta">
                <Fact label="Route" value={cityDisplay} />
                <Fact label="Distance" value={tour.distance ? `${tour.distance} km` : "Flexible"} />
            </div>
            <div className="tour-detail__action-grid">
                <button className="tour-detail__button tour-detail__button--primary" type="button" onClick={() => onBook(tour)}>
                    {labels.bookNow || "Book now"}
                </button>
                <button className="tour-detail__button" type="button" onClick={() => onContact(tour)}>
                    <Icon name="messageCircle" aria-hidden="true" />
                    {labels.contactAgent || "Enquire"}
                </button>
                <button className="tour-detail__icon-button" type="button" onClick={() => onShare(tour)} aria-label="Share tour">
                    <Icon name="share" aria-hidden="true" />
                </button>
            </div>
        </aside>
    );
}

