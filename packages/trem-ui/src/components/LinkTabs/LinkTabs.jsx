import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./LinkTabs.styles.scss";

export default function LinkTabs({
  options = [],
  ariaLabel = "Page navigation",
  className = "",
  onSelect,
}) {
  const visibleOptions = options.filter((option) => !option.hide);

  if (!visibleOptions.length) return null;

  const renderContent = (option) => (
    <>
      {option.icon ? <Icon name={option.icon} size={17} /> : null}
      <span className="trem-link-tabs__label">{option.label}</span>
      {option.endIcon ? (
        <Icon className="trem-link-tabs__end-icon" name={option.endIcon} size={14} />
      ) : null}
    </>
  );

  return (
    <nav className={`trem-link-tabs ${className}`.trim()} aria-label={ariaLabel}>
      <ul>
        {visibleOptions.map((option) => {
          const classNames = `trem-link-tabs__link${option.active ? " is-active" : ""}`;
          const commonProps = {
            className: classNames,
            "aria-current": option.active ? "page" : undefined,
            "aria-expanded": option.expanded,
            "aria-controls": option.controls,
            "aria-label": option.ariaLabel || option.label,
            "aria-disabled": option.disabled || undefined,
          };

          return (
            <li key={option.id || option.label}>
              {option.href ? (
                <a
                  {...commonProps}
                  href={option.href}
                  target={option.target}
                  rel={option.rel || (option.target === "_blank" ? "noopener noreferrer" : undefined)}
                  tabIndex={option.disabled ? -1 : undefined}
                  onClick={(event) => {
                    if (option.disabled) {
                      event.preventDefault();
                      return;
                    }
                    if (option.type === "external") return;
                    if (!onSelect) return;
                    event.preventDefault();
                    onSelect(option);
                  }}
                >
                  {renderContent(option)}
                </a>
              ) : (
                <button
                  {...commonProps}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => onSelect?.(option)}
                >
                  {renderContent(option)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

LinkTabs.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      type: PropTypes.string,
      target: PropTypes.string,
      rel: PropTypes.string,
      icon: PropTypes.string,
      endIcon: PropTypes.string,
      ariaLabel: PropTypes.string,
      controls: PropTypes.string,
      active: PropTypes.bool,
      expanded: PropTypes.bool,
      disabled: PropTypes.bool,
      hide: PropTypes.bool,
    }),
  ),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  onSelect: PropTypes.func,
};
