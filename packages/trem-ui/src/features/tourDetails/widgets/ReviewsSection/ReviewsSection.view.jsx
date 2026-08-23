import React, { useMemo, useState } from "react";
import { Icon, Button, Title, Paragraph } from "../../../../index.js";

const PER_PAGE = 4;

const getInitials = (name) => {
  const parts = (name || "Guest").trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ReviewsSectionView({
  labels = {},
  reviews = [],
  avgRating = 0,
  reviewCount = 0,
}) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(reviews.length / PER_PAGE);

  const currentReviews = useMemo(
    () => reviews.slice(page * PER_PAGE, (page + 1) * PER_PAGE),
    [page, reviews],
  );

  if (!reviews.length) {
    return (
      <section className="tour-detail__section">
        <div className="tour-detail__section-heading">
          <Title text={labels.reviews || "Guest Reviews"} />
        </div>

        <div className="tour-detail__section-body">
          <Paragraph
            primaryClassname="tour-detail__muted"
            text={labels.noReviewsYet || "No guest reviews yet."}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="tour-detail__section">
      <div className="tour-detail__section-heading">
        <Title text={labels.reviews || "Guest Reviews"} />

        <div className="tour-detail__review-summary">
          <span className="tour-detail__review-summary-rating">
            <Icon name="star" />
            {Number(avgRating).toFixed(1)}
          </span>

          <span className="tour-detail__review-summary-divider">•</span>

          <span className="tour-detail__review-count">
            {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
          </span>
        </div>
      </div>

      <div className="tour-detail__section-body">
        <div className="tour-detail__reviews">
          {currentReviews.map((review, index) => (
            <article key={review._id || index} className="tour-detail__review">
              <div className="tour-detail__review-header">
                <div className="tour-detail__review-author">
                  <div className="tour-detail__review-avatar">{getInitials(review.name)}</div>

                  <div className="tour-detail__review-details">
                    <div className="tour-detail__review-name">
                      {review.name || labels.guest || "Guest"}
                    </div>

                    {review.date && <div className="tour-detail__review-date">{review.date}</div>}
                  </div>
                </div>

                <div className="tour-detail__review-rating">
                  <Icon name="star" />
                  <span>{Number(review.rating || 0).toFixed(1)}</span>
                </div>
              </div>

              <Paragraph
                text={review.comment || labels.lovedExperience || "Loved the experience."}
              />
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="tour-detail__review-pagination">
            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                type="button"
                variant="text"
                isCircular
                primaryClassName={`tour-detail__page-dot ${page === index ? "is-active" : ""}`}
                aria-label={`Go to page ${index + 1}`}
                onClick={() => setPage(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
