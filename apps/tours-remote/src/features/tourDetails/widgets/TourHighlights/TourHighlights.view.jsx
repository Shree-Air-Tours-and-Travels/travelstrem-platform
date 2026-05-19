import React from "react";

export default function TourHighlightsView({ labels, highlights }) {
  if (!highlights.length) return null;

  return (
    <section className="tour-detail__section">
      <h2>{labels.highlights || "Highlights"}</h2>
      <div className="tour-detail__section-body">
        <div className="tour-detail__highlight-grid">
          {highlights.map((item, index) => (
            <article className="tour-detail__highlight" key={item._id || item.title || index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              {item.short ? <p>{item.short}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
