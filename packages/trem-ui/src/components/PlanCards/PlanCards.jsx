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
  layout = "grid",
  hideUnavailableOnMobile = false,
  onSelect,
}) {
  const visibleItems = items.filter((item) => !item.hide);
  if (!visibleItems.length) return null;
  const liveItemCount = visibleItems.filter((item) => !item.disabled && !item.comingSoon).length;
  const resolvedLayout = layout === "adaptive"
    ? (liveItemCount > 1 ? "grid" : "horizontal-stack")
    : layout;
  const resolvedColumns = layout === "adaptive"
    ? Math.min(columns, visibleItems.length)
    : columns;

  return (
    <section
      className={[
        "trem-plan-cards",
        resolvedLayout === "horizontal-stack" ? "trem-plan-cards--horizontal-stack" : "",
        hideUnavailableOnMobile ? "trem-plan-cards--hide-unavailable-mobile" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel || title}
      style={{ "--trem-plan-cards-columns": resolvedColumns }}
    >
      <h2 className="trem-plan-cards__title">{title}</h2>
      <div className="trem-plan-cards__grid">
        {visibleItems.map((item) => (
          <PlanCard
            key={item.id}
            {...item}
            onClick={
              item.targetTab && onSelect
                ? (event) => {
                    event.preventDefault();
                    onSelect(item);
                  }
                : item.onClick
            }
          />
        ))}
      </div>
    </section>
  );
}

PlanCards.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
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
      hide: PropTypes.bool,
      comingSoon: PropTypes.bool,
      comingSoonLabel: PropTypes.string,
      mobileIcon: PropTypes.string,
      tone: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.object),
      highlightsAriaLabel: PropTypes.string,
      actionLabel: PropTypes.string,
      targetTab: PropTypes.string,
    }),
  ),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  columns: PropTypes.number,
  layout: PropTypes.oneOf(["adaptive", "grid", "horizontal-stack"]),
  hideUnavailableOnMobile: PropTypes.bool,
  onSelect: PropTypes.func,
};
