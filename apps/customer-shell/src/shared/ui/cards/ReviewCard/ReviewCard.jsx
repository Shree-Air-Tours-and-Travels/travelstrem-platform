import React from "react";
import "./ReviewCard.styles.scss";

const ReviewCard = ({ review }) => {
  return (
    <div className="ui-review-card">
      <img src={review.profilePic} alt={review.name} className="ui-review-card__image" />
      <div className="ui-review-card__content">
        <h4 className="ui-review-card__name">{review.name}</h4>
        <p className="ui-review-card__text">{review.review}</p>
        <span className="ui-review-card__rating">⭐ {review.rating}</span>
      </div>
    </div>
  );
};

export default ReviewCard;
