import React from "react";
import { Fact } from "../../shared";

export default function TourOverviewView({ labels, tour, cityDisplay, title, description, durationText, ratingText, tags }) {
    if (!tour) return null;

    return (
        <section className="tour-detail__hero" aria-label={labels.overview || "Tour overview"}>
            <div className="tour-detail__hero-copy">
                <p className="tour-detail__eyebrow">{cityDisplay}</p>
                <h1 id="tour-detail-title">{title}</h1>
                {description ? <p className="tour-detail__lede">{description}</p> : null}
                <div className="tour-detail__hero-facts" aria-label="Trip summary">
                    <Fact label={labels.duration || "Duration"} value={durationText} />
                    <Fact label="Rating" value={ratingText} />
                    <Fact label={labels.maxGroupSize || "Group size"} value={tour.maxGroupSize ? `Up to ${tour.maxGroupSize}` : "Private options"} />
                </div>
                {tags.length ? (
                    <div className="tour-detail__tags tour-detail__tags--hero">
                        {tags.slice(0, 8).map((tag) => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
