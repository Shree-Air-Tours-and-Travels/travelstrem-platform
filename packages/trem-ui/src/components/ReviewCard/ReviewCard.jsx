import React from "react";
import "./ReviewCard.styles.scss";
import Icon from "../../icons/Icon/Icon.jsx";
import SubTitle from "../SubTitle/SubTitle.jsx";
import Paragraph from "../Paragraph/Paragraph.jsx";

const ReviewCard = ({ review }) => {
  return (
    <div className="ui-review-card">
      <img src={review.profilePic} alt={review.name} className="ui-review-card__image" />
      <div className="ui-review-card__content">
        <SubTitle primaryClassname="ui-review-card__name" text={review.name} />
        <Paragraph primaryClassname="ui-review-card__text" text={review.review} />
        <span className="ui-review-card__rating">
          <Icon name="star" size={14} /> {review.rating}
        </span>
      </div>
    </div>
  );
};

export default ReviewCard;
