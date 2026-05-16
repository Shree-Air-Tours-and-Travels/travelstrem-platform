import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComponentData } from "@packages/trem-utils";
import { get } from "lodash";
import Filters from "../filters/Filters";
import TourCardSecondary from "../../shared/ui/cards/TourCards/TourSecondaryCards/TourCardSecondary";
import ToursPageView from "./ToursPage.view";

const PAGE_SIZE = 6;

const extractTours = (componentData) => {
    if (!componentData) return [];
    const stateData = componentData?.state?.data;
    if (stateData && Array.isArray(stateData.tours)) return stateData.tours;
    if (Array.isArray(componentData?.data)) return componentData.data;
    if (Array.isArray(componentData?.tours)) return componentData.tours;
    if (Array.isArray(componentData?.data?.tours)) return componentData.data.tours;
    return [];
};

const slugifyTourTitle = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export default function ToursPageContainer() {
    const navigate = useNavigate();
    const { loading: initialLoading, error: initialError, componentData, elements, data } = useComponentData("/tours.json", { auto: true });

    const allTours = useMemo(() => extractTours(componentData), [componentData]);
    const labels = elements?.labels || {};
    const pageTitle = data?.title || get(componentData, "state.data.title", "");

    const [filteredTours, setFilteredTours] = useState(null);
    const [filterMeta, setFilterMeta] = useState({ total: null, filters: {} });
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef(null);
    const listingScrollRef = useRef(null);

    const sourceTours = filteredTours !== null ? filteredTours : allTours;
    const totalResults = Array.isArray(sourceTours) ? sourceTours.length : 0;
    const displayed = useMemo(
        () => (Array.isArray(sourceTours) ? sourceTours.slice(0, visibleCount) : []),
        [sourceTours, visibleCount]
    );

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        if (listingScrollRef.current) listingScrollRef.current.scrollTop = 0;
    }, [sourceTours]);

    useEffect(() => {
        const root = listingScrollRef.current;
        const sentinel = sentinelRef.current;
        if (!root || !sentinel) return;

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleCount((prev) => Math.min((sourceTours || []).length, prev + PAGE_SIZE));
                    }
                });
            },
            {
                root,
                rootMargin: "200px",
                threshold: 0.1,
            }
        );

        obs.observe(sentinel);
        return () => obs.disconnect();
    }, [sourceTours, listingScrollRef.current, sentinelRef.current]);

    const onView = (tour) => {
        const ref = slugifyTourTitle(tour?.title) || tour?._id || tour?.id;
        navigate(`/tours/${encodeURIComponent(ref)}`, { state: { tour } });
    };

    const handleFilterChange = (tours, meta = {}) => {
        setFilteredTours(Array.isArray(tours) ? tours : null);
        setFilterMeta(meta || {});
    };

    return (
        <ToursPageView
            pageTitle={pageTitle}
            labels={labels}
            totalResults={totalResults}
            displayed={displayed}
            initialLoading={initialLoading}
            initialError={initialError}
            filteredTours={filteredTours}
            filterMeta={filterMeta}
            listingScrollRef={listingScrollRef}
            sentinelRef={sentinelRef}
            onView={onView}
            handleFilterChange={handleFilterChange}
            FiltersComponent={Filters}
            TourCardComponent={TourCardSecondary}
        />
    );
}
