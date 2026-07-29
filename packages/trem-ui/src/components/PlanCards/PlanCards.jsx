import React from "react";
import PropTypes from "prop-types";
import PlanCard from "../PlanCard/PlanCard.jsx";
import "./PlanCards.styles.scss";

export default function PlanCards({
  title,
  items = [],
  ariaLabel = "",
  className = "",
  columns = 4,
  hideUnavailableOnMobile = false,
}) {
  if (!items.length) return null;

  return (
    <section
      className={[
        "trem-plan-cards",
        hideUnavailableOnMobile ? "trem-plan-cards--hide-unavailable-mobile" : "",
        className,
      ].filter(Boolean).join(" ")}
      aria-label={ariaLabel || title}
      style={{ "--trem-plan-cards-columns": columns }}
    >
      <h2 className="trem-plan-cards__title">{title}</h2>
      <div className="trem-plan-cards__grid">
        {items.map((item) => (
          <PlanCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}

PlanCards.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    productName: PropTypes.string,
    image: PropTypes.string.isRequired,
    imageAlt: PropTypes.string,
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
    ariaLabel: PropTypes.string,
    disabled: PropTypes.bool,
    comingSoon: PropTypes.bool,
    comingSoonLabel: PropTypes.string,
    mobileIcon: PropTypes.string,
    tone: PropTypes.string,
  })),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  columns: PropTypes.number,
  hideUnavailableOnMobile: PropTypes.bool,
};
