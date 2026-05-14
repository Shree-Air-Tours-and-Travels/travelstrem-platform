// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import "../../modals/BookingModal.scss"; // reuse styles
import { useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import GlobalLoader from "../../components/Loader/Loader";
import { getTourDetailsPath, slugify } from "@packages/trem-utils";
import { usePortalConfig } from "../../components/portal/PortalConfigContext";
import CustomerBookingCard from "../../components/bookings/CustomerBookingCard";

// Toggle mock via env during development


export default function DashboardPage() {
    const { session } = usePortalConfig();
    const user = session?.user || {};
    const role = session?.flags?.role || user.role || "member";
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => {
        loadBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, filterStatus]);

    async function loadBookings() {
        try {
            setLoading(true);
            setError("");

            // Build params the same way as real call (so refresh & status behave)
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (role === "member") {
                params.userId = user?.id || user?._id;
            }

            // Real API path
            const qp = new URLSearchParams(params).toString();
            const endpoint = `/bookings${qp ? `?${qp}` : ""}`;

            const res = await fetchData(endpoint);
            if (!res || res.status !== "success") {
                throw new Error(res.message || "Failed to load bookings");
            }
            const data = res.componentData && res.componentData.data;
            setBookings(Array.isArray(data) ? data : (data ? [data] : []));
        } catch (err) {
            console.error("loadBookings:", err);
            setError(err.message || "Failed to load bookings");
        } finally {
            setLoading(false);
        }
    }

    // actions
    async function handleCancel(bookingId) {
        try {
            setMessage("");
            // optimistic UI update for immediate feedback
            setBookings(prev => prev.map(b => (String(b.id || b._id) === String(bookingId) ? { ...b, status: "CANCELLED" } : b)));

            const res = await fetchData(`/bookings/${bookingId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" } });
            if (!res || res.status !== "success") throw new Error(res.message || "Cancel failed");

            // reload authoritative data
            await loadBookings();
            setMessage("Booking cancelled.");
        } catch (err) {
            console.error(err);
            // rollback optimistic change if real API failed
            await loadBookings();
            setError(err.message || "Cancel failed");
        }
    }

    async function handleConfirm(bookingId, finalPriceData = {}) {
        try {
            const res = await fetchData(`/bookings/${bookingId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payment: finalPriceData }) });
            if (!res || res.status !== "success") throw new Error(res.message || "Confirm failed");
            await loadBookings();
        } catch (err) {
            console.error(err);
            alert(err.message || "Confirm failed");
        }
    }

    async function handleAcceptQuote(bookingId) {
        try {
            const res = await fetchData(`/bookings/${bookingId}/accept-quote`, { method: "POST", headers: { "Content-Type": "application/json" } });
            if (!res || res.status !== "success") throw new Error(res.message || "Accept quote failed");
            await loadBookings();
            setMessage("Quote accepted. Payment is now pending.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Accept quote failed");
        }
    }

    async function handleRejectQuote(bookingId) {
        try {
            const res = await fetchData(`/bookings/${bookingId}/reject-quote`, { method: "POST", headers: { "Content-Type": "application/json" } });
            if (!res || res.status !== "success") throw new Error(res.message || "Reject quote failed");
            await loadBookings();
            setMessage("Quote rejected. Our team can revise it.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Reject quote failed");
        }
    }

    async function handleUpdateTravelers(bookingId, travelers) {
        try {
            const res = await fetchData(`/bookings/${bookingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ travelers }) });
            if (!res || res.status !== "success") throw new Error(res.message || "Update failed");
            await loadBookings();
        } catch (err) {
            console.error(err);
            alert(err.message || "Update failed");
            throw err;
        }
    }

    function handlePay(booking) {
        const bookingId = booking?.id || booking?._id;
        if (bookingId) navigate(`/checkout/${bookingId}`);
    }

    // unified navigation helper — used by both cards
    function goToTour(payload) {
        if (!payload) return;
        let tourRef = null;
        if (typeof payload === "string" || typeof payload === "number") {
            tourRef = String(payload);
        } else if (typeof payload === "object") {
            tourRef = slugify(payload.tour?.title) || payload.tour?.id || payload.tour?._id || null;
        }
        if (!tourRef) return;
        navigate(getTourDetailsPath(tourRef), typeof payload === "object" ? { state: { tour: payload.tour } } : undefined);
    }

    // presentation helpers
    const cardStyle = { borderRadius: 12, padding: 12, background: 'var(--card-bg)', color: "var(--text)", border: "1px solid var(--border)", boxShadow: 'var(--shadow-sm)' };

    function statusStyle(status) {
        const s = String(status || "").toUpperCase();
        if (s === "CANCELLED") return { background: "var(--danger-soft)", color: "var(--color-danger)", padding: '4px 8px', borderRadius: 8, fontWeight: 600 };
        if (["CONFIRMED", "TICKETED", "TRAVEL_READY", "COMPLETED", "PAID"].includes(s)) return { background: "var(--success-soft)", color: "var(--color-primary-dark)", padding: '4px 8px', borderRadius: 8, fontWeight: 600 };
        if (["QUOTE_REQUESTED", "UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT", "PAYMENT_PENDING", "PARTIALLY_PAID"].includes(s)) return { background: "var(--warning-soft)", color: "var(--color-warning)", padding: '4px 8px', borderRadius: 8, fontWeight: 600 };
        return { background: "var(--surface-inset)", color: "var(--text)", padding: '4px 8px', borderRadius: 8, fontWeight: 600 };
    }

    function shouldShowPayNow(role, booking) {
        if (!booking) return false;
        const isMember = role === "member" || (booking.user && booking.user.role === "member");
        return isMember && ["PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"].includes(String(booking.status).toUpperCase()) && !!booking.priceSnapshot && !!booking.priceSnapshot.isFinal && Number(booking.priceSnapshot.total || 0) > Number(booking.payment?.amountPaid || 0);
    }

    // -----------------------
    // Card components (simple, clear, same file)
    // -----------------------

    function UserBookingCard({ b }) {
        const finalPriceReady = !!b.priceSnapshot && !!b.priceSnapshot.isFinal;
        const amountPaid = Number((b.payment && b.payment.amountPaid) || 0);
        const pendingAmount = finalPriceReady ? Math.max(0, (b.priceSnapshot.total || 0) - amountPaid) : 0;
        const isCancelled = String(b.status).toLowerCase() === "cancelled";

        return (
            <article className="booking-card user" style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>{b.tour?.title}</h3>
                        <div style={{ fontSize: 13, color: '#666' }}>{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ padding: '4px 8px', borderRadius: 8, background: '#f3f4f6' }}>{b.guestsCount} guest{b.guestsCount > 1 ? 's' : ''}</span>
                            <span style={statusStyle(b.status)}>{b.status}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <button className="btn" onClick={() => goToTour(b)}>View Tour</button>
                        {/* Cancel button disappears when already cancelled */}
                        {!isCancelled && <button className="btn btn-danger" onClick={() => handleCancel(b.id || b._id)}>Cancel</button>}
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Booked by</strong> {b.user?.name} • {b.user?.email}
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Price</strong>: {
                        finalPriceReady ? (
                            <>
                                {b.priceSnapshot.currency} {b.priceSnapshot.total}
                                {pendingAmount > 0 && (<div style={{ color: 'var(--accent, #0b6)' }}>Amount due: {b.priceSnapshot.currency} {pendingAmount}</div>)}
                            </>
                        ) : (
                            <em>Final price in progress</em>
                        )
                    }
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Travelers</strong>
                    <ul>
                        {Array.isArray(b.travelers) && b.travelers.map(t => (
                            <li key={t._id}>{t.firstName} {t.lastName} — {t.phone}</li>
                        ))}
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn" onClick={() => handleUpdateTravelers(b.id || b._id, b.travelers)}>Update travelers</button>
                    {shouldShowPayNow(role, b) && (
                        <button className="btn btn-accent">Pay Now</button>
                    )}
                </div>
            </article>
        );
    }

    function AdminBookingCard({ b }) {
        const finalPriceReady = !!b.priceSnapshot && !!b.priceSnapshot.isFinal;
        const amountPaid = Number((b.payment && b.payment.amountPaid) || 0);
        const waitingForUserPayment = String(b.status).toLowerCase() === 'confirmed' && amountPaid === 0;
        const isCancelled = String(b.status).toLowerCase() === "cancelled";

        return (
            <article className="booking-card admin" style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>{b.tour?.title}</h3>
                        <div style={{ fontSize: 13, color: '#666' }}>{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ padding: '4px 8px', borderRadius: 8, background: '#f3f4f6' }}>{b.guestsCount} guest{b.guestsCount > 1 ? 's' : ''}</span>
                            <span style={statusStyle(b.status)}>{b.status}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <button className="btn" onClick={() => goToTour(b)}>View Tour</button>
                        {/* show confirm only when not confirmed & not cancelled */}
                        {!isCancelled && b.status !== 'confirmed' && <button className="btn btn-primary" onClick={() => handleConfirm(b.id || b._id, {})}>Confirm</button>}
                        {/* Cancel disappears when cancelled */}
                        {!isCancelled && <button className="btn btn-danger" onClick={() => handleCancel(b.id || b._id)}>Cancel</button>}
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Customer</strong> {b.user?.name} • {b.user?.email}
                    <div style={{ marginTop: 6 }}><strong>Contact:</strong> <a href={`tel:${(b.travelers && b.travelers[0] && b.travelers[0].phone) || ''}`}>{(b.travelers && b.travelers[0] && b.travelers[0].phone) || '—'}</a></div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Price</strong>: {
                        finalPriceReady ? (
                            <>
                                {b.priceSnapshot.currency} {b.priceSnapshot.total}
                                {waitingForUserPayment && (<div style={{ color: '#b8860b' }}>Waiting for user payment</div>)}
                            </>
                        ) : (
                            <em>Final price in progress</em>
                        )
                    }
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Travelers</strong>
                    <ul>
                        {Array.isArray(b.travelers) && b.travelers.map(t => (
                            <li key={t._id}>{t.firstName} {t.lastName} — {t.phone}</li>
                        ))}
                    </ul>
                </div>
            </article>
        );
    }

    // -----------------------
    // Render
    // -----------------------
    return (
        <main className="dashboard-root container" style={{ padding: 16, minHeight: "100vh", background: "var(--page-bg)", color: "var(--text)" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ margin: 0, color: "var(--title)" }}>Bookings</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Bookings overview - cards adapt to your role.</p>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13 }}>Status</span>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ marginLeft: 6, background: "var(--control-bg)", color: "var(--control-text)", border: "1px solid var(--control-border)", borderRadius: 8, padding: "0.4rem 0.5rem" }}>
                            <option value="">All</option>
                            <option value="QUOTE_REQUESTED">Quote requested</option>
                            <option value="UNDER_REVIEW">Under review</option>
                            <option value="QUOTE_SENT">Quote sent</option>
                            <option value="PAYMENT_PENDING">Payment pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </label>
                    <button className="btn" onClick={() => loadBookings()}>Refresh</button>
                </div>
            </header>
            {message ? <div style={{ marginBottom: 12, color: "var(--color-primary-dark)", fontWeight: 700 }}>{message}</div> : null}

            {loading ? (
                <GlobalLoader visible={loading} text={`Fetching Bookings`} />
            ) : error ? (
                <div style={{ color: "var(--danger, #b00020)" }}>Error: {error}</div>
            ) : bookings.length === 0 ? (
                <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>No bookings found.</div>
            ) : (
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))" }}>
                    {bookings.map(b => {
                        const isOwner = String(b.user?.id || b.user?._id) === String(user?.id || user?._id);
                        if (role === 'member' || isOwner) {
                            return (
                                <CustomerBookingCard
                                    key={b.id || b._id}
                                    booking={b}
                                    onCancel={handleCancel}
                                    onSaveTravelers={handleUpdateTravelers}
                                    onViewTour={goToTour}
                                    onPay={handlePay}
                                    onAcceptQuote={handleAcceptQuote}
                                    onRejectQuote={handleRejectQuote}
                                />
                            );
                        }
                        return <AdminBookingCard key={b.id || b._id} b={b} />;
                    })}
                </div>
            )}
        </main>
    );
}
