import React from "react";
import { Button, SubTitle, TrevioTripCard } from "@packages/trem-ui";
import { useMasterOptions } from "@packages/trem-utils";
import { WidgetError } from "../../shared/Skeleton";
import CreateTripForm from "./CreateTripForm";
import "./TripsTabWidget.scss";

export default function TripsTabWidget({
    trips, loading, error, formOpen, editing, auth,
    openCreate, openEdit, openView, handleDelete, handleDeleteAll,
    fetchTrips, setFormOpen,
}) {
    const [filter, setFilter] = React.useState("");
    const { options: masterOptions } = useMasterOptions(["common.tripTypeOptions"]);
    const tripTypeOptions = (masterOptions["common.tripTypeOptions"] || []).map((option) => ({ ...option, value: option.value === "all" ? "" : option.value }));
    const filtered = filter
        ? trips.filter((t) => {
            if (filter === "domestic") return !(t.tags || []).includes("international") && t.category !== "international";
            if (filter === "international") return (t.tags || []).includes("international") || t.category === "international";
            return true;
        })
        : trips;

    return (
        <>
            <header className="mt-toolbar" style={{ marginTop: 8 }}>
                <div>
                    <SubTitle text="Trips" />
                    <span className="tt-trip-count">{filtered.length} trip{filtered.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="mt-actions">
                    <select className="tt-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                        {tripTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <Button primaryClassName="btn" variant="solid" color="primary" onClick={openCreate} text="+ New Trip" />
                    <Button primaryClassName="btn" variant="outline" onClick={fetchTrips} text="Refresh" />
                    <Button primaryClassName="btn" variant="outline" color="danger" onClick={handleDeleteAll} text="Delete All" />
                </div>
            </header>

            {error && <WidgetError message={error} />}

            <div className="mt-content">
                <section className="tt-trip-grid" aria-live="polite">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="tt-trip-card tt-trip-card--skeleton">
                                <div className="tt-trip-card__img-wrap"><div className="tt-skeleton-pulse" /></div>
                                <div className="tt-trip-card__body">
                                    <div className="tt-skeleton-pulse" style={{ height: 20, width: "70%" }} />
                                    <div className="tt-skeleton-pulse" style={{ height: 14, width: "50%" }} />
                                </div>
                            </div>
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="mt-empty">No trips yet</div>
                    ) : (
                        filtered.map((trip) => <TrevioTripCard
                            key={trip._id || trip.id}
                            trip={trip}
                            management
                            ownershipMode="agency"
                            labels={{ agency: "Added by agency", platformAgency: "TravelsTREM", price: "Per person" }}
                            onView={openView}
                            onEdit={openEdit}
                            onDelete={(item) => handleDelete(item._id || item.id)}
                        />)
                    )}
                </section>

                {formOpen && (
                    <div className="mt-panels-overlay" role="dialog" aria-modal="true">
                        <CreateTripForm
                            initial={editing}
                            onCancel={() => setFormOpen(false)}
                            onSaved={async () => { setFormOpen(false); await fetchTrips(); }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
