import React from "react";
import map from "lodash/map";
import { useNavigate } from "react-router-dom";
import "./tourPackages.scss";
import { Title } from "@packages/trem-ui";
import { useComponentData } from "@packages/trem-utils";
import { Button } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import isArray from "lodash/isArray";
import get from "lodash/get";
import { ROUTES, getPackageListPath, getPackageTourDetailsPath } from "@packages/trem-utils";

const TOURS_PREVIEW_LIMIT = 4;
const DESCRIPTION_LIMIT = 180;
const TOUR_PREVIEW_TEXT = {
    unknown: "Unknown",
    emptyPrice: "-",
    emptyDescription: "No description",
    fallbackTitle: "Untitled Tour",
    fallbackImageAlt: "Tour image",
    placeholder: "TravelsTREM",
    featured: "Featured",
    view: "View tour",
};

const getTourId = (tour) => tour?._id || tour?.id;

const getTourImage = (tour) => tour?.photo || tour?.photos?.[0] || "";

const getTourLocationText = (tour) => {
    const from = tour?.city?.from || tour?.address?.city?.from || TOUR_PREVIEW_TEXT.unknown;
    const to = tour?.city?.to || tour?.address?.city?.to || TOUR_PREVIEW_TEXT.unknown;
    const days = tour?.period?.days ?? "-";
    const maxGroupSize = tour?.maxGroupSize ?? "-";

    return `${from} -> ${to} | ${days} days | ${maxGroupSize} pax`;
};

const getTourPriceText = (tour) => {
    const price = tour?.priceInfo || tour?.price;

    if (!price) return TOUR_PREVIEW_TEXT.emptyPrice;
    if (price.isFinal) return `${price.currency} ${price.min}`;
    return `Approx. ${price.currency} ${price.min} - ${price.max}`;
};

const getTourDescription = (tour) => {
    const description = tour?.desc || TOUR_PREVIEW_TEXT.emptyDescription;

    return description.length > DESCRIPTION_LIMIT
        ? `${description.slice(0, DESCRIPTION_LIMIT)}...`
        : description;
};

