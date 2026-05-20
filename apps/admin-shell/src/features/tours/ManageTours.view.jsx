import React from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@packages/trem-ui";
import "./ManageTours.scss";
import CreateTourForm from "./CreateTourForm";
import TourCardSecondary from "../../shared/ui/cards/TourCards/TourCardSecondary/TourCardSecondary";
import TourView from "./TourView";
import BookingCard from "./BookingCard";
import { TourCardSkeleton, BookingCardSkeleton, WidgetError } from "../../shared/Skeleton";

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

export function Toast({ toast, setToast }) {
    if (!toast.visible) return null;
    const bgMap = { success: "#2e7d32", error: "#c62828", info: "#1565c0" };
    return (
        <div
            className="tm-toast"
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 9999,
                background: bgMap[toast.type] || bgMap.info,
                color: "#fff",
                padding: "12px 20px",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                cursor: "pointer",
                animation: "tm-toast-in 260ms ease",
            }}
            onClick={() => setToast({ message: "", type: "info", visible: false })}
            role="alert"
        >
            <span>{toast.message}</span>
            <span style={{ fontSize: 18, lineHeight: 1, opacity: 0.8 }}>×</span>
        </div>
    );
}

export default function ManageToursView({
    tab, tours, bookings, loading, loadingBookings, formOpen, viewOpen, editing,
    viewTour, error, auth, setTab, openCreate, openEdit, openView, handleDelete,
    handleDeleteAll, fetchTours, fetchBookings, handleConfirmBooking,
    handleCancelBooking, handleUpdateTravelers, handleStatusTransition,
    handleRecordPayment, handleRefund, setFormOpen, setViewOpen, setViewTour,
    confirmDelete, confirmMessage, handleConfirmDelete, handleCancelDelete,
    toast, setToast
}) {
    const navigate = useNavigate();
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

                    {error && <WidgetError message={error} />}

                    <div className="mt-content">
                        <section className="mt-grid" aria-live="polite">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={i} />)
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
                            Array.from({ length: 4 }).map((_, i) => <BookingCardSkeleton key={i} />)
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
                                        onGenerateQuote={(id, data) => handleConfirmBooking(id, data)}
                                        onStatusTransition={(id, status) => handleStatusTransition(id, status)}
                                        onRecordPayment={(id, amount, currency) => handleRecordPayment(id, amount, currency)}
                                        onRefund={(id, amount, currency) => handleRefund(id, amount, currency)}
                                        onUpdateTravelers={(travelers) => handleUpdateTravelers(b.id || b._id, travelers)}
                                        onOpen={() => {
                                            navigate(`/bookings/${b.id || b._id}`);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            <Toast toast={toast} setToast={setToast} />
            <ConfirmModal
                open={confirmDelete !== null}
                message={confirmMessage}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
