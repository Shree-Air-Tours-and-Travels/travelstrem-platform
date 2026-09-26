import React from "react";
import "./PricingCard.styles.scss";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import Paragraph from "../Paragraph/Paragraph.jsx";

const PricingCard = ({
  tour,
  labels = {},
  priceText,
  cityDisplay,
  onBook,
  onContact,
  onShare,
  isFavorited,
  onFavorite,
}) => {
  if (!tour) return null;
  const isFav = isFavorited?.(tour) ?? false;

  return (
    <aside className="pricing-card" aria-label={labels.pricingTitle || "Trip actions"}>
      <div className="pricing-card__header">
        <Button
          primaryClassName={`pricing-card__fav-toggle${isFav ? " is-fav" : ""}`}
          variant="text"
          onClick={() => onFavorite?.(tour)}
        >
          <Icon name="heart" />
          <span>{isFav ? labels.saved || "Saved" : labels.save || "Save"}</span>
        </Button>
        <Button
          primaryClassName="pricing-card__icon-button"
          variant="text"
          isCircular
          iconLeft="share"
          onClick={() => onShare(tour)}
          aria-label="Share tour"
        />
      </div>

      <div className="pricing-card__body">
        <div className="pricing-card__price">
          <span>{labels.startingFrom || "Starting from"}</span>
          <strong>{priceText}</strong>
          <Paragraph
            text={
              tour?.priceInfo?.isFinal
                ? labels.confirmedRate || "Confirmed rate"
                : labels.estimateNote || "Rate may vary by season and availability"
            }
          />
        </div>
        <div className="pricing-card__meta">
          <div className="pricing-card__fact">
            <span>{labels.route || "Route"}</span>
            <strong>{cityDisplay}</strong>
          </div>
          <div className="pricing-card__fact">
            <span>{labels.distance || "Distance"}</span>
            <strong>
              {tour.distance
                ? `${tour.distance} ${labels.kmUnit || "km"}`
                : labels.flexible || "Flexible"}
            </strong>
          </div>
        </div>
      </div>

      <div className="pricing-card__footer">
        <div className="pricing-card__action-grid">
          <Button
            primaryClassName="pricing-card__button pricing-card__button--primary"
            variant="solid"
            color="primary"
            onClick={() => onBook(tour)}
          >
            {labels.bookNow || "Book now"}
          </Button>
          <Button
            primaryClassName="pricing-card__button pricing-card__button--outline"
            variant="outline"
            onClick={() => onContact(tour)}
          >
            <Icon name="messageCircle" />
            {labels.contactAgent || "Enquire"}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default PricingCard;
