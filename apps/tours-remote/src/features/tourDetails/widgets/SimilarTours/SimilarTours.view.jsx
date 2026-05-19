import React from "react";
import { TourCard } from "@packages/trem-ui";

export default function SimilarToursView({ labels, tours, onView, isFavorited, onFavorite }) {
  if (!tours.length) return null;

  return (
    <section className="tour-detail__section">
      <h2>{labels.youMayAlsoLike || "You May Also Like"}</h2>
      <div className="tour-detail__section-body">
        <div className="tour-detail__similar-grid">
          {tours.slice(0, 4).map((tour) => (
            <TourCard key={tour._id || tour.title} tour={tour} onView={onView} variant="grid" favorited={isFavorited(tour)} onFavorite={onFavorite} />
          ))}
        </div>
      </div>
    </section>
  );
}
