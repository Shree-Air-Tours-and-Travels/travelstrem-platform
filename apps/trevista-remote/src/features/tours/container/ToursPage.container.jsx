import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useComponentData, fetchData } from "@packages/trem-utils";
import ToursPageView from "../view/ToursPage.view";
import { slugifyTourTitle } from "../helper";
import useFavorites from "../hooks/useFavorites";

const PAGE_SIZE = 8;
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

export default function ToursPageContainer({ dispatchEvent } = {}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isFavorited, toggleFavorite } = useFavorites();

    const initialFiltersRef = useRef(location.state?.initialFilters || null);
    const appliedInitialFilters = useRef(false);

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
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMeta, setFilterMeta] = useState({ total: null, filters: {} });
    const [sortId, setSortId] = useState("recommended");
    const [activeFilters, setActiveFilters] = useState({});
    const [pagination, setPagination] = useState(() => getPaginationFromData(initialPagination, 0));
    const [listingLoading, setListingLoading] = useState(false);
    const [listingError, setListingError] = useState(null);
    const [filtersExpanded, setFiltersExpanded] = useState(() => typeof window !== "undefined" ? window.innerWidth > 900 : true);
    const requestSeq = useRef(0);

    const totalResults = pagination?.total ?? displayed.length;

    useEffect(() => {
        if (!widgetsData.listing) return;
        if (initialFiltersRef.current) return;
        const tours = widgetsData.listing?.data?.tours || [];
        const nextPagination = getPaginationFromData(widgetsData.listing?.data || {}, tours.length);
        setDisplayed(tours);
        setPagination(nextPagination);
        setCurrentPage(1);
        setFilterMeta({ total: nextPagination.total, filters: {} });
    }, [widgetsData.listing]);

    const requestTours = useCallback(async ({ filters = activeFilters, sort = sortId, page = 1, meta = {} } = {}) => {
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
            setDisplayed(tours);
            setPagination(nextPagination);
            setCurrentPage(page);
            setFilterMeta({
                ...meta,
                filters,
                total: nextPagination.total,
                reset: meta.reset ?? false,
            });
            if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
            return { tours, data, pagination: nextPagination };
        } catch (err) {
            if (requestSeq.current === seq) setListingError(err?.message || "Failed to load tours");
            return null;
        } finally {
            if (requestSeq.current === seq) setListingLoading(false);
        }
    }, [activeFilters, sortId]);

    useEffect(() => {
        if (!widgetsData.listing || appliedInitialFilters.current) return;
        const initial = initialFiltersRef.current;
        if (!initial) return;
        appliedInitialFilters.current = true;
        setActiveFilters(initial);
        requestTours({ filters: initial, page: 1, meta: { filters: initial } });
    }, [widgetsData.listing, requestTours]);

    const onView = (tour) => {
        const ref = slugifyTourTitle(tour?.title) || tour?._id || tour?.id;
        if (typeof dispatchEvent === "function") {
            dispatchEvent("navigateToTourDetails", {
                tourRef: encodeURIComponent(ref),
                state: { tour, from: { label: "Tours", path: "/trevista/tours" } },
            });
            return;
        }
        navigate(`/trevista/tours/${encodeURIComponent(ref)}`, { state: { tour, from: { label: "Tours", path: "/trevista/tours" } } });
    };

    const handleFilterChange = (tours, meta = {}) => {
        const nextFilters = meta.filters || {};
        const dataPagination = meta.pagination || getPaginationFromData(meta, Array.isArray(tours) ? tours.length : 0);

        // On filter-panel reset, preserve quick filter (tags) and re-request
        if (meta.reset && activeFilters.tags?.length) {
            nextFilters.tags = activeFilters.tags;
            requestTours({ filters: nextFilters, page: 1, meta: { ...meta, filters: nextFilters, reset: true } });
            return;
        }

        setActiveFilters(nextFilters);
        setDisplayed(Array.isArray(tours) ? tours : []);
        setPagination(dataPagination);
        setCurrentPage(1);
        setFilterMeta({
            ...meta,
            total: dataPagination.total ?? meta.total ?? (Array.isArray(tours) ? tours.length : 0),
            reset: meta.reset ?? false,
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePageChange = useCallback((page) => {
        requestTours({ page, meta: filterMeta });
    }, [requestTours, filterMeta]);

    const handleQuickFilter = useCallback((filterId) => {
        const filters = filterId === "all" ? {} : { tags: [filterId] };
        setActiveFilters(filters);
        requestTours({ filters, page: 1, meta: { quickFilter: filterId, reset: filterId === "all" } });
    }, [requestTours]);

    const handleSortChange = useCallback((nextSortId) => {
        setSortId(nextSortId);
        requestTours({ sort: nextSortId, page: 1, meta: filterMeta });
    }, [requestTours, filterMeta]);

    return (
        <ToursPageView
            pageLabels={pageLabels}
            widgets={widgets}
            widgetsData={widgetsData}
            pageTitle={pageLabels.pageTitle}
            totalResults={totalResults}
            displayed={displayed}
            initialLoading={initialLoading || (listingLoading && displayed.length === 0)}
            initialError={initialError || listingError}
            filteredTours={Object.keys(activeFilters || {}).length ? displayed : null}
            filterMeta={filterMeta}
            filterWidgetData={filterWidgetData}
            listingWidgetData={widgetsData.listing}
            onView={onView}
            isFavorited={isFavorited}
            onFavorite={toggleFavorite}
            sortId={sortId}
            onSortChange={handleSortChange}
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
            loadingMore={listingLoading}
            handleFilterChange={handleFilterChange}
            onQuickFilter={handleQuickFilter}
            onPageChange={handlePageChange}
            filtersExpanded={filtersExpanded}
            onFiltersExpandedChange={setFiltersExpanded}
            initialValues={initialFiltersRef.current}
        />
    );
}
