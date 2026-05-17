import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComponentData, fetchData } from "@packages/trem-utils";
import ToursPageView from "../view/ToursPage.view";
import { slugifyTourTitle } from "../helper";

const PAGE_SIZE = 6;
const PAGE_KEY = "tours-remote/listing";

const fetchWidget = async (widgetRef) => {
    const fileName = widgetRef.split('/').pop();
    const pagingParams = fileName === "tour-grid.json" ? `&page=1&limit=${PAGE_SIZE}` : "";
    const res = await fetchData(`/${fileName}?pageKey=${PAGE_KEY}${pagingParams}`);
    return res?.component || null;
};

const getResponseData = (res) => res?.component?.data || res?.componentData?.state?.data || res?.data || {};

const getToursFromResponse = (res) => {
    const data = getResponseData(res);
    if (Array.isArray(data.tours)) return data.tours;
    if (Array.isArray(res?.tours)) return res.tours;
    if (Array.isArray(res?.results)) return res.results;
    return [];
};

const getPaginationFromData = (data, fallbackTotal = 0) => {
    const source = data || {};
    return source.pagination || {
        page: 1,
        limit: PAGE_SIZE,
        total: fallbackTotal,
        totalPages: Math.max(1, Math.ceil(fallbackTotal / PAGE_SIZE)),
        hasMore: false,
    };
};

export default function ToursPageContainer() {
    const navigate = useNavigate();

    const { loading: pageLoading, error: pageError, elements, structure } = useComponentData("/tours-page.json", { auto: true });
    const pageLabels = elements?.labels || {};
    const widgets = structure?.widgets || [];

    const [widgetsData, setWidgetsData] = useState({});
    const [widgetsLoading, setWidgetsLoading] = useState(true);

    useEffect(() => {
        if (!widgets.length) return;
        let cancelled = false;
        (async () => {
            const results = {};
            await Promise.all(
                widgets.map(async (w) => {
                    if (!w.widgetRef) return;
                    const data = await fetchWidget(w.widgetRef);
                    if (!cancelled) results[w.type] = data;
                })
            );
            if (!cancelled) {
                setWidgetsData(results);
                setWidgetsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [widgets]);

    const initialPagination = widgetsData.listing?.data?.pagination || null;
    const filterWidgetData = widgetsData.filters || null;

    const initialLoading = pageLoading || widgetsLoading;
    const initialError = pageError;

    const [displayed, setDisplayed] = useState([]);
    const [filterMeta, setFilterMeta] = useState({ total: null, filters: {} });
    const [sortId, setSortId] = useState("recommended");
    const [activeFilters, setActiveFilters] = useState({});
    const [pagination, setPagination] = useState(() => getPaginationFromData(initialPagination, 0));
    const [listingLoading, setListingLoading] = useState(false);
    const [listingError, setListingError] = useState(null);
    const sentinelRef = useRef(null);
    const listingScrollRef = useRef(null);
    const requestSeq = useRef(0);

    const totalResults = pagination?.total ?? displayed.length;

    useEffect(() => {
        if (!widgetsData.listing) return;
        const tours = widgetsData.listing?.data?.tours || [];
        const nextPagination = getPaginationFromData(widgetsData.listing?.data || {}, tours.length);
        setDisplayed(tours);
        setPagination(nextPagination);
        setFilterMeta({ total: nextPagination.total, filters: {} });
    }, [widgetsData.listing]);

    const requestTours = useCallback(async ({ filters = activeFilters, sort = sortId, page = 1, append = false, meta = {} } = {}) => {
        const seq = requestSeq.current + 1;
        requestSeq.current = seq;
        setListingLoading(true);
        setListingError(null);

        try {
            const res = await fetchData("/tour-listing-updated", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: { filters, sort, page, limit: PAGE_SIZE },
            });
            if (requestSeq.current !== seq) return null;
            if (res?.status === "error") {
                setListingError(res.message || "Failed to load tours");
                return null;
            }

            const data = getResponseData(res);
            const tours = getToursFromResponse(res);
            const nextPagination = getPaginationFromData(data, tours.length);
            setDisplayed((prev) => (append ? [...prev, ...tours] : tours));
            setPagination(nextPagination);
            setFilterMeta({
                ...meta,
                filters,
                total: nextPagination.total,
                reset: meta.reset ?? false,
            });
            if (!append && listingScrollRef.current) listingScrollRef.current.scrollTop = 0;
            return { tours, data, pagination: nextPagination };
        } catch (err) {
            if (requestSeq.current === seq) setListingError(err?.message || "Failed to load tours");
            return null;
        } finally {
            if (requestSeq.current === seq) setListingLoading(false);
        }
    }, [activeFilters, sortId]);

    useEffect(() => {
        const root = listingScrollRef.current;
        const sentinel = sentinelRef.current;
        if (!root || !sentinel) return;

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && pagination?.hasMore && !listingLoading) {
                        requestTours({
                            page: (pagination.page || 1) + 1,
                            append: true,
                            meta: filterMeta,
                        });
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
    }, [pagination, listingLoading, requestTours, filterMeta, listingScrollRef.current, sentinelRef.current]);

    const onView = (tour) => {
        const ref = slugifyTourTitle(tour?.title) || tour?._id || tour?.id;
        navigate(`/tours/${encodeURIComponent(ref)}`, { state: { tour } });
    };

    const handleFilterChange = (tours, meta = {}) => {
        const nextFilters = meta.filters || {};
        const dataPagination = meta.pagination || getPaginationFromData(meta, Array.isArray(tours) ? tours.length : 0);
        setActiveFilters(nextFilters);
        setDisplayed(Array.isArray(tours) ? tours : []);
        setPagination(dataPagination);
        setFilterMeta({
            ...meta,
            total: dataPagination.total ?? meta.total ?? (Array.isArray(tours) ? tours.length : 0),
            reset: meta.reset ?? false,
        });
        if (listingScrollRef.current) listingScrollRef.current.scrollTop = 0;
    };

    const handleQuickFilter = useCallback((filterId) => {
        const filters = filterId === "all" ? {} : { tags: [filterId] };
        setActiveFilters(filters);
        requestTours({ filters, page: 1, append: false, meta: { quickFilter: filterId, reset: filterId === "all" } });
    }, [requestTours]);

    const handleSortChange = useCallback((nextSortId) => {
        setSortId(nextSortId);
        requestTours({ sort: nextSortId, page: 1, append: false, meta: filterMeta });
    }, [requestTours, filterMeta]);

    return (
        <ToursPageView
            pageLabels={pageLabels}
            widgets={widgets}
            widgetsData={widgetsData}
            pageTitle={pageLabels.pageTitle || "Discover Tours"}
            totalResults={totalResults}
            displayed={displayed}
            initialLoading={initialLoading || (listingLoading && displayed.length === 0)}
            initialError={initialError || listingError}
            filteredTours={Object.keys(activeFilters || {}).length ? displayed : null}
            filterMeta={filterMeta}
            filterWidgetData={filterWidgetData}
            listingWidgetData={widgetsData.listing}
            listingScrollRef={listingScrollRef}
            sentinelRef={sentinelRef}
            onView={onView}
            sortId={sortId}
            onSortChange={handleSortChange}
            hasMore={!!pagination?.hasMore}
            loadingMore={listingLoading && displayed.length > 0}
            handleFilterChange={handleFilterChange}
            onQuickFilter={handleQuickFilter}
        />
    );
}
