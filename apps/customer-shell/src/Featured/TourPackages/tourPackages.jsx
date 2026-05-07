// src/pages/tours/TourPackages.jsx
import React from "react";
import map from "lodash/map";
import { useNavigate } from "react-router-dom";
import { calculateAverageRating } from "@packages/trem-utils";
import "./tourPackages.scss";
import { Title } from "@packages/trem-ui";
import useComponentData from "../../hooks/useComponentData";
import { Button } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import isArray from "lodash/isArray";
import get from "lodash/get";
import TourCard from "../../pages/Tour/Cards/TourCardSecondary";
import GlobalLoader from "../../components/Loader/Loader";


/**
 * Helpers
 */
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

/**
 * TourPackages component
 */
const TourPackages = ({ user }) => {
    const navigate = useNavigate();
    const { loading, error, componentData } = useComponentData("/tours.json", { headers: {} });

    if (loading) return <TourPreloader showIntro={true} />;
    //   if (loading) return <GlobalLoader visible={loading} />;
    if (error) return <p>{typeof error === "string" ? error : "Failed to load tours"}</p>;

    const title = resolveTitle(componentData);
    const description = resolveDescription(componentData);
    const tours = resolveTours(componentData);

    if (!tours.length) return <p>No tours available</p>;

    // Sort by created/published date if present, otherwise preserve original order
    const sorted = [...tours].sort((a, b) => {
        const da = getCreatedDate(a);
        const db = getCreatedDate(b);
        if (da && db) return db - da; // newest first
        if (da) return -1;
        if (db) return 1;
        return 0;
    });

    const hasAnyDate = sorted.some((t) => getCreatedDate(t) !== null);
    const recentList = hasAnyDate ? sorted : [...tours].reverse();

    // Only show top 4 on this preview section
    const visibleTours = recentList.slice(0, 4);

    const handleViewAll = () => {
        if (user) navigate("/tours");
        else navigate("/login");
    };

      const navigateToTour = (tourId) => {
        if (user) navigate(`/tours/${tourId}`);
        else navigate("/login");
    };


    return (
        <section className="ui-tour" aria-labelledby="tours-title">
            {/* Header */}
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

            {/* Tour Cards Grid */}
            <div className="ui-tour__packages" role="list" aria-live="polite">
                {map(visibleTours, (tour) => {
                    const tourId = tour?._id || tour?.id;
                    return (
                        <div key={tourId || JSON.stringify(tour)} className="ui-tour__card" role="listitem">
                                <TourCard key={tourId} tour={tour} onView={()=> navigateToTour(tourId)} />
                        </div>
                    );
                })}
            </div>

            {/* View all button */}
            {tours.length > visibleTours.length && (
                <div className="ui-tour__more">
                    <Button text="View all tours" variant="solid" size="medium" color="white" onClick={handleViewAll} />
                </div>
            )}
        </section>
    );
};

/**
 * TourPreloader - responsive skeleton with shimmer
 * - uses CSS grid to show 1 (mobile) / 2 (tablet) / 4 (desktop) cards
 */
export const TourPreloader = ({ count = 4, showIntro = true }) => {
    // We still generate 'count' cards but CSS controls columns visibleTours per breakpoint
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
