import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  applyPartnerAgency,
  checkPartnerApplication,
  deleteAllAgentTours,
  deleteAgentTour,
  fetchAgentTours,
  fetchAgentProfile,
  fetchAgencyProfile,
  updateAvatar,
  updatePassword,
  updateProfile,
} from "../../../services/agentService";
import { VALID_TABS, PATH_BY_TAB, FALLBACK_PROFILE } from "./tours.constants";
import pageConfig from "./manageToursPage.config.json";
import ManageToursView from "./ManageTours.view";

const getTabFromLocation = (pathname, search) => {
  if (pathname.includes("/agent/dashboard")) return "dashboard";
  if (pathname.includes("/agent/agents")) return "agents";
  if (pathname.includes("/agent/customers")) return "customers";
  if (pathname.includes("/agent/reports")) return "reports";
  if (pathname.includes("/agent/deletion-requests")) return "deletions";
  if (pathname.includes("/agent/notifications")) return "notifications";
  if (pathname.includes("/agent/profile")) return "profile";
  if (pathname.includes("/agent/settings")) return "settings";
  if (pathname.includes("/agent/partner-agency") || pathname.includes("/agent/agency"))
    return "partnerAgency";
  const tab = new URLSearchParams(search || "").get("tab") || "dashboard";
  return VALID_TABS.has(tab) ? tab : "dashboard";
};

const isRequestCancelled = (error) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED" ||
  error?.message === "Request cancelled";

