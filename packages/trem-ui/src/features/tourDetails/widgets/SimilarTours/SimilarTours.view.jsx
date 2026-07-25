import React from "react";
import { TourCard, Title } from "../../../../index.js";
import "./SimilarTours.styles.scss";

export default function SimilarToursView({ labels, tours, onView, isFavorited, onFavorite }) {
  if (!tours.length) return null;

  return (
    <section className="tour-detail__section tour-detail__similar-section">
      <Title text={labels.youMayAlsoLike || "You May Also Like"} />
      <div className="tour-detail__section-body">
        <div className="tour-detail__similar-scroll-wrapper">
          <div className="tour-detail__similar-scroll">
            {tours.map((tour) => (
              <div key={tour._id || tour.title} className="tour-detail__similar-card">
                <TourCard
                  tour={tour}
                  onView={onView}
                  variant="grid"
                  favorited={isFavorited?.(tour) ?? false}
                  onFavorite={onFavorite}
                />
              </div>
            ))}
          </div>
        </div>
        {tours.length > 3 && (
          <div className="tour-detail__similar-hint">
            <span>Scroll to see more</span>
          </div>
        )}
      </div>
    </section>
  );
}
