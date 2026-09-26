import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BottomSheet,
  Breadcrumbs,
  Button,
  FilterChips,
  Icon,
  InputField,
  NoDataFound,
  Pagination,
  Preloader,
  QuickChips,
  SingleSelect,
  TrevioTripCard,
  useFavoritesContext,
} from "@packages/trem-ui";
import {
  responsePagination,
  responseQuickChips,
  responseTripFilterOptions,
  responseTripSortOptions,
  responseTrips,
  tripId,
} from "../utils";
import { fetchData } from "@packages/trem-utils";
import { useTourCatalogRealtime } from "@packages/trem-events";
import "./Trips.scss";

const pageDefaults = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 1,
  hasMore: false,
};

const normalizeFilters = (options = []) =>
  (Array.isArray(options) ? options : [])
    .map((option) => ({
      id: String(option.value || option.name || option.title || "").toLowerCase(),
      label: option.title || option.label || option.name || option.value || "",
      disabled: Boolean(option.disabled),
    }))
    .filter((option) => option.id);

const withAnyOption = (options = [], label = "Any") => [
  { value: "", label },
  ...(Array.isArray(options) ? options : []),
];

function TripFilterPanel({
  labels,
  values,
  options,
  onChange,
  onApply,
  onReset,
  onClose,
}) {
  return (
    <div className="trevio-trip-filters-panel">
      <div className="trevio-trip-filters-panel__grid">
        <SingleSelect
          label={labels.tripDirectoryFilterFrom}
          value={values.from}
          onChange={(value) => onChange("from", value)}
          options={withAnyOption(options.from, labels.tripDirectoryFilterAnyFrom)}
          size="sm"
        />
        <SingleSelect
          label={labels.tripDirectoryFilterTo}
          value={values.to}
          onChange={(value) => onChange("to", value)}
          options={withAnyOption(options.to, labels.tripDirectoryFilterAnyTo)}
          size="sm"
        />
        <SingleSelect
          label={labels.tripDirectoryFilterBudget}
          value={values.maxBudget}
          onChange={(value) => onChange("maxBudget", value)}
          options={withAnyOption(options.budget, labels.tripDirectoryFilterAnyBudget)}
          size="sm"
        />
        <SingleSelect
          label={labels.tripDirectoryFilterFlights}
          value={values.flights || "all"}
          onChange={(value) => onChange("flights", value === "all" ? "" : value)}
          options={options.flights}
          size="sm"
        />
      </div>
      <div className="trevio-trip-filters-panel__actions">
        <Button variant="text" color="primary" onClick={onReset}>
          {labels.tripDirectoryFilterReset}
        </Button>
        <Button variant="outline" color="primary" onClick={onClose}>
          {labels.tripDirectoryFilterClose}
        </Button>
        <Button variant="solid" color="primary" onClick={onApply}>
          {labels.tripDirectoryFilterApply}
        </Button>
      </div>
    </div>
  );
}

