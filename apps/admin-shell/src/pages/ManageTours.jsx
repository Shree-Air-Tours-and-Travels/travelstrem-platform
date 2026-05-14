// FILE: src/pages/ManageTours.jsx
/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
import React, { useEffect, useState } from "react";
import "./ManageTours.scss";
import CreateTourForm from "../components/CreateTourForm";
import TourCardSecondary from "../pages/Tour/Cards/TourCardSecondary";
import TourView from "../components/TourView";
import GlobalLoader from "../components/Loader/Loader";
import BookingCard from "../components/BookingCard";
import {
    deleteAllTours,
    deleteTour,
    fetchAdminBookings,
    fetchAdminTours,
    updateBookingTravelers,
    confirmBooking,
    cancelBooking,
} from "../services/adminService";

/* ---------- simple Confirm modal ---------- */
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

/* ---------- ManageTours (Admin view) ---------- */
export default function ManageTours({ session }) {
    const auth = {
        user: session?.user || null,
        role: session?.flags?.role || session?.user?.role || "member",
    };
    const [tab, setTab] = useState("tours"); // "tours" | "bookings"
    const [tours, setTours] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewTour, setViewTour] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTours();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === "bookings") fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    /* ------------------ Tours ------------------ */
    /* ---------------- robust fetchTours ---------------- */
    async function fetchTours() {
        setLoading(true);
        setError(null);
        try {
            const fetched = await fetchAdminTours();
            setTours(Array.isArray(fetched) ? fetched : []);
        } catch (e) {
            console.error("fetchTours error:", e);
            setError(e.message || "Failed to load tours");
            setTours([]);
        } finally {
            setLoading(false);
        }
    }

    /* ---------------- delete one tour ---------------- */
    async function handleDelete(id) {
        const ok = confirm("Delete this tour? This action cannot be undone.");
        if (!ok) return;
        try {
            await deleteTour(id);
            await fetchTours();
        } catch (e) {
            console.error("handleDelete:", e);
            alert(e.message || "Delete failed");
        }
    }

    /* ---------------- delete all tours ---------------- */
    async function handleDeleteAll() {
        const ok = confirm("Delete ALL tours? This is irreversible. Continue?");
        if (!ok) return;
        try {
            await deleteAllTours();
            await fetchTours();
        } catch (e) {
            console.error("handleDeleteAll:", e);
            alert(e.message || "Delete all failed");
        }
    }


    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }
    function openEdit(t) {
        setEditing(t);
        setFormOpen(true);
    }
    function openView(t) {
        setViewTour(t);
        setViewOpen(true);
    }



    /* ------------------ Bookings (Admin/Agent) ------------------ */
    async function fetchBookings() {
        setLoadingBookings(true);
        try {
            const data = await fetchAdminBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("fetchBookings:", e);
            alert(e.message || "Failed to load bookings");
            setBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    }

    async function handleConfirmBooking(bookingId, finalPriceData = {}) {
        try {
            await confirmBooking(bookingId, finalPriceData);
            await fetchBookings();
            alert("Quote generated and sent to customer.");
        } catch (e) {
            console.error("confirmBooking:", e);
            alert(e.message || "Confirm failed");
        }
    }

    async function handleCancelBooking(bookingId) {
        try {
            await cancelBooking(bookingId);
            await fetchBookings();
            alert("Booking cancelled.");
        } catch (e) {
            console.error("cancelBooking:", e);
            alert(e.message || "Cancel failed");
        }
    }

    async function handleUpdateTravelers(bookingId, travelers) {
        try {
            await updateBookingTravelers(bookingId, travelers);
            await fetchBookings();
            alert("Travelers updated.");
        } catch (e) {
            console.error("updateTravelers:", e);
            alert(e.message || "Update failed");
        }
    }

    /* ------------------ UI ------------------ */
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

                        {/* Panels container: when either opens, show side overlays */}
                        {(viewOpen || formOpen) && (
                            <div className="mt-panels-overlay" role="dialog" aria-modal="true">
                                {/* Left: Tour View (50%) */}
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

                                {/* Right: Create/Edit Form (50%) */}
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
                            <div style={{ padding: 12 }}>No bookings found.</div>
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
                                            // open booking detail (reuse TourView if you like or navigate to /bookings/:id)
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
