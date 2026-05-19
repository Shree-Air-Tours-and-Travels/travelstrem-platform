import React from "react";

export default function InclusionsExclusionsView({ labels, inclusions, exclusions }) {
  return (
    <div className="tour-detail__split">
      <section className="tour-detail__section">
        <h2>{labels.inclusions || "Included"}</h2>
        <div className="tour-detail__section-body">
          {Array.isArray(inclusions) && inclusions.length ? (
            <ul className="tour-detail__check-list">
              {inclusions.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <p className="tour-detail__muted">{labels.inclusionsEmpty || "Inclusions will be confirmed before booking."}</p>
          )}
        </div>
      </section>
      <section className="tour-detail__section">
        <h2>{labels.exclusions || "Not Included"}</h2>
        <div className="tour-detail__section-body">
          {Array.isArray(exclusions) && exclusions.length ? (
            <ul className="tour-detail__check-list">
              {exclusions.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <p className="tour-detail__muted">{labels.exclusionsEmpty || "Exclusions will be confirmed before booking."}</p>
          )}
        </div>
      </section>
    </div>
  );
}
