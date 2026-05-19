import React from "react";
import { Button, PortalPreloader, SubTitle, Title, SmoothScroll, TourCard } from "@packages/trem-ui";
import "./TopTours.styles.scss";

export default function TopToursView({ title, description, loading, error, tours, onView, onViewAll }) {
    if (loading) return <PortalPreloader type="cards" count={4} text="Loading featured tours" />;
    if (error || !tours.length) return null;

    return (
        <section className="top-tours" aria-labelledby="top-tours-title">
            <SmoothScroll variant="slideUp" delay={0.1}>
                <header className="top-tours__header">
                    <div>
                        <Title id="top-tours-title" text={title} variant="primary" size="medium" />
                        {description ? <SubTitle text={description} variant="secondary" size="small" /> : null}
                    </div>
                    <Button text="View all" variant="outline" size="small" onClick={onViewAll} />
                </header>
            </SmoothScroll>

            <div className="top-tours__grid">
                {tours.map((tour, index) => (
                    <SmoothScroll key={tour?._id || tour?.id || tour?.title} variant="slideUp" delay={0.15 + index * 0.1}>
                        <TourCard tour={tour} onView={onView} variant="grid" />
                    </SmoothScroll>
                ))}
            </div>
        </section>
    );
}
