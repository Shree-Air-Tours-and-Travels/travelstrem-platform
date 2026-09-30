import React from "react";

export const TourListSkeleton = ({ count = 6 }) => {
  const cards = Array.from({ length: count });
  return (
    <div
      className="tours-page__loading-grid"
      role="status"
      aria-live="polite"
      aria-label="Loading tours"
    >
      {cards.map((_, index) => (
        <article className="tours-page__loading-card" key={index}>
          <div className="tours-page__loading-media" />
          <div className="tours-page__loading-body">
            <div className="tours-page__loading-line tours-page__loading-line--title" />
            <div className="tours-page__loading-line" />
            <div className="tours-page__loading-line tours-page__loading-line--short" />
          </div>
        </article>
      ))}
    </div>
  );
};
