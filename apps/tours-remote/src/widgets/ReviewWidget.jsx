import React from "react";
import "../styles/pages/tourDetails.scss";

const getReviews = ({ reviews, tour, data }) => {
    if (Array.isArray(reviews)) return reviews;
    if (Array.isArray(tour?.reviews)) return tour.reviews;
    if (Array.isArray(data?.reviews)) return data.reviews;
    return [];
};

export default function ReviewWidget({ reviews, tour, data, limit = 4, emptyText = "No guest reviews yet." }) {
    const items = getReviews({ reviews, tour, data }).slice(0, limit);

    if (!items.length) return <p className="tour-detail__muted">{emptyText}</p>;

    return (
        <div className="tour-detail__reviews">
            {items.map((review, index) => (
                <article className="tour-detail__review" key={review._id || index}>
                    <div>
                        <strong>{review.name || "Guest"}</strong>
                        <span>{Number(review.rating || 0).toFixed(1)} / 5</span>
                    </div>
                    <p>{review.comment || "Loved the experience."}</p>
                </article>
            ))}
        </div>
    );
}
