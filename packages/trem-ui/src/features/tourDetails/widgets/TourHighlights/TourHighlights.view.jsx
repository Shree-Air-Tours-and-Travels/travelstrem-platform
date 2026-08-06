import React from "react";
import { Icon, Title } from "../../../../index.js";
import "./TourHighlights.styles.scss";

const isUrl = (value = "") => /^(https?:)?\/\/|^data:/i.test(String(value));

function HighlightBadge({ item, index }) {
  if (item.icon && !isUrl(item.icon)) {
    return (
      <span className="td-hl__badge">
        <Icon name={item.icon} size={18} />
      </span>
    );
  }
  return (
    <span className="td-hl__badge td-hl__badge--number">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

export default function TourHighlightsView({ labels, highlights }) {
  if (!highlights.length) return null;

  return (
    <section className="td-hl" aria-label={labels.ariaLabel || "Tour highlights"}>
      <header className="td-hl__header">
        <span className="td-hl__spark">
          <Icon name="sparkles" size={15} />
        </span>
        <Title text={labels.highlights || "Highlights"} primaryClassname="td-hl__title" />
      </header>

      <div className="td-hl__grid">
        {highlights.map((item, index) => (
          <article className="td-hl__card" key={item._id || item.title || index}>
            {item.image && (
              <div className="td-hl__media" style={{ backgroundImage: `url("${item.image}")` }} />
            )}
            <div className="td-hl__card-body">
              <div className="td-hl__card-top">
                <HighlightBadge item={item} index={index} />
                <span className="td-hl__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="td-hl__card-title">{item.title}</h3>
              {item.short ? <p className="td-hl__card-text">{item.short}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
