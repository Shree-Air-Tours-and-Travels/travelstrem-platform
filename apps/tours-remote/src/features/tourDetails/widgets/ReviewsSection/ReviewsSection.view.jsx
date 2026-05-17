import React from "react";
import { Section } from "../../shared";

export default function ReviewsSectionView({ labels, reviews }) {
    return (
        <Section title={labels.reviews || "Guest Notes"}>
            {reviews.length ? (
                <div className="tour-detail__reviews">
                    {reviews.slice(0, 4).map((review, index) => (
                        <article className="tour-detail__review" key={review._id || index}>
                            <div>
                                <strong>{review.name || "Guest"}</strong>
                                <span>{Number(review.rating || 0).toFixed(1)} / 5</span>
                            </div>
                            <p>{review.comment || "Loved the experience."}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="tour-detail__muted">{labels.noReviewsYet || "No guest reviews yet."}</p>
            )}
        </Section>
    );
}

