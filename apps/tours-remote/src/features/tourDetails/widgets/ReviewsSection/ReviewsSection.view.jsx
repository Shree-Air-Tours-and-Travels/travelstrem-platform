import React, { useState } from "react";
import { Icon } from "@packages/trem-ui";

const PER_PAGE = 4;

const getInitials = (name) => {
  const parts = (name || "G").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ReviewsSectionView({ labels, reviews }) {
  const [page, setPage] = useState(0);
  if (!reviews.length) {
    return (
      <section className="tour-detail__section">
        <h2>{labels.reviews || "Guest Notes"}</h2>
        <div className="tour-detail__section-body">
          <p className="tour-detail__muted">{labels.noReviewsYet || "No guest reviews yet."}</p>
        </div>
      </section>
    );
  }

  const totalPages = Math.ceil(reviews.length / PER_PAGE);
  const current = reviews.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <section className="tour-detail__section">
      <h2>{labels.reviews || "Guest Notes"} <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted)" }}>({reviews.length})</span></h2>
      <div className="tour-detail__section-body">
        <div className="tour-detail__reviews">
          {current.map((review, index) => (
            <article className="tour-detail__review" key={review._id || index}>
              <div className="tour-detail__review-header">
                <div className="tour-detail__review-author">
                  <span className="tour-detail__review-avatar">{getInitials(review.name)}</span>
                  <span className="tour-detail__review-name">{review.name || labels.guest || "Guest"}</span>
                </div>
                <div className="tour-detail__review-rating">
                  <Icon name="star" />
                  <span>{Number(review.rating || 0).toFixed(1)}</span>
                </div>
              </div>
              <p>{review.comment || labels.lovedExperience || "Loved the experience."}</p>
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="tour-detail__review-pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`tour-detail__page-dot${i === page ? " is-active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
