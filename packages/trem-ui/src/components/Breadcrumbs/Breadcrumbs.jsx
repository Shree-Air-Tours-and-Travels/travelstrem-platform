import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./Breadcrumbs.styles.scss";

export default function Breadcrumbs({ items = [], className = "" }) {
  if (!items.length) return null;

  return (
    <nav className={`trem-breadcrumbs ${className}`.trim()} aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isExternal = typeof item.path === "string" && /^https?:\/\//.test(item.path);
          return (
            <li key={item.label + i}>
              {item.onClick && !isLast ? (
                <button type="button" onClick={item.onClick}>
                  {item.label}
                </button>
              ) : item.path && !isLast ? (
                isExternal ? (
                  <a href={item.path}>{item.label}</a>
                ) : (
                  <Link to={item.path} state={item.state}>
                    {item.label}
                  </Link>
                )
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
              {!isLast && <span className="trem-breadcrumbs__sep">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
      state: PropTypes.object,
      onClick: PropTypes.func,
    }),
  ),
  className: PropTypes.string,
};
