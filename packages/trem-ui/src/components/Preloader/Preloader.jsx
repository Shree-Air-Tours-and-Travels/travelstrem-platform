import React from "react";
import PropTypes from "prop-types";
import "./Preloader.styles.scss";

export default function Preloader({
  variant = "cards",
  count = 3,
  label = "Loading content",
  className = "",
}) {
  return (
    <section
      className={`trem-preloader trem-preloader--${variant}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <span className="trem-preloader__heading" aria-hidden="true" />
      <div className="trem-preloader__grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="trem-preloader__item" key={index}>
            {variant !== "stats" ? <span className="trem-preloader__media" /> : null}
            <span className="trem-preloader__body">
              <span className="trem-preloader__line trem-preloader__line--strong" />
              <span className="trem-preloader__line" />
              {variant !== "stats" ? <span className="trem-preloader__line trem-preloader__line--short" /> : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

Preloader.propTypes = {
  variant: PropTypes.oneOf(["cards", "stack", "stats"]),
  count: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string,
};
