import React from "react";
import { EmptyState, GlobalLoader } from "@packages/trem-ui";
import "./ManageTours.scss";
import CreateTourForm from "./CreateTourForm";
import TourCardSecondary from "../../shared/ui/cards/TourCards/TourCardSecondary/TourCardSecondary";
import TourView from "./TourView";
import BookingCard from "./BookingCard";

export function ConfirmModal({ open, title = "Confirm", message = "Are you sure?", onCancel, onConfirm }) {
    if (!open) return null;
    return (
        <div className="tm-modal-overlay" role="dialog" aria-modal="true">
            <div className="tm-modal">
                <div className="tm-modal-header">
                    <h4>{title}</h4>
                </div>
                <div className="tm-modal-body">
                    <p>{message}</p>
                </div>
                <div className="tm-modal-actions">
                    <button type="button" className="btn tm-btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn tm-btn-danger" onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ManageToursView({
    tab, tours, bookings, loading, loadingBookings, formOpen, viewOpen, editing,
    viewTour, error, auth, setTab, openCreate, openEdit, openView, handleDelete,
    handleDeleteAll, fetchTours, fetchBookings, handleConfirmBooking,
    handleCancelBooking, handleUpdateTravelers, setFormOpen, setViewOpen, setViewTour
}) {
    return (
        <div className="mt-root">
            <header className="mt-toolbar">
                <h2>Admin — Manage</h2>
                <div className="mt-actions">
                    <button className="btn" onClick={() => setTab("tours")}>Tours</button>
                    <button className="btn" onClick={() => setTab("bookings")}>Bookings</button>
                </div>
            </header>

            <div style={{ padding: 12 }}>
                <strong>Signed in as:</strong> {auth.user?.name || auth.user?.email} · role: {auth.role}
            </div>

            {tab === "tours" && (
                <>
                    <header className="mt-toolbar" style={{ marginTop: 8 }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Tours</h3>
                        </div>
                        <div className="mt-actions">
                            <button className="btn" onClick={openCreate}>+ New Tour</button>
                            <button className="btn" onClick={fetchTours}>Refresh</button>
                            <button className="btn" onClick={handleDeleteAll}>Delete All</button>
                        </div>
                    </header>

                    {error && <div className="mt-error">{error}</div>}

                    <div className="mt-content">
                        <section className="mt-grid" aria-live="polite">
                            {loading ? (
                                <GlobalLoader visible={loading} text={`Loading tours ...`} />
                            ) : tours.length === 0 ? (
                                <div className="mt-empty">No tours yet</div>
                            ) : (
                                tours.map((t) => (
                                    <TourCardSecondary
                                        key={t._id || t.id}
                                        tour={t}
                                        isAdmin
                                        onView={() => openView(t)}
                                        onEdit={() => openEdit(t)}
                                        onDelete={() => handleDelete(t._id || t.id)}
                                    />
                                ))
                            )}
                        </section>

                        {(viewOpen || formOpen) && (
                            <div className="mt-panels-overlay" role="dialog" aria-modal="true">
                                {viewOpen && (
                                    <TourView
                                        tour={viewTour}
                                        onClose={() => {
                                            setViewOpen(false);
                                            setViewTour(null);
                                        }}
                                        onEdit={(t) => {
                                            setViewOpen(false);
                                            openEdit(t);
                                        }}
                                    />
                                )}

                                {formOpen && (
                                    <CreateTourForm
                                        initial={editing}
                                        onCancel={() => setFormOpen(false)}
                                        onSaved={async () => {
                                            setFormOpen(false);
                                            await fetchTours();
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === "bookings" && (
                <>
                    <header className="mt-toolbar" style={{ marginTop: 8 }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Bookings</h3>
                            <p style={{ margin: 0, fontSize: 13, color: "#666" }}>Admins & agents can review requests, create quotes, and manage booking status.</p>
                        </div>
                        <div className="mt-actions">
                            <button className="btn" onClick={fetchBookings}>Refresh</button>
                        </div>
                    </header>

                    <div className="mt-content">
                        {loadingBookings ? (
                            <GlobalLoader visible={loadingBookings} text="Loading bookings..." />
                        ) : bookings.length === 0 ? (
                            <EmptyState
                                icon="calendar"
                                title="No bookings found"
                                description="No booking requests yet. They will appear here once customers submit them."
                            />
                        ) : (
                            <div style={{ display: "grid", gap: 12 }}>
                                {bookings.map((b) => (
                                    <BookingCard
                                        key={b.id || b._id}
                                        booking={b}
                                        role={auth.role}
                                        onCancel={() => handleCancelBooking(b.id || b._id)}
                                        onConfirm={(finalPriceData) => handleConfirmBooking(b.id || b._id, finalPriceData)}
                                        onUpdateTravelers={(travelers) => handleUpdateTravelers(b.id || b._id, travelers)}
                                        onOpen={() => {
                                            window.location.href = `/bookings/${b.id || b._id}`;
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            <ConfirmModal open={false} />
        </div>
    );
}
