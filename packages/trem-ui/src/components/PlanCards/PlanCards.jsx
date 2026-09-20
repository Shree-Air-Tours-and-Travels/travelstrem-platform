import React from "react";
import PropTypes from "prop-types";

import Icon from "../../icons/Icon/Icon.jsx";
import PlanCard from "../PlanCard/PlanCard.jsx";

import "./PlanCards.styles.scss";

export default function PlanCards({
  eyebrow,
  eyebrowIcon = "sparkles",
  title,
  description,
  items = [],
  ariaLabel = "",
  className = "",
  columns = 4,
  layout = "grid",
  hideUnavailableOnMobile = false,
  onSelect,
}) {
  const visibleItems = items.filter((item) => !item.hide);

  if (!visibleItems.length) {
    return null;
  }

  const liveItemCount = visibleItems.filter((item) => !item.disabled && !item.comingSoon).length;

  const mobileVisibleItemCount = hideUnavailableOnMobile ? liveItemCount : visibleItems.length;

  const resolvedLayout =
    layout === "adaptive" ? (liveItemCount > 1 ? "grid" : "horizontal-stack") : layout;

  /*
   * Prevent empty grid columns.
   *
   * columns = 4
   * items   = 3
   *
   * result = 3 columns
   */
  const resolvedColumns = Math.max(1, Math.min(columns, visibleItems.length));

  const rootClassName = [
    "trem-plan-cards",

    resolvedLayout === "horizontal-stack"
      ? "trem-plan-cards--horizontal-stack"
      : "trem-plan-cards--grid",

    hideUnavailableOnMobile ? "trem-plan-cards--hide-unavailable-mobile" : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={rootClassName}
      aria-label={ariaLabel || title}
      data-count={visibleItems.length}
      data-mobile-count={mobileVisibleItemCount}
      style={{
        "--trem-plan-cards-columns": resolvedColumns,
      }}
    >
      <div className="trem-plan-cards__heading">
        {eyebrow ? (
          <span className="trem-plan-cards__eyebrow">
            <Icon name={eyebrowIcon} size={15} aria-hidden="true" />

            <span>{eyebrow}</span>
          </span>
        ) : null}

        <h2 className="trem-plan-cards__title">{title}</h2>

        {description ? <p className="trem-plan-cards__description">{description}</p> : null}
      </div>

      <div className="trem-plan-cards__grid">
        {visibleItems.map((item) => {
          const cardClassName = ["trem-plan-card--collection", item.className]
            .filter(Boolean)
            .join(" ");

          const handleClick =
            item.targetTab && onSelect
              ? (event) => {
                  event.preventDefault();

                  onSelect(item);
                }
              : item.onClick;

          return (
            <PlanCard key={item.id} {...item} className={cardClassName} onClick={handleClick} />
          );
        })}
      </div>
    </section>
  );
}

PlanCards.propTypes = {
  eyebrow: PropTypes.string,
  eyebrowIcon: PropTypes.string,

  title: PropTypes.string.isRequired,

  description: PropTypes.string,

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

      onClick: PropTypes.func,

      className: PropTypes.string,
    }),
  ),

  ariaLabel: PropTypes.string,

  className: PropTypes.string,

  columns: PropTypes.number,

  layout: PropTypes.oneOf(["adaptive", "grid", "horizontal-stack"]),

  hideUnavailableOnMobile: PropTypes.bool,

  onSelect: PropTypes.func,
};