const getCreatedDate = (t) => {
    if (!t) return null;
    const keys = [
        "createdAt",
        "created_at",
        "dateAdded",
        "addedAt",
        "publishedAt",
        "published_at",
        "updatedAt",
        "updated_at",
        "date",
    ];

    for (const k of keys) {
        const val = t?.[k];
        if (!val) continue;
        const parsed = typeof val === "number" ? new Date(val) : new Date(val);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
};

const resolveTitle = (componentData) =>
    get(componentData, "state.data.title") ||
    get(componentData, "componentData.state.data.title") ||
    get(componentData, "title") ||
    "Tours";


const resolveDescription = (componentData) =>
    get(componentData, "state.data.description") ||
    get(componentData, "componentData.state.data.description") ||
    componentData?.description ||
    "";

const resolveTours = (componentData) => {
    if (isArray(get(componentData, "state.data.tours"))) return get(componentData, "state.data.tours");
    if (isArray(get(componentData, "componentData.state.data.tours")))
        return get(componentData, "componentData.state.data.tours");
    if (isArray(componentData?.data)) return componentData.data;
    return [];
};

const HomeTourCard = ({ tour, onView }) => {
    const tourId = getTourId(tour);
    const imageSrc = getTourImage(tour);
    const displayRating = Number.isFinite(Number(tour?.avgRating)) ? Number(tour.avgRating).toFixed(1) : "0.0";

    return (
        <article className={`ui-tour-preview ${tour?.featured ? "is-featured" : ""}`}>
            <div className="ui-tour-preview__media" aria-hidden={!imageSrc}>
                {tour?.featured && <span className="ui-tour-preview__badge">{TOUR_PREVIEW_TEXT.featured}</span>}
                {imageSrc ? (
                    <img src={imageSrc} alt={tour?.title || TOUR_PREVIEW_TEXT.fallbackImageAlt} loading="lazy" />
                ) : (
                    <div className="ui-tour-preview__placeholder">{TOUR_PREVIEW_TEXT.placeholder}</div>
                )}
            </div>

            <div className="ui-tour-preview__content">
                <Title text={tour?.title || TOUR_PREVIEW_TEXT.fallbackTitle} variant="primary" size="small" />
                <SubTitle text={getTourLocationText(tour)} variant="secondary" size="small" />
                <SubTitle text={getTourDescription(tour)} variant="tertiary" size="small" />
            </div>

            <aside className="ui-tour-preview__aside">
                <div>
                    <p className="ui-tour-preview__price">{getTourPriceText(tour)}</p>
                    {tour?.avgRating !== undefined && (
                        <p className="ui-tour-preview__rating">{displayRating} <span aria-hidden="true">*</span></p>
                    )}
                </div>
                <Button
                    text={TOUR_PREVIEW_TEXT.view}
                    variant="solid"
                    color="primary"
                    size="small"
                    onClick={() => onView(tourId)}
                />
            </aside>
        </article>
    );
};

const TourPackages = ({ user }) => {
    const navigate = useNavigate();
    const { loading, error, componentData } = useComponentData("/tours.json", { headers: {} });

    if (loading) return <TourPreloader showIntro />;
    if (error) return <p>{typeof error === "string" ? error : "Failed to load tours"}</p>;

    const title = resolveTitle(componentData);
    const description = resolveDescription(componentData);
    const tours = resolveTours(componentData);

    if (!tours.length) return <p>No tours available</p>;

    const sorted = [...tours].sort((a, b) => {
        const da = getCreatedDate(a);
        const db = getCreatedDate(b);
        if (da && db) return db - da;
        if (da) return -1;
        if (db) return 1;
        return 0;
    });

    const hasAnyDate = sorted.some((t) => getCreatedDate(t) !== null);
    const recentList = hasAnyDate ? sorted : [...tours].reverse();

    const visibleTours = recentList.slice(0, TOURS_PREVIEW_LIMIT);

    const handleViewAll = () => {
        if (user) navigate(getPackageListPath());
        else navigate(ROUTES.login);
    };

    const navigateToTour = (tourId) => {
        if (user) navigate(getPackageTourDetailsPath(tourId));
        else navigate(ROUTES.login);
    };


    return (
        <section className="ui-tour" aria-labelledby="tours-title">
            <div className="ui-tour__header">
                <Title id="tours-title" className="ui-tour__title" text={title} variant="primary" color={"white"} />
                {description && (
                    <SubTitle
                        className="ui-tour__description"
                        text={description}
                        variant="tertiary"
                        size="small"
                        color="white"
                    />
                )}
            </div>

            <div className="ui-tour__packages" role="list" aria-live="polite">
                {map(visibleTours, (tour) => {
                    const tourId = getTourId(tour);
                    return (
                        <div key={tourId || JSON.stringify(tour)} className="ui-tour__card" role="listitem">
                            <HomeTourCard tour={tour} onView={navigateToTour} />
                        </div>
                    );
                })}
            </div>

            {tours.length > visibleTours.length && (
                <div className="ui-tour__more">
                    <Button text="View all tours" variant="solid" size="medium" color="white" onClick={handleViewAll} />
                </div>
            )}
        </section>
    );
};

export const TourPreloader = ({ count = 4, showIntro = true }) => {
    const cards = Array.from({ length: count });
    return (
        <section className="ui-tour ui-tour--loading" aria-busy="true" aria-label="Loading tours">
            <div className="ui-tour__header">
                {showIntro && (
                    <div className="ui-tour-preloader__intro" aria-hidden="true">
                        <div className="sp-line sp-title" />
                        <div className="sp-line sp-desc" />
                    </div>
                )}
            </div>

            <div className="ui-tour-preloader__packages">
                {cards.map((_, i) => (
                    <div key={i} className="sp-card" role="status" aria-hidden="true">
                        <div className="sp-card__media" />
                        <div className="sp-card__body">
                            <div className="sp-card-title" />
                            <div className="sp-card-sub" />
                            <div className="sp-actions">
                                <div className=" sp-btn-primary" />
                                <div className=" sp-btn-outline" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="ui-tour__more">
                <div className="sp-btn-primary" style={{ width: 160 }} />
            </div>
        </section>
    );
};

export default TourPackages;
