import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    deleteAllTours,
    deleteTour,
    fetchAdminBookings,
    fetchAdminTours,
    updateBookingTravelers,
    confirmBooking,
    cancelBooking,
    updateBookingStatus,
    recordAdminPayment,
    processRefund,
} from "../../services/adminService";
import ManageToursView from "./ManageTours.view";

export default function ManageTours({ session }) {
    const auth = {
        user: session?.user || null,
        role: session?.flags?.role || session?.user?.role || "member",
    };
    const [tab, setTab] = useState("tours");
    const [tours, setTours] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewTour, setViewTour] = useState(null);
    const [error, setError] = useState(null);
    const requestSeq = useRef(0);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [toast, setToast] = useState({ message: "", type: "info", visible: false });

    const showToast = useCallback((message, type = "info", durationMs = 3000) => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast({ message: "", type: "info", visible: false }), durationMs);
    }, []);

    useEffect(() => {
        fetchTours();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === "bookings") fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    async function fetchTours() {
        const seq = ++requestSeq.current;
        setLoading(true);
        setError(null);
        try {
            const fetched = await fetchAdminTours();
            if (requestSeq.current !== seq) return;
            setTours(Array.isArray(fetched) ? fetched : []);
        } catch (e) {
            if (requestSeq.current !== seq) return;
            console.error("fetchTours error:", e);
            setError(e.message || "Failed to load tours");
            setTours([]);
        } finally {
            if (requestSeq.current === seq) setLoading(false);
        }
    }

    function handleDelete(id) {
        setConfirmDelete(id);
        setConfirmMessage("Delete this tour? This action cannot be undone.");
    }

    function handleDeleteAll() {
        setConfirmDelete("ALL");
        setConfirmMessage("Delete ALL tours? This is irreversible. Continue?");
    }

    async function handleConfirmDelete() {
        const target = confirmDelete;
        setConfirmDelete(null);
        setConfirmMessage("");
        try {
            if (target === "ALL") {
                await deleteAllTours();
            } else {
                await deleteTour(target);
            }
            await fetchTours();
        } catch (e) {
            console.error("handleConfirmDelete:", e);
            showToast(e.message || "Delete failed", "error");
        }
    }

    function handleCancelDelete() {
        setConfirmDelete(null);
        setConfirmMessage("");
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

    async function fetchBookings() {
        const seq = ++requestSeq.current;
        setLoadingBookings(true);
        try {
            const data = await fetchAdminBookings();
            if (requestSeq.current !== seq) return;
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            if (requestSeq.current !== seq) return;
            console.error("fetchBookings:", e);
            showToast(e.message || "Failed to load bookings", "error");
            setBookings([]);
        } finally {
            if (requestSeq.current === seq) setLoadingBookings(false);
        }
    }

    async function handleConfirmBooking(bookingId, finalPriceData = {}) {
        try {
            await confirmBooking(bookingId, finalPriceData);
            await fetchBookings();
            showToast("Quote generated and sent to customer.", "success");
        } catch (e) {
            console.error("confirmBooking:", e);
            showToast(e.message || "Confirm failed", "error");
        }
    }

    async function handleCancelBooking(bookingId) {
        try {
            await cancelBooking(bookingId);
            await fetchBookings();
            showToast("Booking cancelled.", "success");
        } catch (e) {
            console.error("cancelBooking:", e);
            showToast(e.message || "Cancel failed", "error");
        }
    }

    async function handleUpdateTravelers(bookingId, travelers) {
        try {
            await updateBookingTravelers(bookingId, travelers);
            await fetchBookings();
            showToast("Travelers updated.", "success");
        } catch (e) {
            console.error("updateTravelers:", e);
            showToast(e.message || "Update failed", "error");
        }
    }

    async function handleStatusTransition(bookingId, status) {
        try {
            await updateBookingStatus(bookingId, status);
            await fetchBookings();
            showToast(`Booking status changed to ${status.replace(/_/g, " ").toLowerCase()}.`, "success");
        } catch (e) {
            console.error("handleStatusTransition:", e);
            showToast(e.message || "Status transition failed", "error");
        }
    }

    async function handleRecordPayment(bookingId, amount, currency) {
        try {
            await recordAdminPayment(bookingId, amount, currency);
            await fetchBookings();
            showToast("Payment recorded.", "success");
        } catch (e) {
            console.error("handleRecordPayment:", e);
            showToast(e.message || "Payment recording failed", "error");
        }
    }

    async function handleRefund(bookingId, amount, currency) {
        try {
            await processRefund(bookingId, amount, currency);
            await fetchBookings();
            showToast("Refund processed.", "success");
        } catch (e) {
            console.error("handleRefund:", e);
            showToast(e.message || "Refund processing failed", "error");
        }
    }

    return (
        <ManageToursView
            tab={tab}
            tours={tours}
            bookings={bookings}
            loading={loading}
            loadingBookings={loadingBookings}
            formOpen={formOpen}
            viewOpen={viewOpen}
            editing={editing}
            viewTour={viewTour}
            error={error}
            auth={auth}
            setTab={setTab}
            openCreate={openCreate}
            openEdit={openEdit}
            openView={openView}
            confirmDelete={confirmDelete}
            confirmMessage={confirmMessage}
            handleDelete={handleDelete}
            handleDeleteAll={handleDeleteAll}
            handleConfirmDelete={handleConfirmDelete}
            handleCancelDelete={handleCancelDelete}
            fetchTours={fetchTours}
            fetchBookings={fetchBookings}
            handleConfirmBooking={handleConfirmBooking}
            handleCancelBooking={handleCancelBooking}
            handleUpdateTravelers={handleUpdateTravelers}
            handleStatusTransition={handleStatusTransition}
            handleRecordPayment={handleRecordPayment}
            handleRefund={handleRefund}
            toast={toast}
            setToast={setToast}
            setFormOpen={setFormOpen}
            setViewOpen={setViewOpen}
            setViewTour={setViewTour}
        />
    );
}
