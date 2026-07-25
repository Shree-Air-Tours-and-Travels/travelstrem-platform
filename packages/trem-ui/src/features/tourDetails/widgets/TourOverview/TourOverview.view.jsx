import React from "react";
import { Icon, Title, Paragraph } from "../../../../index.js";

export default function TourOverviewView({ labels, tour, cityDisplay, title, description, durationText, ratingText, tags }) {
  if (!tour) return null;

  return (
    <section className="tour-detail__hero" aria-label={labels.overview || "Tour overview"}>
      <Paragraph primaryClassname="tour-detail__eyebrow" text={cityDisplay} />
      <div className="tour-detail__hero-copy">
        <Title text={title} />
        {description ? <Paragraph primaryClassname="tour-detail__lede" text={description} /> : null}
      </div>
      <div className="tour-detail__hero-facts" aria-label="Trip summary">
        <div className="tour-detail__fact">
          <Icon name="calendar" />
          <span>{labels.duration || "Duration"}</span>
          <strong>{durationText}</strong>
        </div>
        <div className="tour-detail__fact">
          <Icon name="star" />
          <span>{labels.rating || "Rating"}</span>
          <strong>{ratingText}</strong>
        </div>
        <div className="tour-detail__fact">
          <Icon name="usersRound" />
          <span>{labels.maxGroupSize || "Group size"}</span>
          <strong>{tour.maxGroupSize ? `Up to ${tour.maxGroupSize}` : "Private options"}</strong>
        </div>
      </div>
      {tags.length ? (
        <div className="tour-detail__tags">
          {tags.slice(0, 8).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
