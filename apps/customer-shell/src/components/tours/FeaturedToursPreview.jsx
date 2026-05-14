import React from "react";
import { useNavigate } from "react-router-dom";
import { useComponentData } from "@packages/trem-utils";
import { Button } from "@packages/trem-ui";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import PortalPreloader from "../Loader/PortalPreloader";
import { ROUTES, getTourDetailsPath, getTourListPath, slugify } from "@packages/trem-utils";
import "./FeaturedToursPreview.scss";

const extractTours = (componentData) => {
    const stateTours = componentData?.state?.data?.tours;
    if (Array.isArray(stateTours)) return stateTours;
    if (Array.isArray(componentData?.data)) return componentData.data;
    if (Array.isArray(componentData?.tours)) return componentData.tours;
    return [];
};

const getTourId = (tour) => tour?._id || tour?.id;
const getTourRef = (tour) => slugify(tour?.title) || getTourId(tour);
const getTourImage = (tour) => tour?.photo || tour?.photos?.[0] || "";
const getRouteText = (tour) => {
    const origin = tour?.city?.from || "Flexible start";
    const destination = tour?.city?.to || tour?.address?.city || "Curated destination";
    return `${origin} to ${destination}`;
};

const getPriceText = (tour) => {
    const price = tour?.priceInfo || tour?.price;
    if (!price) return "-";
    if (Number(price.min) <= 0 && Number(price.max) <= 0) return "Price on request";
    if (price.isFinal) return `${price.currency} ${price.min}`;
    return `${price.currency} ${price.min} - ${price.max}`;
};

export default function FeaturedToursPreview({ user }) {
    const navigate = useNavigate();
    const { loading, error, componentData } = useComponentData("/tours.json", {
        params: { featured: "true", limit: 4 },
    });
    const tours = extractTours(componentData);

    const goToTour = (tour) => {
        navigate(user ? getTourDetailsPath(getTourRef(tour)) : ROUTES.login, { state: { tour } });
    };

    if (loading) {
        return <PortalPreloader type="cards" count={4} text="Loading featured tours" />;
    }

    if (error || !tours.length) return null;

    return (
        <section className="featured-tours-preview" aria-labelledby="featured-tours-title">
            <div className="featured-tours-preview__header">
                <div>
                    <Title id="featured-tours-title" text="Featured Tours" variant="primary" size="medium" />
                    <SubTitle text="Four recent picks from the ToursTREM catalog" variant="secondary" size="small" />
                </div>
                <Button text="View all" variant="outline" size="small" onClick={() => navigate(user ? getTourListPath() : ROUTES.login)} />
            </div>

            <div className="featured-tours-preview__grid">
                {tours.map((tour) => {
                    const tourId = getTourId(tour);
                    const imageSrc = getTourImage(tour);

                    return (
                        <article className="featured-tours-preview__card" key={tourId || tour?.title}>
                            <button type="button" className="featured-tours-preview__media" onClick={() => goToTour(tour)}>
                                {imageSrc ? (
                                    <img src={imageSrc} alt={tour?.title || "Featured tour"} loading="lazy" />
                                ) : (
                                    <span>TravelsTREM</span>
                                )}
                            </button>
                            <div className="featured-tours-preview__body">
                                <h3>{tour?.title || "Untitled Tour"}</h3>
                                <p>{getRouteText(tour)}</p>
                                <div className="featured-tours-preview__meta">
                                    <span>{getPriceText(tour)}</span>
                                    <button type="button" onClick={() => goToTour(tour)}>Open</button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
