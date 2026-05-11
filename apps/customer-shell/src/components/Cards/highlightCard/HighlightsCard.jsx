import React from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import "./highlightsCard.scss";
import { Title } from "@packages/trem-ui";

const HighlightsCard = ({ tour }) => {
  const raw = get(tour, "highlights", []);
  const items = Array.isArray(raw) ? raw : [];

  const hasObjects = items.length > 0 && typeof items[0] === "object";
  const hasStrings = items.length > 0 && typeof items[0] === "string";

  return (
    <aside className="highlight-card highlight-card--modern" aria-labelledby="highlights-title" role="region">
      <header className="highlight-card__header">
        <Title id="highlights-title" text="Highlights" size="medium" variant="primary" />
        <span className="highlight-card__count" aria-hidden="true">
          {items.length > 0 ? `${items.length} highlights` : null}
        </span>
      </header>

      <div className="highlight-card__body">
        {items.length === 0 && <div className="hc-empty">No highlights available</div>}

        {hasObjects && (
          <div className="hc-grid simple">
            {items.map((it, i) => (
              <div className="hc-grid__item" key={it._id || it.title || i}>
                {it.icon && <div className={`hc-icon hc-icon--${String(it.icon).toLowerCase()}`} aria-hidden="true">{it.icon.charAt(0).toUpperCase()}</div>}
                <div className="hc-grid__text">
                  <div className="hc-grid__title">{it.title}</div>
                  {it.short && <div className="hc-grid__short">{it.short}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasStrings && (
          <ul className="hc-list simple">
            {items.map((t, i) => (
              <li key={i} className="hc-list__item">
                <span className="hc-list__bullet" aria-hidden="true">•</span>
                <span className="hc-list__text">{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

HighlightsCard.propTypes = {
  tour: PropTypes.object.isRequired,
};

export default HighlightsCard;
