import React, { useState, useMemo } from "react";
import { Button, EmptyState } from "@packages/trem-ui";
import "./AdminServicesView.scss";

const TYPE_FILTERS = ["all", "tours", "trips"];

const TRIP_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

const STATUS_COLORS = {
  draft: "var(--muted)",
  listed: "var(--color-primary)",
  active: "var(--color-primary)",
  completed: "var(--success-color)",
  cancelled: "var(--color-danger)",
};

function formatPrice(price) {
  if (!price && price !== 0) return "—";
  const value = Number(price);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value.toLocaleString("en-IN")}`;
  }
}

export default function AdminServicesView({
  tours, trips, loading,
  onEditTour, onViewTour, onDeleteTour,
  onEditTrip, onViewTrip, onDeleteTrip,
  onCreateTour, onCreateTrip,
  onRefresh, onDeleteAllTours, onDeleteAllTrips,
  formOpen, tripFormOpen, viewOpen, tripViewOpen,
  setFormOpen, setTripFormOpen, setViewOpen, setTripViewOpen, setViewTour, setViewTrip,
  openTripCreate, openTripEdit,
  children,
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [tripTypeFilter, setTripTypeFilter] = useState("");

  const filteredTrips = useMemo(() => {
    let result = trips || [];
    if (tripTypeFilter) {
      result = result.filter((t) => {
        if (tripTypeFilter === "domestic") return !(t.tags || []).includes("international") && t.category !== "international";
        if (tripTypeFilter === "international") return (t.tags || []).includes("international") || t.category === "international";
        return true;
      });
    }
    return result;
  }, [trips, tripTypeFilter]);

  const allServices = useMemo(() => {
    const tourItems = (tours || []).map((t) => ({ ...t, _serviceType: "tour" }));
    const tripItems = filteredTrips.map((t) => ({ ...t, _serviceType: "trip" }));
    const combined = [...tourItems, ...tripItems];
    if (typeFilter === "tours") return tourItems;
    if (typeFilter === "trips") return tripItems;
    return combined;
  }, [tours, filteredTrips, typeFilter]);

  const tourCount = (tours || []).length;
  const tripCount = (trips || []).length;

  return (
    <div className="asv">
      <div className="asv__header">
        <div>
          <h1 className="asv__title">Services</h1>
          <p className="asv__subtitle">{allServices.length} service{allServices.length !== 1 ? "s" : ""} total</p>
        </div>
        <div className="asv__actions">
          <Button primaryClassName="btn" variant="solid" color="primary" onClick={onCreateTour} text="+ New Tour" />
          <Button primaryClassName="btn" variant="solid" color="primary" onClick={onCreateTrip || openTripCreate} text="+ New Trip" />
          <Button primaryClassName="btn" variant="outline" onClick={onRefresh} text="Refresh" />
        </div>
      </div>

      <div className="asv__filters">
        <div className="asv__filter-tabs">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              className={`asv__filter-tab ${typeFilter === f ? "is-active" : ""}`}
              onClick={() => setTypeFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="asv__filter-count">
                {f === "all" ? tourCount + tripCount : f === "tours" ? tourCount : tripCount}
              </span>
            </button>
          ))}
        </div>
        {(typeFilter === "all" || typeFilter === "trips") && (
          <div className="asv__trip-filter">
            <select className="asv__trip-select" value={tripTypeFilter} onChange={(e) => setTripTypeFilter(e.target.value)}>
              {TRIP_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="asv__loading">
          <div className="asv__spinner" />
          <span>Loading services...</span>
        </div>
      ) : allServices.length > 0 ? (
        <div className="asv__grid">
          {allServices.map((service) => {
            const isTour = service._serviceType === "tour";
            const image = isTour ? (service.photo || service.photos?.[0]) : service.image;
            const title = service.title || "Untitled";
            const rawCity = service.city;
            const cityText = rawCity && typeof rawCity === "object" ? `${rawCity.from || ""} → ${rawCity.to || ""}` : (rawCity || "");
            const location = service.location || cityText;
            const status = service.status || "draft";
            const price = isTour ? service.price?.min : service.price?.amount;

            return (
              <div key={service._id || service.id} className={`asv__card ${isTour ? "asv__card--tour" : "asv__card--trip"}`}>
                <div className="asv__card-img-wrap">
                  {image ? (
                    <img src={image} alt={title} className="asv__card-img" />
                  ) : (
                    <div className="asv__card-placeholder">{title.charAt(0)}</div>
                  )}
                  <span className="asv__card-type">{isTour ? "Tour" : "Trip"}</span>
                  <span
                    className="asv__card-status"
                    style={{ background: STATUS_COLORS[status] || STATUS_COLORS.draft }}
                  >
                    {status}
                  </span>
                </div>
                <div className="asv__card-body">
                  <h3 className="asv__card-title">{title}</h3>
                  {location && <p className="asv__card-location">{location}</p>}
                  <div className="asv__card-meta">
                    {service.duration && <span>{typeof service.duration === "object" ? `${service.duration.from || "—"} – ${service.duration.to || "—"}` : service.duration}</span>}
                    {service.tags && service.tags.length > 0 && (
                      <span className="asv__card-tags">
                        {service.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="asv__card-tag">{tag}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="asv__card-footer">
                    <span className="asv__card-price">{formatPrice(price)}</span>
                    <div className="asv__card-actions">
                      <Button
                        primaryClassName="btn asv__btn-sm"
                        variant="outline"
                        onClick={() => isTour ? onViewTour?.(service) : onViewTrip?.(service)}
                        text="View"
                      />
                      <Button
                        primaryClassName="btn asv__btn-sm"
                        variant="outline"
                        onClick={() => isTour ? onEditTour?.(service) : onEditTrip?.(service)}
                        text="Edit"
                      />
                      <Button
                        primaryClassName="btn asv__btn-sm asv__btn-danger"
                        variant="outline"
                        onClick={() => isTour ? onDeleteTour?.(service._id || service.id) : onDeleteTrip?.(service._id)}
                        text="Delete"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="compass"
          title="No services yet"
          description="Create your first tour or trip to get started."
        />
      )}

      {children}
    </div>
  );
}
