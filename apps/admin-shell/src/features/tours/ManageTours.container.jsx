import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import { REALTIME_EVENTS, showRealtimeToast, useRealtimeEvent } from "@packages/trem-events";
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
  updateAdminInternalTeam,
  reviewAgent,
  reviewPartnerAgency,
} from "../../services/adminService";
import { useAdminPortalConfig } from "../../app/providers/AdminPortalProvider";
import ManageToursView from "./ManageTours.view";

const VALID_TABS = new Set([
  "overview",
  "enquiries",
  "support",
  "internalTeam",
  "services",
  "tracking",
  "pricing",
  "tenancy",
  "clients",
  "profile",
]);

const getTabFromSearch = (search, pathname = "") => {
  if (pathname.startsWith("/manage/bookings")) return "enquiries";
  const tab = new URLSearchParams(search || "").get("tab") || "overview";
  return VALID_TABS.has(tab) ? tab : "overview";
};

const resolveEntityId = (value) => {
  if (value == null) return "";
  if (["string", "number"].includes(typeof value)) return String(value);
  if (typeof value === "object") {
    return (
      resolveEntityId(value._id) ||
      resolveEntityId(value.id) ||
      resolveEntityId(value.$oid) ||
      resolveEntityId(value.value)
    );
  }
  return "";
};

const resolveTourId = (tourOrId) =>
  resolveEntityId(tourOrId?._id) || resolveEntityId(tourOrId?.id) || resolveEntityId(tourOrId);

