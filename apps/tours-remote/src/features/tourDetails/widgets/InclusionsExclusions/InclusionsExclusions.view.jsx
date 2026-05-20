import React from "react";
import { Title, Paragraph } from "@packages/trem-ui";

export default function InclusionsExclusionsView({ labels, inclusions, exclusions }) {
  return (
    <div className="tour-detail__split">
      <section className="tour-detail__section">
        <Title text={labels.inclusions || "Included"} />
        <div className="tour-detail__section-body">
          {Array.isArray(inclusions) && inclusions.length ? (
            <ul className="tour-detail__check-list">
              {inclusions.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <Paragraph primaryClassname="tour-detail__muted" text={labels.inclusionsEmpty || "Inclusions will be confirmed before booking."} />
          )}
        </div>
      </section>
      <section className="tour-detail__section">
        <Title text={labels.exclusions || "Not Included"} />
        <div className="tour-detail__section-body">
          {Array.isArray(exclusions) && exclusions.length ? (
            <ul className="tour-detail__check-list">
              {exclusions.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <Paragraph primaryClassname="tour-detail__muted" text={labels.exclusionsEmpty || "Exclusions will be confirmed before booking."} />
          )}
        </div>
      </section>
    </div>
  );
}
