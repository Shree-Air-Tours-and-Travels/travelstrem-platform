import React from "react";
import { Button, PortalPreloader, SubTitle, Title, SmoothScroll } from "@packages/trem-ui";
import "./TopTours.styles.scss";

const getTourImage = (tour) => tour?.photo || tour?.photos?.[0] || "";

const getRouteText = (tour) => {
    const origin = tour?.city?.from || "Flexible start";
    const destination = tour?.city?.to || tour?.address?.city || "Curated destination";
    return `${origin} to ${destination}`;
};

const getPriceText = (tour) => {
    const price = tour?.priceInfo || tour?.price;
    if (!price) return "Price on request";
    const currency = price.currency || "INR";
    if (Number(price.min) <= 0 && Number(price.max) <= 0) return "Price on request";
    if (price.isFinal || Number(price.min) === Number(price.max)) return `${currency} ${price.min}`;
    return `${currency} ${price.min} - ${price.max}`;
};

const TopTourCard = ({ tour, onView }) => {
    const imageSrc = getTourImage(tour);
    const rating = Number.isFinite(Number(tour?.avgRating)) ? Number(tour.avgRating).toFixed(1) : "0.0";

    return (
        <article className="top-tours__card">
            <button className="top-tours__media" type="button" onClick={() => onView(tour)}>
                {tour?.featured ? <span className="top-tours__badge">Featured</span> : null}
                {imageSrc ? (
                    <img src={imageSrc} alt={tour?.title || "Featured tour"} loading="lazy" />
                ) : (
                    <span className="top-tours__placeholder">TravelsTREM</span>
                )}
            </button>
            <div className="top-tours__body">
                <h3>{tour?.title || "Untitled Tour"}</h3>
                <p>{getRouteText(tour)}</p>
                <div className="top-tours__meta">
                    <strong>{getPriceText(tour)}</strong>
                    <span>{rating} / 5</span>
                </div>
                <Button text="View tour" variant="solid" size="small" onClick={() => onView(tour)} />
            </div>
        </article>
    );
};

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
                        <TopTourCard tour={tour} onView={onView} />
                    </SmoothScroll>
                ))}
            </div>
        </section>
    );
}
