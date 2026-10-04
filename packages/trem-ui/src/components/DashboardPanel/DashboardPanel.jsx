import React from "react";
import Button from "../Button/Button.jsx";
import NoDataFound from "../NoDataFound/NoDataFound.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./DashboardPanel.styles.scss";

export default function DashboardPanel({
  title,
  description,
  icon,
  items = [],
  variant = "list",
  action,
  onItemClick,
  emptyTitle = "No items yet",
  className = "",
}) {
  return (
    <section
      className={`trem-dashboard-panel trem-dashboard-panel--${variant} ${className}`.trim()}
      aria-label={title}
    >
      <header className="trem-dashboard-panel__heading">
        {icon ? (
          <span className="trem-dashboard-panel__heading-icon" aria-hidden="true">
            <Icon name={icon} size={20} />
          </span>
        ) : null}
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action?.label && action.onClick ? (
          <Button text={action.label} variant="outline" size="small" onClick={action.onClick} />
        ) : null}
      </header>
      {items.length ? (
        <div className="trem-dashboard-panel__items">
          {items.map((item) => {
            const Tag = item.target && onItemClick ? "button" : "div";
            return (
              <Tag
                className="trem-dashboard-panel__item"
                key={item.id}
                type={Tag === "button" ? "button" : undefined}
                onClick={Tag === "button" ? () => onItemClick(item.target, item) : undefined}
              >
                {item.icon ? (
                  <span className="trem-dashboard-panel__item-icon" aria-hidden="true">
                    <Icon name={item.icon} size={18} />
                  </span>
                ) : null}
                <span className="trem-dashboard-panel__item-copy">
                  <strong>{item.label}</strong>
                  {item.description ? <small>{item.description}</small> : null}
                  {item.stats?.length ? (
                    <span className="trem-dashboard-panel__stats">
                      {item.stats.map((stat) => (
                        <small key={stat.id}>
                          <b>{stat.value}</b> {stat.label}
                        </small>
                      ))}
                    </span>
                  ) : null}
                </span>
                {item.value != null ? (
                  <strong className="trem-dashboard-panel__item-value">{item.value}</strong>
                ) : null}
                {item.status ? <StatusBadge value={item.status} tone={item.statusTone} size="sm" /> : null}
                {item.meta ? (
                  <small className="trem-dashboard-panel__item-meta">{item.meta}</small>
                ) : null}
                {Tag === "button" ? (
                  <Icon name={variant === "actions" ? "arrowUpRight" : "chevronRight"} size={17} />
                ) : null}
              </Tag>
            );
          })}
        </div>
      ) : (
        <NoDataFound title={emptyTitle} compact className="trem-dashboard-panel__empty" />
      )}
    </section>
  );
}
