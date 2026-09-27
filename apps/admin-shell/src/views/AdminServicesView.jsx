import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  FilterChips,
  MetricSummary,
  PRODUCT_TYPE,
  SearchBar,
  SingleSelect,
  TourCard,
  TrevioTripCard,
} from "@packages/trem-ui";
import { useMasterOptions } from "@packages/trem-utils";
import "./AdminServicesView.scss";

const LIVE_STATUSES = new Set(["active", "listed", "published"]);

const resolveEntityId = (value) => {
  if (value == null) return "";
  if (["string", "number"].includes(typeof value)) return String(value);
  if (typeof value === "object") {
    return (
      resolveEntityId(value._id) ||
      resolveEntityId(value.id) ||
      resolveEntityId(value.$oid) ||
      resolveEntityId(value.value)
    );
  }
  return "";
};

const resolveServiceId = (service) =>
  resolveEntityId(service?._id) || resolveEntityId(service?.id);

const serviceStatus = (service) => {
  if (service?.status) return String(service.status).toLowerCase();
  if (service?.isPublished || service?.isListed) return "published";
  return "draft";
};

const searchableText = (service) =>
  [
    service.title,
    service.slug,
    service.city?.from,
    service.city?.to,
    typeof service.city === "string" ? service.city : "",
    service.location,
    service.category,
    service.agency?.name,
    service.ownerAgentName,
    service.operator?.name,
    ...(service.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export default function AdminServicesView({
  tours,
  trips,
  loading,
  onEditTour,
  onViewTour,
  onDeleteTour,
  onEditTrip,
  onViewTrip,
  onDeleteTrip,
  onVerifyTour,
  onVerifyTrip,
  onCreateTour,
  onCreateTrip,
  onRefresh,
  auth,
  activeProducts,
  children,
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [tripTypeFilter, setTripTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("updated_desc");
  const { options: masterOptions } = useMasterOptions(["common.tripTypeOptions"]);

  const productContractReady = Array.isArray(activeProducts);
  const productIds = useMemo(
    () => new Set((activeProducts || []).map((product) => product.id)),
    [activeProducts],
  );
  const showTours = !productContractReady || productIds.has(PRODUCT_TYPE.TREVISTA);
  const showTrips = !productContractReady || productIds.has(PRODUCT_TYPE.TREVIO);
  const productCount = Number(showTours) + Number(showTrips);

  const tripTypeOptions = useMemo(
    () =>
      (masterOptions["common.tripTypeOptions"] || []).map((option) => ({
        ...option,
        value: option.value === "all" ? "" : option.value,
      })),
    [masterOptions],
  );

  const availableServices = useMemo(() => {
    const tourItems = showTours
      ? (tours || []).map((item) => ({ ...item, _serviceType: "tour" }))
      : [];
    const tripItems = showTrips
      ? (trips || []).map((item) => ({ ...item, _serviceType: "trip" }))
      : [];
    return [...tourItems, ...tripItems];
  }, [showTours, showTrips, tours, trips]);

  const typeFilters = useMemo(() => {
    const toursCount = availableServices.filter((item) => item._serviceType === "tour").length;
    const tripsCount = availableServices.length - toursCount;
    return [
      { id: "all", label: "All products", count: availableServices.length },
      ...(showTours ? [{ id: "tours", label: "Tours", count: toursCount }] : []),
      ...(showTrips ? [{ id: "trips", label: "Trips", count: tripsCount }] : []),
    ];
  }, [availableServices, showTours, showTrips]);

  useEffect(() => {
    if (!typeFilters.some((item) => item.id === typeFilter)) setTypeFilter("all");
  }, [typeFilter, typeFilters]);

  const statusOptions = useMemo(
    () =>
      [...new Set(availableServices.map(serviceStatus))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [availableServices],
  );
  const statusSelectOptions = useMemo(
    () => [
      { value: "", label: "All statuses" },
      ...statusOptions.map((status) => ({
        value: status,
        label: status.replaceAll("_", " "),
      })),
    ],
    [statusOptions],
  );
  const sortOptions = useMemo(
    () => [
      { value: "updated_desc", label: "Recently updated" },
      { value: "updated_asc", label: "Oldest updated" },
      { value: "title", label: "By title" },
    ],
    [],
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = availableServices.filter((service) => {
      if (typeFilter === "tours" && service._serviceType !== "tour") return false;
      if (typeFilter === "trips" && service._serviceType !== "trip") return false;
      if (statusFilter && serviceStatus(service) !== statusFilter) return false;
      if (tripTypeFilter && service._serviceType === "trip") {
        const international =
          (service.tags || []).includes("international") ||
          service.category === "international";
        if (tripTypeFilter === "domestic" && international) return false;
        if (tripTypeFilter === "international" && !international) return false;
      }
      return !normalizedQuery || searchableText(service).includes(normalizedQuery);
    });

    return [...result].sort((left, right) => {
      if (sortOrder === "title")
        return String(left.title || "").localeCompare(String(right.title || ""));
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return sortOrder === "updated_asc" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [availableServices, query, sortOrder, statusFilter, tripTypeFilter, typeFilter]);

  const summaryItems = useMemo(() => {
    const live = availableServices.filter((item) => LIVE_STATUSES.has(serviceStatus(item))).length;
    const pending = availableServices.filter(
      (item) => serviceStatus(item) === "pending_approval",
    ).length;
    const verified = availableServices.filter((item) => item.tremVerified).length;
    return [
      {
        id: "products",
        label: "Active products",
        value: productCount,
        icon: "briefcaseBusiness",
      },
      {
        id: "inventory",
        label: "Total inventory",
        value: availableServices.length,
        icon: "map",
      },
      { id: "live", label: "Live catalogue", value: live, icon: "globe" },
      { id: "pending", label: "Awaiting approval", value: pending, icon: "clock" },
      { id: "verified", label: "TREM verified", value: verified, icon: "shieldCheck" },
    ];
  }, [availableServices, productCount]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("");
    setTripTypeFilter("");
    setTypeFilter("all");
  };
  const hasFilters = Boolean(query || statusFilter || tripTypeFilter || typeFilter !== "all");
  const activeFilterChips = useMemo(
    () => [
      ...(query ? [{ id: "query", label: `Search: ${query}` }] : []),
      ...(statusFilter
        ? [{ id: "status", label: statusFilter.replaceAll("_", " ") }]
        : []),
      ...(tripTypeFilter
        ? [
            {
              id: "tripType",
              label:
                tripTypeOptions.find((option) => option.value === tripTypeFilter)?.label ||
                tripTypeFilter,
            },
          ]
        : []),
    ],
    [query, statusFilter, tripTypeFilter, tripTypeOptions],
  );
  const removeFilter = (id) => {
    if (id === "query") setQuery("");
    if (id === "status") setStatusFilter("");
    if (id === "tripType") setTripTypeFilter("");
  };

  return (
    <div className="asv">
      <section className="asv__hero">
        <div className="asv__hero-copy">
          <span>TRAVEL CATALOGUE</span>
          <h1>Travel product operations</h1>
          <p>
            Review publishing health, verify catalogue quality and manage every active
            TravelsTREM product from one workspace.
          </p>
        </div>
        <div className="asv__actions">
          {showTours ? (
            <Button
              variant="solid"
              color="primary"
              iconLeft="plus"
              onClick={onCreateTour}
              text="Create tour"
            />
          ) : null}
          {showTrips ? (
            <Button
              variant="outline"
              iconLeft="plus"
              onClick={onCreateTrip}
              text="Create trip"
            />
          ) : null}
          <Button
            variant="outline"
            iconLeft="refreshCw"
            onClick={onRefresh}
            text="Refresh"
            disabled={loading}
          />
        </div>
      </section>

      <MetricSummary
        className="asv__metrics"
        variant="cards"
        ariaLabel="Travel catalogue summary"
        items={summaryItems}
      />

      <section className="asv__catalogue">
        <header className="asv__catalogue-header">
          <div>
            <h2>Catalogue inventory</h2>
            <p>
              {filteredServices.length} of {availableServices.length} records in this view
            </p>
          </div>
          <div className="asv__filter-tabs" role="tablist" aria-label="Product types">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={typeFilter === filter.id}
                className={`asv__filter-tab ${typeFilter === filter.id ? "is-active" : ""}`}
                onClick={() => setTypeFilter(filter.id)}
              >
                {filter.label}
                <span className="asv__filter-count">{filter.count}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="asv__controls">
          <SearchBar
            className="asv__search"
            value={query}
            onChange={setQuery}
            ariaLabel="Search travel catalogue"
            placeholder="Search title, destination, agency, owner or tag"
          />
          <SingleSelect
            className="asv__select"
            label="Publishing status"
            placeholder="All statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusSelectOptions}
            size="sm"
          />
          {showTrips &&
          (typeFilter === "all" || typeFilter === "trips") &&
          tripTypeOptions.length ? (
            <SingleSelect
              className="asv__select"
              label="Trip type"
              placeholder="All trip types"
              value={tripTypeFilter}
              onChange={setTripTypeFilter}
              options={tripTypeOptions}
              size="sm"
            />
          ) : null}
          <SingleSelect
            className="asv__select"
            label="Sort catalogue"
            value={sortOrder}
            onChange={setSortOrder}
            options={sortOptions}
            size="sm"
          />
          {hasFilters ? <Button variant="ghost" text="Clear" onClick={clearFilters} /> : null}
        </div>
        <FilterChips
          className="asv__active-filters"
          items={activeFilterChips}
          onRemove={removeFilter}
          onClearAll={clearFilters}
          clearLabel="Clear filters"
          ariaLabel="Active catalogue filters"
        />

        {loading ? (
          <div className="asv__loading">
            <div className="asv__spinner" />
            <span>Loading catalogue…</span>
          </div>
        ) : filteredServices.length ? (
          <div className="asv__grid">
            {filteredServices.map((service) => {
              const isTour = service._serviceType === "tour";
              if (isTour) {
                return (
                  <TourCard
                    key={resolveServiceId(service)}
                    tour={service}
                    variant="management"
                    isAdmin
                    managementActions
                    ownershipMode="agency"
                    ownershipLabels={{
                      agency: "Agency",
                      platformAgency: "TravelsTREM platform",
                    }}
                    ownerAgentName={service.ownerAgentName || ""}
                    showOwner
                    onView={() => onViewTour?.(service)}
                    onEdit={() => onEditTour?.(service)}
                    onVerify={
                      auth?.adminLevel === "master"
                        ? () => onVerifyTour?.(resolveServiceId(service))
                        : undefined
                    }
                    onDelete={() => onDeleteTour?.(resolveServiceId(service))}
                  />
                );
              }

              return (
                <TrevioTripCard
                  key={resolveServiceId(service)}
                  trip={service}
                  management
                  ownershipMode="agency"
                  labels={{
                    agency: "Agency",
                    platformAgency: "TravelsTREM platform",
                    price: "From",
                  }}
                  onView={() => onViewTrip?.(service)}
                  onEdit={() => onEditTrip?.(service)}
                  onApprove={
                    auth?.adminLevel === "master" && !service.tremVerified
                      ? () => onVerifyTrip?.(resolveServiceId(service))
                      : undefined
                  }
                  approveLabel="Verify"
                  onDelete={() => onDeleteTrip?.(resolveServiceId(service))}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={hasFilters ? "search" : "compass"}
            title={
              hasFilters
                ? "No catalogue records match these filters"
                : "No travel inventory yet"
            }
            description={
              hasFilters
                ? "Clear or adjust the catalogue filters to see more records."
                : "Create inventory for an active product to start building the live catalogue."
            }
            action={
              hasFilters ? (
                <Button variant="outline" text="Clear filters" onClick={clearFilters} />
              ) : undefined
            }
          />
        )}
      </section>
      {children}
    </div>
  );
}
