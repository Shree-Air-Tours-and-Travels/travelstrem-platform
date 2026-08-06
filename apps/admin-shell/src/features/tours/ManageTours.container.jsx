import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import {
    deleteAllTours,
    deleteTour,
    fetchAdmins,
    fetchAgents,
    fetchAdminTours,
    fetchAdminTrips,
    deleteTrip,
    deleteAllTrips,
    verifyAdminTour,
    verifyAdminTrip,
    fetchPartnerAgencies,
    removeAdmin,
    reviewAdmin,
    reviewAgent,
    reviewPartnerAgency,
} from "../../services/adminService";
import ManageToursView from "./ManageTours.view";

const VALID_TABS = new Set(["overview", "bookings", "services", "tenancy", "profile"]);

const getTabFromSearch = (search) => {
    const tab = new URLSearchParams(search || "").get("tab") || "overview";
    return VALID_TABS.has(tab) ? tab : "overview";
};

const COMPLETED_STATUSES = new Set([
    "COMPLETED", "CONFIRMED", "PAID", "TICKETED", "TRAVEL_READY",
]);
const PENDING_STATUSES = new Set([
    "DRAFT", "QUOTE_REQUESTED", "QUOTE_READY", "QUOTE_SENT",
    "UNDER_REVIEW", "PAYMENT_PENDING", "PARTIALLY_PAID",
]);