export default function ManageTours({ session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = {
    user: session?.user || null,
    role: session?.flags?.role || session?.user?.role || FALLBACK_PROFILE.role,
  };
  const [tab, setTabState] = useState(() => getTabFromLocation(location.pathname, location.search));
  const [tours, setTours] = useState([]);
  const [profile, setProfile] = useState(null);
  const [agencyApplication, setAgencyApplication] = useState(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestSeq = useRef(0);
  const abortControllersRef = useRef({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info", visible: false });
  const toastTimerRef = useRef(null);

  const createRequestController = useCallback((key) => {
    abortControllersRef.current[key]?.abort();
    const controller = new AbortController();
    abortControllersRef.current[key] = controller;
    return controller;
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      Object.values(abortControllersRef.current).forEach((controller) => controller?.abort());
    };
  }, []);

  const setTab = useCallback(
    (nextTab) => {
      const safeTab = VALID_TABS.has(nextTab) ? nextTab : "dashboard";
      setTabState(safeTab);
      navigate(PATH_BY_TAB[safeTab], { replace: false });
    },
    [navigate],
  );

  const showToast = useCallback((message, type = "info", durationMs = 3000) => {
    setToast({ message, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast({ message: "", type: "info", visible: false }),
      durationMs,
    );
  }, []);

  const fetchServicesWidget = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const controller = createRequestController("services");
      const fetched = await fetchAgentTours({ signal: controller.signal });
      if (requestSeq.current !== seq) return;
      setTours(Array.isArray(fetched) ? fetched : []);
    } catch (e) {
      if (isRequestCancelled(e)) return;
      if (requestSeq.current !== seq) return;
      console.error("fetchTours error:", e);
      setError(e.message || "Failed to load tours");
      setTours([]);
    } finally {
      if (requestSeq.current === seq) setLoading(false);
    }
  }, []);

  const fetchProfileWidget = useCallback(async () => {
    setProfileLoading(true);
    try {
      const controller = createRequestController("profile");
      const nextProfile = await fetchAgentProfile({ signal: controller.signal }).catch((error) => {
        if (isRequestCancelled(error)) return null;
        throw error;
      });
      const profileUser = nextProfile?.user || nextProfile || auth.user || {};
      setProfile({
        name: profileUser.name || FALLBACK_PROFILE.name,
        email: profileUser.email || "",
        role: profileUser.agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent",
        agencyRef:
          profileUser.partnerAgencyRef || profileUser.agencyRef || FALLBACK_PROFILE.agencyRef,
        agentRef: profileUser.agentRef || FALLBACK_PROFILE.agentRef,
        approvalStatus: profileUser.agentApprovalStatus || "approved",
        avatar: profileUser.avatar || "",
      });
    } catch (e) {
      if (isRequestCancelled(e)) return;
    } finally {
      setProfileLoading(false);
    }
  }, [auth.user, auth.role, createRequestController]);

  const fetchAgencyWidget = useCallback(async () => {
    setAgencyLoading(true);
    try {
      const userEmail = auth.user?.email || "";
      if (!userEmail) return;
      const controller = createRequestController("agency");
      const application = auth.user?.agencyId
        ? await fetchAgencyProfile(auth.user.agencyId, { signal: controller.signal })
        : await checkPartnerApplication(userEmail, { signal: controller.signal });
      setAgencyApplication(application);
    } catch (e) {
      if (isRequestCancelled(e)) return;
      console.error("fetchAgencyWidget error:", e);
      setAgencyApplication(null);
    } finally {
      setAgencyLoading(false);
    }
  }, [auth.user?.email, auth.user?.agencyId, createRequestController]);

  useEffect(() => {
    fetchServicesWidget();
    fetchProfileWidget();
    fetchAgencyWidget();
  }, [fetchServicesWidget, fetchProfileWidget, fetchAgencyWidget]);

  useEffect(() => {
    const nextTab = getTabFromLocation(location.pathname, location.search);
    setTabState((current) => (current === nextTab ? current : nextTab));
  }, [location.pathname, location.search, navigate]);

  const handleApplyAgency = useCallback(
    async (formData) => {
      const application = await applyPartnerAgency(formData);
      await fetchAgencyWidget();
      return application;
    },
    [fetchAgencyWidget],
  );

  const handleUpdatePassword = useCallback(async (data) => {
    return updatePassword(data);
  }, []);

  const handleUpdateProfile = useCallback(
    async (data) => {
      const result = await updateProfile(data);
      await fetchProfileWidget();
      return result;
    },
    [fetchProfileWidget],
  );

  const handleUpdateAvatar = useCallback(
    (avatar) => {
      return handleUpdateProfile({ avatar });
    },
    [handleUpdateProfile],
  );

  const handleDelete = useCallback((id) => {
    setConfirmDelete(id);
    setConfirmMessage(pageConfig.deleteConfirm.single);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setConfirmDelete("ALL");
    setConfirmMessage(pageConfig.deleteConfirm.all);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmDelete;
    setConfirmDelete(null);
    setConfirmMessage("");
    try {
      if (target === "ALL") {
        await deleteAllAgentTours();
      } else {
        await deleteAgentTour(target);
      }
      await fetchServicesWidget();
    } catch (e) {
      console.error("handleConfirmDelete:", e);
      showToast(e.message || "Delete failed", "error");
    }
  }, [confirmDelete, fetchServicesWidget, showToast]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
    setConfirmMessage("");
  }, []);

  const openCreate = useCallback(() => {
    navigate("/agent/services/tours/builder");
  }, [navigate]);

  const openEdit = useCallback(
    (t) => {
      const id = t?._id || t?.id;
      if (id) navigate(`/agent/services/tours/${encodeURIComponent(id)}/edit`);
    },
    [navigate],
  );

  const openView = useCallback(
    (t) => {
      const id = t?._id || t?.id;
      if (id) navigate(`/agent/services/tours/${encodeURIComponent(id)}/view`);
    },
    [navigate],
  );

  return (
    <ManageToursView
      tab={tab}
      tours={tours}
      profile={profile}
      agencyApplication={agencyApplication}
      agencyLoading={agencyLoading}

      loading={loading}
      profileLoading={profileLoading}
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
      fetchTours={fetchServicesWidget}
      fetchProfile={fetchProfileWidget}
      fetchAgency={fetchAgencyWidget}
      onApplyAgency={handleApplyAgency}
      onUpdatePassword={handleUpdatePassword}
      onUpdateAvatar={handleUpdateAvatar}
      onUpdateProfile={handleUpdateProfile}
      toast={toast}
      setToast={setToast}
    />
  );
}
