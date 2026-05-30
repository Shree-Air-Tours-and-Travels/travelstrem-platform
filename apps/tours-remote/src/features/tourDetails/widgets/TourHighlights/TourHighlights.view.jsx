import React from "react";
import { Title, SubTitle, Paragraph } from "@packages/trem-ui";

export default function TourHighlightsView({ labels, highlights }) {
  if (!highlights.length) return null;

  return (
    <section className="tour-detail__section">
      <Title text={labels.highlights || "Highlights"} />
      <div className="tour-detail__section-body">
        <div className="tour-detail__highlight-grid">
          {highlights.map((item, index) => (
            <article className="tour-detail__highlight" key={item._id || item.title || index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <SubTitle text={item.title} />
              {item.short ? <Paragraph text={item.short} /> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
