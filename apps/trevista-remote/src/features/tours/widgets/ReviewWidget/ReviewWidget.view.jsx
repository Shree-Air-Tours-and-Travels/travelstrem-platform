import React from "react";
import { Paragraph } from "@packages/trem-ui";
import "@packages/trem-ui/features/tourDetails/tourDetails.scss";

export default function ReviewWidgetView({ items, emptyText }) {
  if (!items.length) return <Paragraph primaryClassname="tour-detail__muted" text={emptyText} />;

  return (
    <div className="tour-detail__reviews">
      {items.map((review, index) => (
        <article className="tour-detail__review" key={review._id || index}>
          <div>
            <strong>{review.name || "Guest"}</strong>
            <span>{Number(review.rating || 0).toFixed(1)} / 5</span>
          </div>
          <Paragraph text={review.comment || "Loved the experience."} />
        </article>
      ))}
    </div>
  );
}
