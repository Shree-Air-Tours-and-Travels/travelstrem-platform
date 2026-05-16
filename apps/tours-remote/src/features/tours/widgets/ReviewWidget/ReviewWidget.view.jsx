import React from "react";
import "../../tourDetails.scss";

export default function ReviewWidgetView({ items, emptyText }) {
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
