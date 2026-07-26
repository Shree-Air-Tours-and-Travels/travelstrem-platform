import React from "react";
import { Button, SubTitle } from "@packages/trem-ui";
import { WidgetError } from "../../shared/Skeleton";
import CreateTripForm from "./CreateTripForm";
import "./TripsTabWidget.scss";

const TRIP_TYPE_OPTIONS = [
    { value: "", label: "All" },
    { value: "domestic", label: "Domestic" },
    { value: "international", label: "International" },
];

const STATUS_COLORS = {
    draft: "var(--muted)",
    listed: "var(--color-primary)",
    completed: "var(--success-color)",
    cancelled: "var(--color-danger)",
};

export default function TripsTabWidget({
    trips, loading, error, formOpen, editing, auth,
    openCreate, openEdit, handleDelete, handleDeleteAll,
    fetchTrips, setFormOpen,
}) {
    const [filter, setFilter] = React.useState("");
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
                        {TRIP_TYPE_OPTIONS.map((o) => (
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
                        filtered.map((t) => (
                            <div key={t._id} className="tt-trip-card">
                                <div className="tt-trip-card__img-wrap">
                                    {t.image ? (
                                        <img src={t.image} alt={t.title} className="tt-trip-card__img" />
                                    ) : (
                                        <div className="tt-trip-card__placeholder">{(t.title || "T")[0]}</div>
                                    )}
                                    <span className="tt-trip-card__badge" style={{ background: STATUS_COLORS[t.status] || STATUS_COLORS.draft }}>
                                        {t.status}
                                    </span>
                                    {t.featured && <span className="tt-trip-card__featured">Featured</span>}
                                </div>
                                <div className="tt-trip-card__body">
                                    <div className="tt-trip-card__top">
                                        <h4 className="tt-trip-card__title">{t.title}</h4>
                                        <span className="tt-trip-card__tag">{t.tag || t.category}</span>
                                    </div>
                                    <div className="tt-trip-card__meta">
                                        <span>{t.location}{t.country && t.country !== "India" ? `, ${t.country}` : ""}</span>
                                        {t.duration && <span>{t.duration}</span>}
                                    </div>
                                    <div className="tt-trip-card__tags">
                                        {(t.tags || []).slice(0, 4).map((tag) => (
                                            <span key={tag} className="tt-trip-card__chip">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="tt-trip-card__price">
                                        {t.price?.amount != null ? `₹${Number(t.price.amount).toLocaleString("en-IN")}` : "—"}
                                        {t.price?.currency && t.price.currency !== "INR" ? ` ${t.price.currency}` : ""}
                                    </div>
                                    <div className="tt-trip-card__actions">
                                        <Button primaryClassName="btn tt-btn-sm" variant="outline" onClick={() => openEdit(t)} text="Edit" />
                                        <Button primaryClassName="btn tt-btn-sm tt-btn-danger" variant="outline" onClick={() => handleDelete(t._id)} text="Delete" />
                                    </div>
                                </div>
                            </div>
                        ))
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
