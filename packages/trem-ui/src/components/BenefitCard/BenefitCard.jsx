import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import SubTitle from "../SubTitle/SubTitle.jsx";
import Paragraph from "../Paragraph/Paragraph.jsx";
import "./BenefitCard.styles.scss";

const BenefitCard = ({
  icon = "sparkles",
  title,
  description,
  variant = "default",
  className = "",
}) => {
  const classes = ["trem-benefit-card", `trem-benefit-card--${variant}`];
  if (className) classes.push(className);
  return (
    <article className={classes.join(" ")}>
      <span className="trem-benefit-card__icon" aria-hidden="true">
        <Icon name={icon} size={22} strokeWidth={1.8} />
      </span>
      <div className="trem-benefit-card__body">
        <SubTitle
          primaryClassname="trem-benefit-card__title"
          text={title}
          variant="primary"
          size="medium"
        />
        <Paragraph
          primaryClassname="trem-benefit-card__description"
          text={description}
          variant="body"
          size="small"
        />
      </div>
    </article>
  );
};

export default BenefitCard;