export default function ManageTours({ session, tab: tabProp }) {
    const location = useLocation();
    const navigate = useNavigate();
    const auth = {
        user: session?.user || null,
        role: session?.flags?.role || session?.user?.role || "member",
        adminLevel: session?.user?.adminLevel || "standard",
    };

    const [tab, setTabState] = useState(() => getTabFromSearch(location.search));
    const [tours, setTours] = useState([]);
    const [trips, setTrips] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [agents, setAgents] = useState([]);
    const [partnerAgencies, setPartnerAgencies] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [profile, setProfile] = useState(null);
    const [agencyLoading, setAgencyLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [tripFormOpen, setTripFormOpen] = useState(false);
    const [tripEditing, setTripEditing] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewTour, setViewTour] = useState(null);
    const [tripViewOpen, setTripViewOpen] = useState(false);
    const [viewTrip, setViewTrip] = useState(null);
    const [error, setError] = useState(null);
    const requestSeq = useRef(0);
    const verificationCountRef = useRef(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [toast, setToast] = useState({ message: "", type: "info", visible: false });
    const [stats, setStats] = useState({ totalTours: 0, totalTrips: 0, activeBookings: 0, pendingReviews: 0 });

    const setTab = useCallback((nextTab) => {
        const safeTab = VALID_TABS.has(nextTab) ? nextTab : "overview";
        setTabState(safeTab);
        const params = new URLSearchParams(location.search);
        params.set("tab", safeTab);
        navigate(`${location.pathname}?${params.toString()}`, { replace: false });
    }, [location.pathname, location.search, navigate]);

    const showToast = useCallback((message, type = "info", durationMs = 3000) => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast({ message: "", type: "info", visible: false }), durationMs);
    }, []);

    useEffect(() => {
        fetchTours();
        fetchTrips();
        fetchAgencyManagement();
        fetchBookings();
        fetchProfile();
    }, []);

    useEffect(() => {
        const nextTab = getTabFromSearch(location.search);
        const params = new URLSearchParams(location.search);
        const requestedTab = params.get("tab");
        if (requestedTab && !VALID_TABS.has(requestedTab)) {
            params.set("tab", nextTab);
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });
            return;
        }
        setTabState((current) => current === nextTab ? current : nextTab);
    }, [location.pathname, location.search, navigate]);

    async function fetchTours() {
        const seq = ++requestSeq.current;
        setLoading(true);
        setError(null);
        try {
            const fetched = await fetchAdminTours();
            if (requestSeq.current !== seq) return;
            const tourData = Array.isArray(fetched) ? fetched : [];
            setTours(tourData);
            setStats((prev) => ({ ...prev, totalTours: tourData.length }));
        } catch (e) {
            if (requestSeq.current !== seq) return;
            setError(e.message || "Failed to load tours");
            setTours([]);
        } finally {
            if (requestSeq.current === seq) setLoading(false);
        }
    }

    async function fetchTrips() {
        try {
            const fetched = await fetchAdminTrips();
            const tripData = Array.isArray(fetched) ? fetched : [];
            setTrips(tripData);
            setStats((prev) => ({ ...prev, totalTrips: tripData.length }));
        } catch (e) {
            showToast(e.message || "Failed to load trips", "error");
        }
    }

    async function fetchBookings({ silent = false } = {}) {
        if (!silent) setBookingsLoading(true);
        try {
            const res = await fetchData("/engine/admin/bookings", { params: { limit: 100, skip: 0 } });
            if (res?.status === "success") {
                const data = res.componentData?.data?.bookings || [];
                setBookings(data);
                const verificationCount = data.filter((booking) =>
                    String(booking.paymentStatus || "").toUpperCase() === "TOKEN_VERIFICATION"
                ).length;
                if (
                    silent
                    && verificationCountRef.current !== null
                    && verificationCount > verificationCountRef.current
                ) {
                    showToast("New payment proof submitted", "info", 5000);
                }
                verificationCountRef.current = verificationCount;
                setStats((prev) => ({
                    ...prev,
                    activeBookings: data.filter((b) => !COMPLETED_STATUSES.has(String(b.status || "").toUpperCase())).length,
                    pendingReviews: data.filter((b) => PENDING_STATUSES.has(String(b.status || "").toUpperCase())).length,
                }));
            }
        } catch {
            if (!silent) setBookings([]);
        } finally {
            if (!silent) setBookingsLoading(false);
        }
    }

    useEffect(() => {
        if (tab !== "bookings" && tab !== "overview") return undefined;
        const refresh = () => {
            if (document.visibilityState === "visible") fetchBookings({ silent: true });
        };
        const interval = window.setInterval(refresh, 15000);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [tab]);

    async function fetchProfile() {
        try {
            const res = await fetchData("/auth/profile").catch(() => null);
            if (res?.status === "success") {
                setProfile(res.componentData?.data || null);
            }
        } catch {}
    }

    async function fetchAgencyManagement() {
        setAgencyLoading(true);
        try {
            const [nextAgents, nextAgencies] = await Promise.all([fetchAgents(), fetchPartnerAgencies()]);
            const nextAdmins = auth.user?.adminLevel === "master" ? await fetchAdmins() : [];
            setAdmins(nextAdmins);
            setAgents(nextAgents);
            setPartnerAgencies(nextAgencies);
        } catch (e) {
            console.error("fetchAgencyManagement error:", e);
        } finally {
            setAgencyLoading(false);
        }
    }

    async function handleReviewAgent(id, status) {
        try { await reviewAgent(id, status); showToast(`Agent ${status}`, "success"); await fetchAgencyManagement(); }
        catch (e) { showToast(e.message || "Agent review failed", "error"); }
    }

    async function handleReviewPartnerAgency(id, status) {
        try { await reviewPartnerAgency(id, status); showToast(`Partner agency ${status}`, "success"); await fetchAgencyManagement(); }
        catch (e) { showToast(e.message || "Partner review failed", "error"); }
    }

    async function handleReviewAdmin(id, status) {
        try { await reviewAdmin(id, status); showToast(`Admin ${status}`, "success"); await fetchAgencyManagement(); }
        catch (e) { showToast(e.message || "Admin review failed", "error"); }
    }

    async function handleRemoveAdmin(id) {
        try { await removeAdmin(id); showToast("Admin access removed", "success"); await fetchAgencyManagement(); }
        catch (e) { showToast(e.message || "Admin removal failed", "error"); }
    }

    function handleDelete(id) { setConfirmDelete(id); setConfirmMessage("Delete this tour? This action cannot be undone."); }
    function handleDeleteAll() { setConfirmDelete("ALL"); setConfirmMessage("Delete ALL tours? This is irreversible. Continue?"); }
    function handleTripDelete(id) { setConfirmDelete(`trip:${id}`); setConfirmMessage("Delete this trip? This action cannot be undone."); }
    function handleTripDeleteAll() { setConfirmDelete("trips:ALL"); setConfirmMessage("Delete ALL trips? This is irreversible. Continue?"); }

    async function handleConfirmDelete() {
        const target = confirmDelete;
        setConfirmDelete(null);
        setConfirmMessage("");
        try {
            if (target === "ALL") await deleteAllTours();
            else if (target === "trips:ALL") await deleteAllTrips();
            else if (target?.startsWith("trip:")) await deleteTrip(target.replace("trip:", ""));
            else await deleteTour(target);
            if (target?.startsWith("trip") || target === "trips:ALL") await fetchTrips();
            else await fetchTours();
        } catch (e) { showToast(e.message || "Delete failed", "error"); }
    }

    function handleCancelDelete() { setConfirmDelete(null); setConfirmMessage(""); }
    function openCreate() { setEditing(null); setFormOpen(true); }
    function openEdit(t) { setEditing(t); setFormOpen(true); }
    function openView(t) { setViewTour(t); setViewOpen(true); }
    async function verifyTour(id) {
        try { await verifyAdminTour(id); showToast("Tour verified by TravelsTREM", "success"); await fetchTours(); }
        catch (e) { showToast(e.message || "Could not verify tour", "error"); }
    }
    async function verifyTrip(id) {
        try { await verifyAdminTrip(id); showToast("Trip verified by TravelsTREM", "success"); await fetchTrips(); }
        catch (e) { showToast(e.message || "Could not verify trip", "error"); }
    }
    function openTripCreate() { setTripEditing(null); setTripFormOpen(true); }
    function openTripEdit(t) { setTripEditing(t); setTripFormOpen(true); }
    function openTripView(t) { setViewTrip(t); setTripViewOpen(true); }

    const handleSaveProfile = useCallback(async (data) => {
        try {
            const res = await fetchData("/auth/profile", {
                method: "PUT",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            if (res?.status === "success") { setProfile(res.componentData?.data); showToast("Profile updated", "success"); return { success: true }; }
            return { success: false, message: res?.message || "Something went wrong" };
        } catch { return { success: false, message: "Something went wrong" }; }
    }, [showToast]);

    const refreshAll = useCallback(async () => { await Promise.all([fetchTours(), fetchTrips(), fetchBookings()]); }, []);

    return (
        <ManageToursView
            tab={tab} setTab={setTab}
            tours={tours} trips={trips} bookings={bookings} profile={profile}
            admins={admins} agents={agents} partnerAgencies={partnerAgencies}
            loading={loading} bookingsLoading={bookingsLoading} agencyLoading={agencyLoading}
            stats={stats} auth={auth} error={error}
            formOpen={formOpen} setFormOpen={setFormOpen}
            tripFormOpen={tripFormOpen} setTripFormOpen={setTripFormOpen}
            tripEditing={tripEditing}
            viewOpen={viewOpen} setViewOpen={setViewOpen}
            editing={editing} viewTour={viewTour} setViewTour={setViewTour}
            tripViewOpen={tripViewOpen} setTripViewOpen={setTripViewOpen}
            viewTrip={viewTrip} setViewTrip={setViewTrip}
            openCreate={openCreate} openEdit={openEdit} openView={openView}
            verifyTour={verifyTour} verifyTrip={verifyTrip}
            openTripCreate={openTripCreate} openTripEdit={openTripEdit} openTripView={openTripView}
            handleDelete={handleDelete} handleDeleteAll={handleDeleteAll}
            handleTripDelete={handleTripDelete} handleTripDeleteAll={handleTripDeleteAll}
            handleConfirmDelete={handleConfirmDelete} handleCancelDelete={handleCancelDelete}
            confirmDelete={confirmDelete} confirmMessage={confirmMessage}
            fetchTours={fetchTours} fetchTrips={fetchTrips} fetchAgencyManagement={fetchAgencyManagement}
            handleReviewAdmin={handleReviewAdmin} handleRemoveAdmin={handleRemoveAdmin}
            handleReviewAgent={handleReviewAgent} handleReviewPartnerAgency={handleReviewPartnerAgency}
            handleSaveProfile={handleSaveProfile}
            refreshAll={refreshAll}
            toast={toast} setToast={setToast}
        />
    );
}
