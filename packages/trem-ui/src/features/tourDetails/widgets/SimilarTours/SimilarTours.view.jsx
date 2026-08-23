import React from "react";
import { Icon, TourCard } from "../../../../index.js";
import "./SimilarTours.styles.scss";

export default function SimilarToursView({ labels, tours, onView, isFavorited, onFavorite }) {
  if (!tours.length) return null;

  return (
    <section
      className="tour-detail__section tour-detail__similar-section"
      aria-labelledby="similar-tours-title"
    >
      <header className="tour-detail__similar-header">
        <span className="tour-detail__similar-header-icon" aria-hidden="true">
          <Icon name="sparkles" size={20} />
        </span>
        <div className="tour-detail__similar-heading">
          <span className="tour-detail__similar-eyebrow">Handpicked for your journey</span>
          <h2 id="similar-tours-title">{labels.youMayAlsoLike || "You may also like"}</h2>
          <p>
            {labels.similarToursDescription ||
              "More curated tours with destinations and experiences you may enjoy."}
          </p>
        </div>
        <span className="tour-detail__similar-count">
          {tours.length} {tours.length === 1 ? "tour" : "tours"}
        </span>
      </header>
      <div className="tour-detail__section-body">
        <div className="tour-detail__similar-scroll-wrapper">
          <div className="tour-detail__similar-scroll">
            {tours.map((tour) => (
              <div key={tour._id || tour.title} className="tour-detail__similar-card">
                <TourCard
                  tour={tour}
                  onView={onView}
                  variant="list"
                  favorited={isFavorited?.(tour) ?? false}
                  onFavorite={onFavorite}
                />
              </div>
            ))}
          </div>
        </div>
        {tours.length > 1 && (
          <div className="tour-detail__similar-hint">
            <Icon name="chevronRight" size={14} />
            <span>Swipe to explore more tours</span>
          </div>
        )}
      </div>
    </section>
  );
}
