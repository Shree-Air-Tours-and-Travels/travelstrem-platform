import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./OptionCardRail.styles.scss";

export default function OptionCardRail({ title, items = [], selected = [], onChange, className = "" }) {
  const selectedValues = Array.isArray(selected) ? selected : [selected].filter(Boolean);

  const toggle = (value) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    onChange?.(next);
  };

  return (
    <section className={`trem-option-card-rail${className ? ` ${className}` : ""}`}>
      {title ? <h2>{title}</h2> : null}
      <div className="trem-option-card-rail__track">
        {items.map((item) => {
          const active = selectedValues.includes(item.value);
          return (
            <button
              key={item.id || item.value}
              type="button"
              className={`trem-option-card-rail__item${active ? " is-active" : ""}`}
              aria-pressed={active}
              onClick={() => toggle(item.value)}
            >
              <span className="trem-option-card-rail__mark" aria-hidden="true">
                {item.icon ? <Icon name={item.icon} size={20} /> : item.initial}
              </span>
              <span className="trem-option-card-rail__copy">
                <strong>{item.label}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
              <Icon name={active ? "check" : "chevronRight"} size={16} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

OptionCardRail.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object),
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  onChange: PropTypes.func,
  className: PropTypes.string,
};
