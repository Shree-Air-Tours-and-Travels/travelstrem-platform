import React from "react";

import { GlobalLoader } from "@packages/trem-ui";
import CustomerBookingCard from "../../shared/ui/cards/CustomerBookingCard/CustomerBookingCard";
import "./Dashboard.styles.scss";

const statusGroups = [
    { label: "All", value: "" },
    { label: "Quote requested", value: "QUOTE_REQUESTED" },
    { label: "Under review", value: "UNDER_REVIEW" },
    { label: "Payment pending", value: "PAYMENT_PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Cancelled", value: "CANCELLED" },
];

const money = (currency = "INR", value = 0) =>
    `${currency} ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;

const normalizeStatus = (status) => String(status || "QUOTE_REQUESTED").toUpperCase();

const getStats = (bookings = []) => {
    const active = bookings.filter((booking) => !["CANCELLED", "COMPLETED"].includes(normalizeStatus(booking.status))).length;
    const pendingPayment = bookings.filter((booking) => ["PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"].includes(normalizeStatus(booking.status))).length;
    const awaitingQuote = bookings.filter((booking) => ["QUOTE_REQUESTED", "UNDER_REVIEW"].includes(normalizeStatus(booking.status))).length;
    const payableTotal = bookings.reduce((sum, booking) => {
        const price = booking.priceSnapshot || {};
        const paid = Number(booking.paymentSummary?.paid ?? booking.payment?.amountPaid ?? 0);
        const due = price.isFinal ? Math.max(0, Number(price.total || 0) - paid) : 0;
        return sum + due;
    }, 0);

    return [
        { label: "Active trips", value: active },
        { label: "Awaiting quote", value: awaitingQuote },
        { label: "Payment pending", value: pendingPayment },
        { label: "Amount due", value: money("INR", payableTotal) },
    ];
};

function AdminBookingCard({ b, handleCancel, handleConfirm, goToTour }) {
    const status = normalizeStatus(b.status);
    const isCancelled = status === "CANCELLED";
    const price = b.priceSnapshot || {};

    return (
        <article className="dashboard-admin-card">
            <header>
                <span>{status.replace(/_/g, " ").toLowerCase()}</span>
                <strong>{price.isFinal ? money(price.currency || "INR", price.total) : "Price in progress"}</strong>
            </header>
            <h3>{b.tour?.title || "Tour booking"}</h3>
            <p>{b.user?.name || "Customer"} · {b.user?.email || "No email"}</p>
            <div className="dashboard-admin-card__actions">
                <button type="button" onClick={() => goToTour(b)}>View tour</button>
                {!isCancelled && status !== "CONFIRMED" ? <button type="button" onClick={() => handleConfirm(b.id || b._id, {})}>Confirm</button> : null}
                {!isCancelled ? <button type="button" onClick={() => handleCancel(b.id || b._id)}>Cancel</button> : null}
            </div>
        </article>
    );
}

export default function DashboardPageView({
    bookings,
    loading,
    error,
    message,
    filterStatus,
    setFilterStatus,
    role,
    user,
    loadBookings,
    handleCancel,
    handleConfirm,
    handleAcceptQuote,
    handleRejectQuote,
    handleUpdateTravelers,
    handlePay,
    goToTour,
}) {
    const stats = getStats(bookings);

    return (
        <main className="customer-dashboard">
            <section className="customer-dashboard__hero" aria-labelledby="customer-dashboard-title">
                <div>
                    <p className="customer-dashboard__eyebrow">Customer dashboard</p>
                    <h1 id="customer-dashboard-title">Your trips, quotes, and payments</h1>
                    <span>Track every journey from quote request to final confirmation.</span>
                </div>
                <button type="button" onClick={() => loadBookings()}>Refresh</button>
            </section>

            <section className="customer-dashboard__stats" aria-label="Dashboard summary">
                {stats.map((stat) => (
                    <article key={stat.label}>
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                    </article>
                ))}
            </section>

            <section className="customer-dashboard__panel">
                <header className="customer-dashboard__toolbar">
                    <div>
                        <h2>Bookings</h2>
                        <p>{bookings.length} record{bookings.length === 1 ? "" : "s"} in this view</p>
                    </div>
                    <label>
                        <span>Status</span>
                        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                            {statusGroups.map((status) => (
                                <option key={status.value || "all"} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </label>
                </header>

                {message ? <div className="customer-dashboard__notice">{message}</div> : null}

                {loading ? (
                    <GlobalLoader visible={loading} text="Fetching dashboard" />
                ) : error ? (
                    <div className="customer-dashboard__error">Error: {error}</div>
                ) : bookings.length === 0 ? (
                    <div className="customer-dashboard__empty">
                        <h3>No bookings found</h3>
                        <p>Your upcoming trips and quote requests will appear here.</p>
                    </div>
                ) : (
                    <div className="customer-dashboard__grid">
                        {bookings.map((booking) => {
                            const isOwner = String(booking.user?.id || booking.user?._id) === String(user?.id || user?._id);
                            if (role === "member" || isOwner) {
                                return (
                                    <CustomerBookingCard
                                        key={booking.id || booking._id}
                                        booking={booking}
                                        onCancel={handleCancel}
                                        onSaveTravelers={handleUpdateTravelers}
                                        onViewTour={goToTour}
                                        onPay={handlePay}
                                        onAcceptQuote={handleAcceptQuote}
                                        onRejectQuote={handleRejectQuote}
                                    />
                                );
                            }
                            return (
                                <AdminBookingCard
                                    key={booking.id || booking._id}
                                    b={booking}
                                    handleCancel={handleCancel}
                                    handleConfirm={handleConfirm}
                                    goToTour={goToTour}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
