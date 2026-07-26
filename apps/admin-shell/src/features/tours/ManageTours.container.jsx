import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    deleteAllTours,
    deleteTour,
    fetchAdmins,
    fetchAgents,
    fetchAdminTours,
    fetchAdminTrips,
    deleteTrip,
    deleteAllTrips,
    fetchPartnerAgencies,
    removeAdmin,
    reviewAdmin,
    reviewAgent,
    reviewPartnerAgency,
} from "../../services/adminService";
import ManageToursView from "./ManageTours.view";

const VALID_TABS = new Set(["dashboard", "tours", "trips", "agencies"]);

const getTabFromSearch = (search) => {
    const tab = new URLSearchParams(search || "").get("tab") || "dashboard";
    return VALID_TABS.has(tab) ? tab : "dashboard";
};

export default function ManageTours({ session, tab: tabProp }) {
    const location = useLocation();
    const navigate = useNavigate();
    const auth = {
        user: session?.user || null,
        role: session?.flags?.role || session?.user?.role || "member",
    };
    const [tab, setTabState] = useState(() => {
        const urlTab = getTabFromSearch(location.search);
        if (urlTab !== "dashboard") return urlTab;
        return tabProp && VALID_TABS.has(tabProp) ? tabProp : "dashboard";
    });
    const [tours, setTours] = useState([]);
    const [trips, setTrips] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [agents, setAgents] = useState([]);
    const [partnerAgencies, setPartnerAgencies] = useState([]);
    const [agencyLoading, setAgencyLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [tripFormOpen, setTripFormOpen] = useState(false);
    const [tripEditing, setTripEditing] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewTour, setViewTour] = useState(null);
    const [error, setError] = useState(null);
    const requestSeq = useRef(0);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [toast, setToast] = useState({ message: "", type: "info", visible: false });

    const setTab = useCallback((nextTab) => {
        const safeTab = VALID_TABS.has(nextTab) ? nextTab : "dashboard";
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    async function fetchTrips() {
        try {
            const fetched = await fetchAdminTrips();
            setTrips(Array.isArray(fetched) ? fetched : []);
        } catch (e) {
            console.error("fetchTrips error:", e);
            showToast(e.message || "Failed to load trips", "error");
        }
    }

    function handleTripDelete(id) {
        setConfirmDelete(`trip:${id}`);
        setConfirmMessage("Delete this trip? This action cannot be undone.");
    }

    function handleTripDeleteAll() {
        setConfirmDelete("trips:ALL");
        setConfirmMessage("Delete ALL trips? This is irreversible. Continue?");
    }

    function openTripCreate() {
        setTripEditing(null);
        setTripFormOpen(true);
    }

    function openTripEdit(t) {
        setTripEditing(t);
        setTripFormOpen(true);
    }

    async function fetchAgencyManagement() {
        setAgencyLoading(true);
        try {
            const [nextAgents, nextAgencies] = await Promise.all([
                fetchAgents(),
                fetchPartnerAgencies(),
            ]);
            const nextAdmins = auth.user?.adminLevel === "master" ? await fetchAdmins() : [];
            setAdmins(nextAdmins);
            setAgents(nextAgents);
            setPartnerAgencies(nextAgencies);
        } catch (e) {
            console.error("fetchAgencyManagement error:", e);
            showToast(e.message || "Failed to load agency management", "error");
        } finally {
            setAgencyLoading(false);
        }
    }

    async function handleReviewAgent(id, status) {
        try {
            await reviewAgent(id, status);
            showToast(`Agent ${status}`, "success");
            await fetchAgencyManagement();
        } catch (e) {
            showToast(e.message || "Agent review failed", "error");
        }
    }

    async function handleReviewPartnerAgency(id, status) {
        try {
            await reviewPartnerAgency(id, status);
            showToast(`Partner agency ${status}`, "success");
            await fetchAgencyManagement();
        } catch (e) {
            showToast(e.message || "Partner review failed", "error");
        }
    }

    async function handleReviewAdmin(id, status) {
        try {
            await reviewAdmin(id, status);
            showToast(`Admin ${status}`, "success");
            await fetchAgencyManagement();
        } catch (e) {
            showToast(e.message || "Admin review failed", "error");
        }
    }

    async function handleRemoveAdmin(id) {
        try {
            await removeAdmin(id);
            showToast("Admin access removed", "success");
            await fetchAgencyManagement();
        } catch (e) {
            showToast(e.message || "Admin removal failed", "error");
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
            } else if (target === "trips:ALL") {
                await deleteAllTrips();
            } else if (target?.startsWith("trip:")) {
                await deleteTrip(target.replace("trip:", ""));
            } else {
                await deleteTour(target);
            }
            if (target?.startsWith("trip") || target === "trips:ALL") {
                await fetchTrips();
            } else {
                await fetchTours();
            }
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

    return (
        <ManageToursView
            tab={tab}
            tours={tours}
            trips={trips}
            admins={admins}
            agents={agents}
            partnerAgencies={partnerAgencies}
            loading={loading}
            agencyLoading={agencyLoading}
            formOpen={formOpen}
            tripFormOpen={tripFormOpen}
            tripEditing={tripEditing}
            viewOpen={viewOpen}
            editing={editing}
            viewTour={viewTour}
            error={error}
            auth={auth}
            setTab={setTab}
            openCreate={openCreate}
            openEdit={openEdit}
            openView={openView}
            openTripCreate={openTripCreate}
            openTripEdit={openTripEdit}
            handleTripDelete={handleTripDelete}
            handleTripDeleteAll={handleTripDeleteAll}
            fetchTrips={fetchTrips}
            confirmDelete={confirmDelete}
            confirmMessage={confirmMessage}
            handleDelete={handleDelete}
            handleDeleteAll={handleDeleteAll}
            handleConfirmDelete={handleConfirmDelete}
            handleCancelDelete={handleCancelDelete}
            fetchTours={fetchTours}
            fetchAgencyManagement={fetchAgencyManagement}
            handleReviewAdmin={handleReviewAdmin}
            handleRemoveAdmin={handleRemoveAdmin}
            handleReviewAgent={handleReviewAgent}
            handleReviewPartnerAgency={handleReviewPartnerAgency}
            toast={toast}
            setToast={setToast}
            setFormOpen={setFormOpen}
            setTripFormOpen={setTripFormOpen}
            setViewOpen={setViewOpen}
            setViewTour={setViewTour}
        />
    );
}
