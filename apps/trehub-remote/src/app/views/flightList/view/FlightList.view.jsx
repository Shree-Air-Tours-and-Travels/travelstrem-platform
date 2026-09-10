import React, { useEffect, useRef, useState } from "react";
import {
  BottomSheet,
  Breadcrumbs,
  ConfigurableFilterPanel,
  ErrorState,
  FlightCard,
  GlobalLoader,
  GlobalSearchCard,
  NoDataFound,
  OptionCardRail,
  Pagination,
  Paragraph,
  SingleSelect,
  SubTitle,
  FloatingActionBar,
} from "@packages/trem-ui";
import "./FlightList.view.scss";

const labelFor = (labels, ref, fallback = "") => (ref ? labels?.[ref] || fallback || ref : fallback);
const getByPath = (source, path) => path?.split(".").reduce((value, key) => value?.[key], source);
const formatLabel = (value, replacements) => Object.entries(replacements).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)), value || "");
const fieldPathForError = (path) => {
  const direct = {
    "journey.origin": "from",
    "journey.destination": "to",
    "journey.departureDate": "departDate",
    returnDate: "returnDate",
    adults: "travellers",
    children: "travellers",
    infants: "travellers",
    passengers: "travellers",
  }[path];
  if (direct) return direct;
  return path
    .replace(/^journeys\.(\d+)\.origin$/, "segments.$1.from")
    .replace(/^journeys\.(\d+)\.destination$/, "segments.$1.to")
    .replace(/^journeys\.(\d+)\.departureDate$/, "segments.$1.departDate");
};

