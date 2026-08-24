import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useComponentData, fetchData } from "@packages/trem-utils";
import { useTourCatalogRealtime } from "@packages/trem-events";
import ToursPageView from "../view/ToursPage.view";
import { getTourRef } from "../helper";
import useFavorites from "../hooks/useFavorites";
import { ContactAgentModal } from "@packages/trem-modals";
import { fetchTourSearch } from "../search/tourSearch.service";
import {
  flattenTourSearchState,
  applyTourDiscoveryChip,
  createDefaultTourSearchState,
  getActiveTourFilterChips,
  getApiSort,
  getUiSortId,
  mergeFlatFiltersIntoSearch,
  parseTourSearchUrl,
  serializeTourSearchUrl,
} from "../search/tourSearchState";

const PAGE_KEY = "tours-remote/listing";

const fetchWidgetMetadata = async (widgetRef) => {
  const fileName = widgetRef.split("/").pop();
  const response = await fetchData(`/${fileName}?pageKey=${PAGE_KEY}&metadataOnly=true`);
  return response?.component || null;
};

const sameState = (left, right) => serializeTourSearchUrl(left) === serializeTourSearchUrl(right);

export default function ToursPageContainer({ dispatchEvent, userSession = null } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFavorited, toggleFavorite } = useFavorites();
  const {
    loading: pageLoading,
    error: pageError,
    elements,
    structure,
  } = useComponentData("/tours-page.json", { auto: true });
  const widgets = useMemo(() => structure?.widgets || [], [structure?.widgets]);
  const pageLabels = elements?.labels || {};

  const [widgetsData, setWidgetsData] = useState({});
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [discovery, setDiscovery] = useState([]);
  const [searchState, setSearchState] = useState(() => parseTourSearchUrl(location.search));
  const [result, setResult] = useState({
    items: [],
    pagination: {
      page: 1,
      pageSize: 8,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    },
    facets: {
      price: { min: 0, max: 0 },
      duration: { minDays: 0, maxDays: 0 },
      origins: [],
      destinations: [],
      countries: [],
      agencies: [],
      tags: [],
    },
  });
  const [searching, setSearching] = useState(true);
  const [searchError, setSearchError] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 900 : true,
  );
  const [contactOpen, setContactOpen] = useState(false);
  const previousQuery = useRef(searchState.query);
  const [realtimeTick, setRealtimeTick] = useState(0);

  // A tour was published or an existing public card changed elsewhere:
  // refetch listing + facets from the API without any reload.
  useTourCatalogRealtime(useCallback(() => setRealtimeTick((tick) => tick + 1), []));

  useEffect(() => {
    if (!widgets.length) return undefined;
    let active = true;
    Promise.all(
      widgets.map(async (widget) => [
        widget.type,
        widget.widgetRef ? await fetchWidgetMetadata(widget.widgetRef) : null,
      ]),
    )
      .then((widgetEntries) => {
        if (!active) return;
        const metadata = Object.fromEntries(widgetEntries);
        const chips = metadata.quickChips?.data?.filters || [];
        setWidgetsData(metadata);
        setDiscovery(chips);
        setWidgetsLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setSearchError(error.message || "Tour discovery could not be loaded");
        setWidgetsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [widgets, realtimeTick]);

  useEffect(() => {
    const fromUrl = parseTourSearchUrl(location.search);
    setSearchState((current) => (sameState(current, fromUrl) ? current : fromUrl));
  }, [location.search]);

  useEffect(() => {
    const controller = new AbortController();
    const queryChanged = previousQuery.current !== searchState.query;
    previousQuery.current = searchState.query;
    setSearching(true);
    setSearchError(null);
    const timer = window.setTimeout(
      async () => {
        try {
          const next = await fetchTourSearch(searchState, controller.signal);
          setResult(next);
        } catch (error) {
          if (!controller.signal.aborted)
            setSearchError(error.message || "Tours could not be loaded");
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      },
      queryChanged ? 400 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchState, realtimeTick]);

  const commitSearch = useCallback(
    (nextState, { replace = false } = {}) => {
      setSearchState(nextState);
      const queryString = serializeTourSearchUrl(nextState);
      navigate(`${location.pathname}${queryString ? `?${queryString}` : ""}`, { replace });
    },
    [location.pathname, navigate],
  );

  const handleFilterChange = useCallback(
    (values) => {
      commitSearch(mergeFlatFiltersIntoSearch(searchState, values));
    },
    [commitSearch, searchState],
  );

  const handleQuickFilter = useCallback(
    (chip) => {
      if (!chip) return;
      commitSearch(applyTourDiscoveryChip(searchState, chip));
    },
    [commitSearch, searchState],
  );

  const handleSortChange = useCallback(
    (sortId) => {
      commitSearch({ ...searchState, sort: getApiSort(sortId), page: 1 });
    },
    [commitSearch, searchState],
  );

  const handleQueryChange = useCallback(
    (query) => {
      commitSearch({ ...searchState, query: String(query || ""), page: 1 }, { replace: true });
    },
    [commitSearch, searchState],
  );

  const handlePageChange = useCallback(
    (page) => {
      commitSearch({ ...searchState, page });
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [commitSearch, searchState],
  );

  const onView = useCallback(
    (tour) => {
      const ref = getTourRef(tour);
      if (!ref) return;
      if (typeof dispatchEvent === "function") {
        dispatchEvent("navigateToTourDetails", {
          tourRef: ref,
          state: { tour, from: { label: "Tours", path: "/trevista/tours" } },
        });
        return;
      }
      navigate(`/trevista/tours/${encodeURIComponent(ref)}`, {
        state: { tour, from: { label: "Tours", path: "/trevista/tours" } },
      });
    },
    [dispatchEvent, navigate],
  );

  const activeDiscoveryIds = useMemo(() => {
    const matches = discovery.filter(
      (chip) =>
        (chip.type === "TAG" && searchState.filters.tagIds.includes(chip.value)) ||
        (chip.type === "ORIGIN" && searchState.filters.originCityIds.includes(chip.value)) ||
        (chip.type === "DESTINATION" &&
          searchState.filters.destinationCityIds.includes(chip.value)) ||
        (chip.type === "COUNTRY" && searchState.filters.countryIds.includes(chip.value)) ||
        (chip.type === "FEATURED" &&
          searchState.filters.featured === (chip.value === true || chip.value === "true")),
    );
    return matches.length ? matches.map((chip) => chip.id) : ["all"];
  }, [discovery, searchState.filters]);

  const activeFilterChips = useMemo(
    () => getActiveTourFilterChips(searchState, result.facets),
    [result.facets, searchState],
  );
  const handleClearFilters = useCallback(() => {
    const cleared = createDefaultTourSearchState();
    commitSearch({ ...cleared, sort: searchState.sort, pageSize: searchState.pageSize });
  }, [commitSearch, searchState.pageSize, searchState.sort]);

  const handleEnquire = useCallback(() => setContactOpen(true), []);

  return (
    <>
      <ToursPageView
        pageLabels={pageLabels}
        widgets={widgets}
        widgetsData={widgetsData}
        pageTitle={pageLabels.pageTitle}
        displayed={result.items}
        totalResults={result.pagination.totalItems}
        initialLoading={(pageLoading || widgetsLoading || searching) && result.items.length === 0}
        initialError={pageError || searchError}
        filterWidgetData={widgetsData.filters}
        listingWidgetData={widgetsData.listing}
        isAuthenticated={Boolean(userSession?.isAuthenticated || userSession?.user)}
        onView={onView}
        isFavorited={isFavorited}
        onFavorite={toggleFavorite}
        sortId={getUiSortId(searchState.sort)}
        onSortChange={handleSortChange}
        onQueryChange={handleQueryChange}
        currentPage={result.pagination.page}
        totalPages={result.pagination.totalPages}
        loadingMore={searching}
        onQuickFilter={handleQuickFilter}
        onPageChange={handlePageChange}
        filtersExpanded={filtersExpanded}
        onFiltersExpandedChange={setFiltersExpanded}
        filterValues={flattenTourSearchState(searchState)}
        facets={result.facets}
        activeDiscoveryIds={activeDiscoveryIds}
        discoveryOptions={discovery}
        activeFilterChips={activeFilterChips}
        onClearFilters={handleClearFilters}
        handleFilterChange={handleFilterChange}
        onEnquire={handleEnquire}
      />
      <ContactAgentModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        user={userSession?.user || null}
        product="trevista"
      />
    </>
  );
}
