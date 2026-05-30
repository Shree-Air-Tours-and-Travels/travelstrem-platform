import React, { useState } from "react";
import { Icon, Button, Title, Paragraph } from "@packages/trem-ui";

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
        <Title text={labels.reviews || "Guest Notes"} />
        <div className="tour-detail__section-body">
          <Paragraph primaryClassname="tour-detail__muted" text={labels.noReviewsYet || "No guest reviews yet."} />
        </div>
      </section>
    );
  }

  const totalPages = Math.ceil(reviews.length / PER_PAGE);
  const current = reviews.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <section className="tour-detail__section">
      <Title text={labels.reviews || "Guest Notes"} /> <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted)" }}>({reviews.length})</span>
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
              <Paragraph text={review.comment || labels.lovedExperience || "Loved the experience."} />
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="tour-detail__review-pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                type="button"
                primaryClassName={`tour-detail__page-dot${i === page ? " is-active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                variant="text"
                isCircular
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