export default function FlightListView({ loading, error, searchError, pageModel, onSearch, onFilterChange, onResetFilters, onSortChange, onPageChange, onSelectFlight }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const searchStageRef = useRef(null);

  useEffect(() => {
    const node = searchStageRef.current;
    if (!node || typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setMobileSearchVisible(!entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pageModel]);

  if (loading && !pageModel) return <GlobalLoader visible text="Loading flights" />;
  if (error || !pageModel) return <ErrorState title="Flights could not be loaded" error={error} retry={() => window.location.reload()} retryText="Retry" />;

  const { data = {}, labels = {}, options = {}, widgets = [] } = pageModel;
  const widget = (name) => widgets.find((item) => item.name === name) || {};
  const breadcrumbProps = widget("breadcrumbs").props || {};
  const searchProps = widget("flightSearch").props || {};
  const airlineProps = widget("airlineInterests").props || {};
  const filterProps = widget("filters").props || {};
  const resultProps = widget("flightResults").props || {};
  const pagination = getByPath(data, resultProps.paginationDataPath) || {};
  const results = getByPath(data, resultProps.resultsDataPath) || [];
  const query = data.query || {};
  const resolveOptions = (ref) => (options[ref] || []).map((option) => ({ ...option, label: labelFor(labels, option.labelRef, option.label) }));
  const filterFields = (options[filterProps.fieldsOptionsRef] || []).map((field) => ({
    ...field,
    label: labelFor(labels, field.labelRef),
    placeholder: labelFor(labels, field.placeholderRef),
    applyLabel: labelFor(labels, field.applyLabelRef),
    clearLabel: labelFor(labels, field.clearLabelRef),
    options: field.id === "airlines"
      ? (data.facets?.airlines || []).map((airline) => ({ value: airline.value, label: airline.label }))
      : resolveOptions(field.optionsRef),
  }));
  const filterValues = { ...query, airlines: query.airlines ? query.airlines.split(",") : [] };
  const initialFlightValues = { ...query };
  if (typeof initialFlightValues.segments === "string") {
    try {
      initialFlightValues.segments = JSON.parse(initialFlightValues.segments);
    } catch {
      initialFlightValues.segments = [];
    }
  }
  const searchKey = [query.choice, query.from, query.to, query.departDate, query.returnDate, query.travellers, query.segments].join("|");
  const searchFieldErrors = Object.fromEntries(
    Object.entries(searchError?.details || {}).map(([path, message]) => [fieldPathForError(path), message]),
  );
  const renderSearch = (placement, handleSearch = onSearch) => (
    <GlobalSearchCard
      key={`${placement}-${searchKey}`}
      labels={labels}
      urls={pageModel.urls}
      variant={searchProps.variant || "flight"}
      activeService={searchProps.activeService}
      ariaLabelRef={searchProps.ariaLabelRef}
      modes={options[searchProps.modesOptionsRef] || searchProps.modes}
      fieldsByMode={options[searchProps.fieldsOptionsRef] || searchProps.fieldsByMode}
      choiceGroupsByMode={options[searchProps.choiceGroupsOptionsRef] || searchProps.choiceGroupsByMode}
      submitLabelRef={searchProps.submitLabelRef}
      trustItems={searchProps.trustItems || []}
      initialValues={{ flight: initialFlightValues }}
      initialChoices={{ flight: query.choice || "oneway" }}
      onSearch={handleSearch}
      errorMessage={searchError?.message}
      fieldErrors={searchFieldErrors}
    />
  );

  return (
    <main className="trehub-flight-list">
      <div className="trehub-flight-list__breadcrumb">
        <Breadcrumbs items={(breadcrumbProps.items || []).map((item) => ({ label: labelFor(labels, item.labelRef), path: item.path }))} />
      </div>
      <section className="trehub-flight-list__search-stage" ref={searchStageRef}>
        <div className="trehub-flight-list__search-intro">
          <span>{labelFor(labels, "pageEyebrow")}</span>
          <SubTitle text={labelFor(labels, "pageTitle")} variant="primary" size="large" />
          <Paragraph text={labelFor(labels, "pageDescription")} />
        </div>
        {renderSearch("page")}
      </section>
      <OptionCardRail
        title={labelFor(labels, airlineProps.titleRef)}
        items={(getByPath(data, airlineProps.itemsDataPath) || []).map((item) => ({
          ...item,
          description: formatLabel(labelFor(labels, airlineProps.countTemplateRef), { count: item.count }),
        }))}
        selected={filterValues.airlines}
        onChange={(airlines) => onFilterChange("airlines", airlines)}
      />
      <div className="trehub-flight-list__body">
        <ConfigurableFilterPanel title={labelFor(labels, filterProps.titleRef)} resetLabel={labelFor(labels, filterProps.resetLabelRef)} fields={filterFields} values={filterValues} onChange={onFilterChange} onReset={onResetFilters} />
        <section className="trehub-flight-list__results">
          <header>
            <div>
              <h2>{labelFor(labels, resultProps.titleRef)}</h2>
              <p>{formatLabel(labelFor(labels, resultProps.countTemplateRef), { count: pagination.total || 0 })}</p>
            </div>
            <div className="trehub-flight-list__sort">
              <SingleSelect label={labelFor(labels, resultProps.sortLabelRef)} value={query.sort || "recommended"} options={resolveOptions(resultProps.sortOptionsRef)} onChange={onSortChange} />
            </div>
          </header>
          {results.length ? results.map((flight) => <FlightCard key={flight.offerId || flight.id} flight={flight} onSelect={onSelectFlight} labels={{ departureLabel: labelFor(labels, resultProps.departureLabelRef), cabinLabel: labelFor(labels, resultProps.cabinLabelRef), priceLabel: labelFor(labels, resultProps.priceLabelRef), priceSuffix: labelFor(labels, resultProps.priceSuffixRef), selectLabel: labelFor(labels, resultProps.selectLabelRef) }} />) : <NoDataFound title={labelFor(labels, resultProps.emptyTitleRef)} description={labelFor(labels, resultProps.emptyDescriptionRef)} icon="plane" />}
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={onPageChange} previousLabel={labelFor(labels, resultProps.previousLabelRef)} nextLabel={labelFor(labels, resultProps.nextLabelRef)} ariaLabel={labelFor(labels, resultProps.paginationAriaRef)} disabled={loading} showSinglePage={Boolean(resultProps.showSinglePage && pagination.total > 0)} />
        </section>
      </div>
      {mobileSearchVisible ? (
        <>
          <div className="trehub-flight-list__mobile-clearance" aria-hidden="true" />
          <FloatingActionBar
            hideOnDesktop
            actions={[
              {
                id: "search-flights",
                label: labelFor(labels, searchProps.mobileActionLabelRef),
                variant: "primary",
                iconLeft: "search",
                onClick: () => setMobileSearchOpen(true),
              },
            ]}
          />
        </>
      ) : null}
      <BottomSheet
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        title={labelFor(labels, searchProps.mobileSheetTitleRef)}
        closeLabel={labelFor(labels, searchProps.mobileCloseLabelRef)}
        className="trehub-flight-list__search-sheet"
      >
        {renderSearch("sheet", (payload) => {
          setMobileSearchOpen(false);
          onSearch?.(payload);
        })}
      </BottomSheet>
    </main>
  );
}
