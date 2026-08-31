import React from "react";
import { Icon, TourCard } from "../../../../index.js";
import "./SimilarTours.styles.scss";

export default function SimilarToursView({
  labels,
  tours,
  onView,
  isFavorited,
  onFavorite,
  showEmpty = false,
}) {
  if (!tours.length) {
    return showEmpty ? (
      <section className="tour-detail__section tour-detail__similar-empty" role="status">
        <h2>No similar tours are currently available</h2>
        <p>Return to tour filters to explore another destination, date, or category.</p>
      </section>
    ) : null;
  }

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
          <span className="tour-detail__similar-eyebrow">TREM intelligence</span>
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
        {tours.length > 1 ? (
          <p className="tour-detail__similar-swipe-hint">
            {labels.swipeHint || "Swipe to see more tours"}
          </p>
        ) : null}
        <div className="tour-detail__similar-scroll-wrapper">
          <div
            className="tour-detail__similar-scroll"
            role="region"
            aria-label="Similar tours"
            tabIndex={0}
          >
            {tours.map((tour) => (
              <div key={tour._id || tour.title} className="tour-detail__similar-card">
                {tour.similarity?.reasons?.length ? (
                  <div className="tour-detail__similar-reason">
                    <Icon name="sparkles" size={14} />
                    <span>{tour.similarity.reasons.join(" · ")}</span>
                  </div>
                ) : null}
                <TourCard
                  tour={tour}
                  onView={onView}
                  variant="management"
                  size="dense"
                  ownershipMode="agency"
                  ownershipLabels={{
                    agency: labels.agencyLabel || labels.uploadedBy || "Uploaded by",
                  }}
                  favorited={isFavorited?.(tour) ?? false}
                  onFavorite={onFavorite}
                  labels={{
                    featured: labels.featured || "Featured",
                    trending: labels.trending || "Trending",
                    verified: labels.verified || "TREM verified",
                    viewTour: labels.viewTour || "Explore this Tour",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
