import React from "react";
import { Section } from "../../shared";

export default function SimilarToursView({ labels, tours }) {
    if (!tours.length) return null;

    return (
        <Section title={labels.youMayAlsoLike || "You May Also Like"}>
            <div className="tour-detail__similar-grid">
                {tours.slice(0, 3).map((tour) => (
                    <article className="tour-detail__similar-card" key={tour._id || tour.title}>
                        <h3>{tour.title}</h3>
                        {tour.desc ? <p>{tour.desc}</p> : null}
                    </article>
                ))}
            </div>
        </Section>
    );
}

