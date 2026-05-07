// src/components/Cards/Info/infoCard.jsx
import React from "react";
import get from "lodash/get";
import "./infoCard.style.scss";

const InfoCard = ({ tour }) => {
  if (!tour) return null;

  const title = get(tour, "title", get(tour, "_page.title", "Tour"));
  const description = get(tour, "desc", get(tour, "_page.description", ""));
  const address = get(tour, "address", {});
  const city = get(tour, "city", get(address, "city", ""));
  const periodDays = get(tour, "period.days");
  const periodNights = get(tour, "period.nights");
  const maxGroupSize = get(tour, "maxGroupSize");
  const structure = get(tour, "_page.structure", {});
  const sections = get(structure, "sections", []);

  return (
    <div className="info-card">
      <h1 className="info-card__title">{title}</h1>

      {description && <p className="info-card__description">{description}</p>}

      <div className="info-card__details">
        {city && <div className="info-card__row"><strong>City:</strong> {city}</div>}

        {address.line1 && (
          <div className="info-card__row"><strong>Address:</strong> {address.line1}{address.line2 ? `, ${address.line2}` : ""}</div>
        )}

        {(periodDays || periodNights) && (
          <div className="info-card__row">
            <strong>Duration:</strong> {periodDays ? `${periodDays} days` : ""} {periodNights ? ` / ${periodNights} nights` : ""}
          </div>
        )}

        {maxGroupSize && <div className="info-card__row"><strong>Max group size:</strong> {maxGroupSize}</div>}
      </div>

      {/* Render structure-driven sections list (titles only) */}
      {sections.length > 0 && (
        <div className="info-card__structure">
          {sections.map((s, i) => (
            <div key={i} className="info-card__section">
              <h3>{s.title}</h3>
              {/* If you later have actual data for the section (itinerary content, reviews), render it here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InfoCard;
