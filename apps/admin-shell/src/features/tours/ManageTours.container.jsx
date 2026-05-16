/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
import React, { useEffect, useState } from "react";
import {
    deleteAllTours,
    deleteTour,
    fetchAdminBookings,
    fetchAdminTours,
    updateBookingTravelers,
    confirmBooking,
    cancelBooking,
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

    useEffect(() => {
        fetchTours();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === "bookings") fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

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
            handleDelete={handleDelete}
            handleDeleteAll={handleDeleteAll}
            fetchTours={fetchTours}
            fetchBookings={fetchBookings}
            handleConfirmBooking={handleConfirmBooking}
            handleCancelBooking={handleCancelBooking}
            handleUpdateTravelers={handleUpdateTravelers}
            setFormOpen={setFormOpen}
            setViewOpen={setViewOpen}
            setViewTour={setViewTour}
        />
    );
}
