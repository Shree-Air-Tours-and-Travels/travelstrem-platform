import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import { getTourDetailsPath, slugify } from "@packages/trem-utils";
import { usePortalConfig } from "../../app/providers/PortalProvider";
import DashboardPageView from "./Dashboard.view";

export default function DashboardPageContainer() {
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
    }, [role, filterStatus]);

    async function loadBookings() {
        try {
            setLoading(true);
            setError("");

            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (role === "member") {
                params.userId = user?.id || user?._id;
            }

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

    async function handleCancel(bookingId) {
        try {
            setMessage("");
            setBookings(prev => prev.map(b => (String(b.id || b._id) === String(bookingId) ? { ...b, status: "CANCELLED" } : b)));

            const res = await fetchData(`/bookings/${bookingId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" } });
            if (!res || res.status !== "success") throw new Error(res.message || "Cancel failed");

            await loadBookings();
            setMessage("Booking cancelled.");
        } catch (err) {
            console.error(err);
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

    return (
        <DashboardPageView
            bookings={bookings}
            loading={loading}
            error={error}
            message={message}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            role={role}
            user={user}
            loadBookings={loadBookings}
            handleCancel={handleCancel}
            handleConfirm={handleConfirm}
            handleAcceptQuote={handleAcceptQuote}
            handleRejectQuote={handleRejectQuote}
            handleUpdateTravelers={handleUpdateTravelers}
            handlePay={handlePay}
            goToTour={goToTour}
        />
    );
}