export default function ManageTours({ session }) {
  const { reload: reloadPortalSession, headerConfig: backendHeaderConfig } =
    useAdminPortalConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = {
    user: session?.user || null,
    role: session?.flags?.role || session?.user?.role || "member",
    adminLevel: session?.user?.adminLevel || "standard",
  };

  const [tab, setTabState] = useState(() => getTabFromSearch(location.search, location.pathname));
  const [tours, setTours] = useState([]);
  const [trips, setTrips] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [agents, setAgents] = useState([]);
  const [partnerAgencies, setPartnerAgencies] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [tripEditing, setTripEditing] = useState(null);
  const [tripViewOpen, setTripViewOpen] = useState(false);
  const [viewTrip, setViewTrip] = useState(null);
  const [error, setError] = useState(null);
  const requestSeq = useRef(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info", visible: false });
  const [stats, setStats] = useState({ totalTours: 0, totalTrips: 0 });
  const [dashboardDefinition, setDashboardDefinition] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const canAccessTab = useCallback(
    (nextTab) => {
      const destination = (backendHeaderConfig?.adminNavigation || []).find(
        (item) => item.target === nextTab || item.id === nextTab,
      );
      return !destination?.masterOnly || auth.adminLevel === "master";
    },
    [auth.adminLevel, backendHeaderConfig?.adminNavigation],
  );

  const setTab = useCallback(
    (nextTab) => {
      const requestedTab = VALID_TABS.has(nextTab) ? nextTab : "overview";
      const safeTab = canAccessTab(requestedTab) ? requestedTab : "overview";
      setTabState(safeTab);
      const params = new URLSearchParams(location.search);
      params.set("tab", safeTab);
      const destinationPath = location.pathname.startsWith("/manage/bookings")
        ? "/manage/tours"
        : location.pathname;
      navigate(`${destinationPath}?${params.toString()}`, { replace: false });
    },
    [canAccessTab, location.pathname, location.search, navigate],
  );

  const showToast = useCallback((message, type = "info", durationMs = 3000) => {
    showRealtimeToast({
      title: message,
      status: type,
      durationMs,
      dedupeKey: `admin:${type}:${message}`,
    });
  }, []);

  const handleToastState = useCallback(
    (nextToast) => {
      if (nextToast?.visible && nextToast.message) {
        showToast(nextToast.message, nextToast.type || "info");
        return;
      }
      setToast({ message: "", type: "info", visible: false });
    },
    [reloadPortalSession, showToast],
  );

  useEffect(() => {
    fetchTours();
    fetchTrips();
    fetchAgencyManagement();
    fetchProfile();
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const response = await fetchData("/pages/admin-shell/dashboard");
      if (response?.status !== "success" || !response?.component) {
        throw new Error(response?.message || "Dashboard data is unavailable");
      }
      setDashboardDefinition(response.component);
    } catch (dashboardRequestError) {
      setDashboardError(dashboardRequestError?.message || "Dashboard data is unavailable");
    } finally {
      setDashboardLoading(false);
    }
  }

  useRealtimeEvent(REALTIME_EVENTS.ADMIN_SUPPORT_REQUEST_CREATED, () => {
    if (tab === "overview") loadDashboard();
  });

  useEffect(() => {
    const requestedNextTab = getTabFromSearch(location.search, location.pathname);
    const nextTab = canAccessTab(requestedNextTab) ? requestedNextTab : "overview";
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get("tab");
    if (
      requestedTab &&
      (!VALID_TABS.has(requestedTab) || !canAccessTab(requestedTab))
    ) {
      params.set("tab", nextTab);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      return;
    }
    setTabState((current) => (current === nextTab ? current : nextTab));
  }, [canAccessTab, location.pathname, location.search, navigate]);

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
      const nextAdmins = await fetchAdmins();
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

  async function handleUpdateAdminInternalTeam(id, team, enabled) {
    try {
      await updateAdminInternalTeam(id, team, enabled);
      showToast(
        enabled ? "Admin added to support team" : "Admin removed from support team",
        "success",
      );
      await fetchAgencyManagement();
    } catch (e) {
      showToast(e.message || "Internal team update failed", "error");
    }
  }

  function handleDelete(id) {
    const tourId = resolveTourId(id);
    if (!tourId) return;
    setConfirmDelete(tourId);
    setConfirmMessage("Delete this tour? This action cannot be undone.");
  }
  function handleDeleteAll() {
    setConfirmDelete("ALL");
    setConfirmMessage("Delete ALL tours? This is irreversible. Continue?");
  }
  function handleTripDelete(id) {
    const tripId = resolveTourId(id);
    if (!tripId) return;
    setConfirmDelete(`trip:${tripId}`);
    setConfirmMessage("Delete this trip? This action cannot be undone.");
  }
  function handleTripDeleteAll() {
    setConfirmDelete("trips:ALL");
    setConfirmMessage("Delete ALL trips? This is irreversible. Continue?");
  }

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
    } catch (e) {
      showToast(e.message || "Delete failed", "error");
    }
  }

  function handleCancelDelete() {
    setConfirmDelete(null);
    setConfirmMessage("");
  }
  function openCreate() {
    navigate("/manage/tours/builder");
  }
  function openEdit(t) {
    const id = resolveTourId(t);
    if (id) navigate(`/manage/tours/${encodeURIComponent(id)}/edit`);
  }
  function openView(t) {
    const id = resolveTourId(t);
    if (id) navigate(`/manage/tours/${encodeURIComponent(id)}/view`);
  }
  async function verifyTour(id) {
    try {
      const tourId = resolveTourId(id);
      if (!tourId) return;
      await verifyAdminTour(tourId);
      showToast("Tour verified by TravelsTREM", "success");
      await fetchTours();
    } catch (e) {
      showToast(e.message || "Could not verify tour", "error");
    }
  }
  async function verifyTrip(id) {
    try {
      await verifyAdminTrip(id);
      showToast("Trip verified by TravelsTREM", "success");
      await fetchTrips();
    } catch (e) {
      showToast(e.message || "Could not verify trip", "error");
    }
  }
  function openTripCreate() {
    navigate("/manage/tours/builder?product=trevio");
  }
  function openTripEdit(t) {
    const sourceId = resolveEntityId(t?.sourceTourId);
    if (sourceId) {
      navigate(`/manage/tours/builder?product=trevio&tourId=${sourceId}`);
      return;
    }
    setTripEditing(t);
    setTripFormOpen(true);
  }
  function openTripView(t) {
    setViewTrip(t);
    setTripViewOpen(true);
  }

  const handleSaveProfile = useCallback(
    async (data) => {
      setProfileSaving(true);
      try {
        const res = await fetchData("/auth/profile", {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
        if (res?.status === "success") {
          setProfile(res.componentData?.data);
          reloadPortalSession?.();
          showToast("Profile updated", "success");
          return { success: true };
        }
        return { success: false, message: res?.message || "Something went wrong" };
      } catch (error) {
        const message = error?.response?.data?.message || error?.message || "Something went wrong";
        showToast(message, "error");
        return { success: false, message };
      } finally {
        setProfileSaving(false);
      }
    },
    [showToast],
  );

  const handleUpdatePassword = useCallback(
    async (data) => {
      setPasswordSaving(true);
      try {
        const res = await fetchData("/auth/password", {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
        if (res?.status === "success") {
          showToast("Password updated", "success");
          return { success: true };
        }
        return { success: false, message: res?.message || "Password update failed" };
      } catch (error) {
        const message =
          error?.response?.data?.message || error?.message || "Password update failed";
        showToast(message, "error");
        return { success: false, message };
      } finally {
        setPasswordSaving(false);
      }
    },
    [showToast],
  );

  const handleUpdateAvatar = useCallback(
    async (avatar) => {
      setAvatarSaving(true);
      try {
        const res = await fetchData("/auth/profile", {
          method: "PUT",
          body: JSON.stringify({ avatar }),
          headers: { "Content-Type": "application/json" },
        });
        if (res?.status === "success") {
          setProfile(res.componentData?.data);
          reloadPortalSession?.();
          showToast("Avatar updated", "success");
          return { success: true };
        }
        return { success: false, message: res?.message || "Avatar update failed" };
      } catch (error) {
        const message = error?.response?.data?.message || error?.message || "Avatar update failed";
        showToast(message, "error");
        return { success: false, message };
      } finally {
        setAvatarSaving(false);
      }
    },
    [reloadPortalSession, showToast],
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTours(), fetchTrips(), loadDashboard()]);
  }, []);

  return (
    <ManageToursView
      tab={tab}
      setTab={setTab}
      tours={tours}
      trips={trips}
      profile={profile}
      admins={admins}
      agents={agents}
      partnerAgencies={partnerAgencies}
      loading={loading}
      agencyLoading={agencyLoading}
      stats={stats}
      dashboardDefinition={dashboardDefinition}
      dashboardLoading={dashboardLoading}
      dashboardError={dashboardError}
      refreshDashboard={loadDashboard}
      auth={auth}
      error={error}
      tripFormOpen={tripFormOpen}
      setTripFormOpen={setTripFormOpen}
      tripEditing={tripEditing}
      tripViewOpen={tripViewOpen}
      setTripViewOpen={setTripViewOpen}
      viewTrip={viewTrip}
      setViewTrip={setViewTrip}
      openCreate={openCreate}
      openEdit={openEdit}
      openView={openView}
      verifyTour={verifyTour}
      verifyTrip={verifyTrip}
      openTripCreate={openTripCreate}
      openTripEdit={openTripEdit}
      openTripView={openTripView}
      handleDelete={handleDelete}
      handleDeleteAll={handleDeleteAll}
      handleTripDelete={handleTripDelete}
      handleTripDeleteAll={handleTripDeleteAll}
      handleConfirmDelete={handleConfirmDelete}
      handleCancelDelete={handleCancelDelete}
      confirmDelete={confirmDelete}
      confirmMessage={confirmMessage}
      fetchTours={fetchTours}
      fetchTrips={fetchTrips}
      fetchAgencyManagement={fetchAgencyManagement}
      handleReviewAdmin={handleReviewAdmin}
      handleRemoveAdmin={handleRemoveAdmin}
      handleUpdateAdminInternalTeam={handleUpdateAdminInternalTeam}
      handleReviewAgent={handleReviewAgent}
      handleReviewPartnerAgency={handleReviewPartnerAgency}
      handleSaveProfile={handleSaveProfile}
      handleUpdatePassword={handleUpdatePassword}
      handleUpdateAvatar={handleUpdateAvatar}
      profileSaving={profileSaving}
      passwordSaving={passwordSaving}
      avatarSaving={avatarSaving}
      refreshAll={refreshAll}
      toast={toast}
      setToast={handleToastState}
    />
  );
}