export default function Trips({ pageModel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = new URLSearchParams(location.search);
  const routeQuery = routeParams.get("search") || "";
  const routeDestination = routeParams.get("destination") || "";
  const routeStartDate = routeParams.get("startDate") || "";
  const routeEndDate = routeParams.get("endDate") || "";
  const routeTravellers = routeParams.get("travellers") || "";
  const routeCategory = routeParams.get("category") || "";
  const { isFavorited, toggleFavorite } = useFavoritesContext();
  const labels = {
    homeBreadcrumb: "Trevio",
    emptyTripList: "No trips found",
    tripDirectoryEyebrow: "Curated departures",
    tripDirectoryHeading: "Trips",
    tripDirectoryDescription:
      "Browse fixed departures, seats, pricing and trip logistics curated by verified travel partners.",
    tripDirectorySearchPlaceholder: "Search by destination, theme or trip",
    tripDirectoryBackAction: "Back to Home",
    tripDirectoryHeroSignal: "TREM curated",
    tripDirectoryHeroPartners: "Verified travel partners",
    tripDirectoryHeroSeats: "Live seats and logistics",
    tripDirectoryEmptyDescription: "Try a different filter or search for another destination.",
    tripDirectoryClearAction: "Clear filters",
    tripDirectoryFiltersAction: "Filters",
    tripDirectoryFiltersTitle: "Filters",
    tripDirectoryFilterFrom: "From",
    tripDirectoryFilterTo: "To",
    tripDirectoryFilterBudget: "Budget",
    tripDirectoryFilterFlights: "Flights",
    tripDirectoryFilterAnyFrom: "Any origin",
    tripDirectoryFilterAnyTo: "Any destination",
    tripDirectoryFilterAnyBudget: "Any budget",
    tripDirectoryFilterApply: "Apply",
    tripDirectoryFilterReset: "Reset",
    tripDirectoryFilterClose: "Close filters",
    tripDirectoryResultsLabel: "trips",
    tripDirectoryUpdatingLabel: "Updating…",
    tripDirectorySearchChip: "Search",
    ...(pageModel?.labels || {}),
  };
  const tripList = pageModel?.tripList || {};
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState(pageDefaults);
  const [filters, setFilters] = useState(() => normalizeFilters(tripList.filters));
  const [sortOptions, setSortOptions] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    from: [],
    to: [],
    budget: [],
    flights: [],
  });
  const [category, setCategory] = useState(routeCategory || "all");
  const [advancedFilters, setAdvancedFilters] = useState({
    from: "",
    to: "",
    maxBudget: "",
    flights: "",
  });
  const [draftFilters, setDraftFilters] = useState(advancedFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [query, setQuery] = useState(routeQuery);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [realtimeTick, setRealtimeTick] = useState(0);

  useEffect(() => {
    setFilters((current) => (current.length ? current : normalizeFilters(tripList.filters)));
  }, [tripList.filters]);

  useEffect(() => {
    setQuery(routeQuery);
    setCategory(routeCategory || "all");
    setPage(1);
  }, [routeQuery, routeDestination, routeStartDate, routeEndDate, routeTravellers, routeCategory]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchData("/trevio/trips.json", {
      params: {
        page,
        limit: pageDefaults.limit,
        category,
        sort,
        search: query,
        destination: routeDestination,
        startDate: routeStartDate,
        endDate: routeEndDate,
        travellers: routeTravellers,
        from: advancedFilters.from,
        to: advancedFilters.to,
        maxBudget: advancedFilters.maxBudget,
        flights: advancedFilters.flights,
      },
    })
      .then((response) => {
        if (!active) return;
        setTrips(responseTrips(response));
        setPagination({ ...pageDefaults, ...responsePagination(response) });
        const nextFilters = normalizeFilters(responseQuickChips(response));
        if (nextFilters.length) setFilters(nextFilters);
        const nextSortOptions = responseTripSortOptions(response);
        if (nextSortOptions.length) setSortOptions(nextSortOptions);
        const nextFilterOptions = responseTripFilterOptions(response);
        setFilterOptions((current) => ({
          from: nextFilterOptions.from || current.from,
          to: nextFilterOptions.to || current.to,
          budget: nextFilterOptions.budget || current.budget,
          flights: nextFilterOptions.flights || current.flights,
        }));
      })
      .catch(() => {
        if (!active) return;
        setTrips([]);
        setPagination(pageDefaults);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [advancedFilters, category, page, query, realtimeTick, routeDestination, routeStartDate, routeEndDate, routeTravellers, sort]);

  useTourCatalogRealtime(
    useCallback(() => {
      setRealtimeTick((current) => current + 1);
    }, []),
  );

  const chips = useMemo(
    () =>
      filters.map((filter) => ({
        ...filter,
        disabled: filter.disabled || loading,
      })),
    [filters, loading],
  );

  const handleCategory = useCallback((nextCategory) => {
    setCategory(nextCategory || "all");
    setPage(1);
  }, []);

  const handleOpenFilters = useCallback(() => {
    setDraftFilters(advancedFilters);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
      setFiltersSheetOpen(true);
      return;
    }
    setFiltersExpanded((current) => !current);
  }, [advancedFilters]);

  const handleSearch = useCallback((nextQuery) => {
    setQuery(nextQuery);
    setPage(1);
  }, []);

  const handleSort = useCallback((nextSort) => {
    setSort(nextSort || "recommended");
    setPage(1);
  }, []);

  const handleDraftFilter = useCallback((field, value) => {
    setDraftFilters((current) => ({ ...current, [field]: value || "" }));
  }, []);

  const applyFilters = useCallback(() => {
    setAdvancedFilters(draftFilters);
    setPage(1);
    setFiltersExpanded(false);
    setFiltersSheetOpen(false);
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    const reset = { from: "", to: "", maxBudget: "", flights: "" };
    setDraftFilters(reset);
    setAdvancedFilters(reset);
    setPage(1);
    setFiltersExpanded(false);
    setFiltersSheetOpen(false);
  }, []);

  const activeFilterCount = [
    category !== "all" ? category : "",
    advancedFilters.from,
    advancedFilters.to,
    advancedFilters.maxBudget,
    advancedFilters.flights,
  ].filter(Boolean).length;

  const labelForOption = useCallback((options, value) => {
    const match = (Array.isArray(options) ? options : []).find(
      (option) => String(option.value ?? option.id) === String(value),
    );
    return match?.label || value;
  }, []);

  const activeFilterChips = useMemo(() => {
    const items = [];
    if (query) items.push({ id: "query", label: `${labels.tripDirectorySearchChip}: ${query}` });
    if (category !== "all") {
      items.push({
        id: "category",
        label: labelForOption(filters, category),
      });
    }
    if (advancedFilters.from) {
      items.push({
        id: "from",
        label: `${labels.tripDirectoryFilterFrom}: ${labelForOption(filterOptions.from, advancedFilters.from)}`,
      });
    }
    if (advancedFilters.to) {
      items.push({
        id: "to",
        label: `${labels.tripDirectoryFilterTo}: ${labelForOption(filterOptions.to, advancedFilters.to)}`,
      });
    }
    if (advancedFilters.maxBudget) {
      items.push({
        id: "maxBudget",
        label: labelForOption(filterOptions.budget, advancedFilters.maxBudget),
      });
    }
    if (advancedFilters.flights) {
      items.push({
        id: "flights",
        label: labelForOption(filterOptions.flights, advancedFilters.flights),
      });
    }
    return items;
  }, [
    advancedFilters,
    category,
    filterOptions,
    filters,
    labelForOption,
    labels.tripDirectoryFilterFrom,
    labels.tripDirectoryFilterTo,
    labels.tripDirectorySearchChip,
    query,
  ]);

  const removeFilterChip = useCallback((id) => {
    if (id === "query") setQuery("");
    if (id === "category") setCategory("all");
    if (["from", "to", "maxBudget", "flights"].includes(id)) {
      setAdvancedFilters((current) => ({ ...current, [id]: "" }));
      setDraftFilters((current) => ({ ...current, [id]: "" }));
    }
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setQuery("");
    setCategory("all");
    resetFilters();
  }, [resetFilters]);

  const openTrip = useCallback(
    (trip) => {
      navigate(`/trips/${tripId(trip)}`, {
        state: {
          from: { label: labels.tripDirectoryHeading || "Trips", path: "/trips" },
          trail: [
            { label: labels.homeBreadcrumb || "Trevio", path: "/trevio" },
            { label: labels.tripDirectoryHeading || "Trips", path: "/trips" },
          ],
          tour: trip,
        },
      });
    },
    [labels.homeBreadcrumb, labels.tripDirectoryHeading, navigate],
  );

  return (
    <main className="trevio-trips-page">
      <div className="trevio-trips-page__breadcrumbs-shell">
        <div className="trevio-container">
          <Breadcrumbs
            items={[
              { label: labels.homeBreadcrumb || "Trevio", path: "/trevio" },
              { label: labels.tripDirectoryHeading || "Trips" },
            ]}
            className="trevio-trips-page__breadcrumbs"
          />
        </div>
      </div>

      <div className="trevio-container">
        <section className="trevio-trips-page__hero">
          <div>
            <span className="trevio-eyebrow">{labels.tripDirectoryEyebrow}</span>
            <h1>{labels.tripDirectoryHeading}</h1>
            <p>
              {labels.tripDirectoryDescription}
            </p>
          </div>
          <div className="trevio-trips-page__hero-panel" aria-hidden="true">
            <span>
              <Icon name="sparkles" size={18} />
              {labels.tripDirectoryHeroSignal}
            </span>
            <span>{labels.tripDirectoryHeroPartners}</span>
            <span>{labels.tripDirectoryHeroSeats}</span>
          </div>
        </section>

        <section className="trevio-trips-page__toolbar" aria-label="Filter trips">
          <Button
            type="button"
            variant="outline"
            color="primary"
            iconLeft="filter"
            text={`${labels.tripDirectoryFiltersAction}${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
            onClick={handleOpenFilters}
            primaryClassName="trevio-trips-page__filter-toggle"
            aria-expanded={filtersExpanded || filtersSheetOpen}
          />
          <div className="trevio-trips-page__toolbar-search">
            <Icon name="search" aria-hidden="true" />
            <InputField
              value={query}
              onChange={handleSearch}
              placeholder={labels.tripDirectorySearchPlaceholder}
              ariaLabel="Search trips"
            />
          </div>
          <SingleSelect
            value={sort}
            onChange={handleSort}
            options={sortOptions}
            ariaLabel="Sort trips"
            className="trevio-trips-page__toolbar-sort"
          />
          <div className="trevio-trips-page__toolbar-results" aria-live="polite">
            {loading
              ? labels.tripDirectoryUpdatingLabel
              : `${pagination.total || trips.length} ${labels.tripDirectoryResultsLabel}`}
          </div>
        </section>

        {filtersExpanded ? (
          <div className="trevio-trips-page__filters-dropdown">
            <TripFilterPanel
              labels={labels}
              values={draftFilters}
              options={filterOptions}
              onChange={handleDraftFilter}
              onApply={applyFilters}
              onReset={resetFilters}
              onClose={() => setFiltersExpanded(false)}
            />
          </div>
        ) : null}

        <FilterChips
          items={activeFilterChips}
          onRemove={removeFilterChip}
          onClearAll={activeFilterChips.length ? clearAllFilters : null}
          clearLabel={labels.tripDirectoryClearAction}
          className="trevio-trips-page__active-chips"
        />

        <QuickChips
          filters={chips}
          activeId={category}
          onClick={handleCategory}
          className="trevio-trips-page__quick-chips"
        />

        {loading && !trips.length ? (
          <Preloader variant="grid" label="Loading trips" count={6} />
        ) : (
          <div className={`trevio-trip-grid${loading ? " is-loading" : ""}`}>
            {trips.length ? (
              trips.map((trip) => (
                <TrevioTripCard
                  key={tripId(trip)}
                  trip={trip}
                  labels={tripList.cardLabels}
                  favorited={isFavorited(trip)}
                  onFavorite={toggleFavorite}
                  onView={() => openTrip(trip)}
                />
              ))
            ) : (
              <NoDataFound
                className="trevio-trip-grid__empty"
                icon="search"
                title={labels.emptyTripList || "No trips found"}
                description={labels.tripDirectoryEmptyDescription}
                actionLabel={labels.tripDirectoryClearAction}
                onAction={() => {
                  setQuery("");
                  setCategory("all");
                  setSort("recommended");
                  resetFilters();
                }}
              />
            )}
          </div>
        )}

        <Pagination
          className="trevio-trips-page__pagination"
          currentPage={Number(pagination.page) || page}
          totalPages={Number(pagination.totalPages) || 1}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>

      <BottomSheet
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        title={labels.tripDirectoryFiltersTitle}
        className="trevio-trips-page__filters-sheet"
      >
        <TripFilterPanel
          labels={labels}
          values={draftFilters}
          options={filterOptions}
          onChange={handleDraftFilter}
          onApply={applyFilters}
          onReset={resetFilters}
          onClose={() => setFiltersSheetOpen(false)}
        />
      </BottomSheet>
    </main>
  );
}
