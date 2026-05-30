import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    applyPartnerAgency,
    checkPartnerApplication,
    deleteAllAgentTours,
    deleteAgentTour,
    fetchAgentBookings,
    fetchAgentTours,
    fetchAgentProfile,
    updateAvatar,
    updatePassword,
    updateProfile,
} from "../../../services/agentService";
import { VALID_TABS, PATH_BY_TAB, FALLBACK_PROFILE, DEFAULT_CURRENCY, DEFAULT_LOCALE } from "./tours.constants";
import { FALLBACK_BOOKING_TOUR_TITLE, FALLBACK_BOOKING_TOUR_TYPE } from "../bookings/bookings.constants";
import pageConfig from "./manageToursPage.config.json";
import ManageToursView from "./ManageTours.view";

const getTabFromLocation = (pathname, search) => {
    if (pathname.includes("/agent/profile")) return "profile";
    if (pathname.includes("/agent/bookings")) return "bookings";
    if (pathname.includes("/agent/settings")) return "settings";
    if (pathname.includes("/agent/partner-agency") || pathname.includes("/agent/agency")) return "partnerAgency";
    const tab = new URLSearchParams(search || "").get("tab") || "profile";
    return VALID_TABS.has(tab) ? tab : "profile";
};

const isRequestCancelled = (error) =>
    error?.name === "CanceledError" ||
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.message === "Request cancelled";

const normalizeBookingRow = (booking = {}) => {
    const tour = booking.tour || {};
    const amount = booking.paymentSummary?.total || booking.priceSnapshot?.total || booking.tripSelection?.amount || 0;
    const currency = booking.priceSnapshot?.currency || booking.tripSelection?.currency || DEFAULT_CURRENCY;
    const formatter = new Intl.NumberFormat(DEFAULT_LOCALE, { style: "currency", currency, maximumFractionDigits: 0 });
    const status = String(booking.status || "PENDING").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    const startDate = booking.startDate || booking.travelWindow?.startDate;
    const endDate = booking.endDate || booking.travelWindow?.endDate;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const days = start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
        ? `${Math.max(1, Math.round((end - start) / 86400000) + 1)} Days`
        : "N/A";

    return {
        id: booking.bookingRef || booking._id || booking.id,
        bookingId: booking._id || booking.id,
        tour: tour.title || booking.tourTitle || FALLBACK_BOOKING_TOUR_TITLE,
        type: Array.isArray(tour.tags) ? tour.tags[0] || FALLBACK_BOOKING_TOUR_TYPE : FALLBACK_BOOKING_TOUR_TYPE,
        travellers: `${booking.guestsCount || booking.travelers?.length || 1} Guests`,
        days,
        price: formatter.format(Number(amount || 0)),
        date: start && !Number.isNaN(start.getTime()) ? start.toLocaleDateString(DEFAULT_LOCALE, { day: "2-digit", month: "short", year: "numeric" }) : "N/A",
        status,
    };
};

export default function ManageTours({ session }) {
    const location = useLocation();
    const navigate = useNavigate();
    const auth = {
        user: session?.user || null,
        role: session?.flags?.role || session?.user?.role || FALLBACK_PROFILE.role,
    };
    const [tab, setTabState] = useState(() => getTabFromLocation(location.pathname, location.search));
    const [tours, setTours] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [profile, setProfile] = useState(null);
    const [agencyApplication, setAgencyApplication] = useState(null);
    const [agencyLoading, setAgencyLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewTour, setViewTour] = useState(null);
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

    const setTab = useCallback((nextTab) => {
        const safeTab = VALID_TABS.has(nextTab) ? nextTab : "profile";
        setTabState(safeTab);
        navigate(PATH_BY_TAB[safeTab], { replace: false });
    }, [navigate]);

    const showToast = useCallback((message, type = "info", durationMs = 3000) => {
        setToast({ message, type, visible: true });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast({ message: "", type: "info", visible: false }), durationMs);
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

    const fetchBookingsWidget = useCallback(async () => {
        setBookingLoading(true);
        try {
            const controller = createRequestController("bookings");
            const fetched = await fetchAgentBookings({ signal: controller.signal });
            setBookings(Array.isArray(fetched) ? fetched.map(normalizeBookingRow) : []);
        } catch (e) {
            if (isRequestCancelled(e)) return;
            console.error("fetchBookingsWidget error:", e);
            showToast(e.message || "Failed to load bookings", "error");
            setBookings([]);
        } finally {
            setBookingLoading(false);
        }
    }, [createRequestController, showToast]);

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
                role: profileUser.role || auth.role,
                agencyRef: profileUser.partnerAgencyRef || profileUser.agencyRef || FALLBACK_PROFILE.agencyRef,
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
            const application = await checkPartnerApplication(userEmail, { signal: controller.signal });
            setAgencyApplication(application);
        } catch (e) {
            if (isRequestCancelled(e)) return;
            console.error("fetchAgencyWidget error:", e);
            setAgencyApplication(null);
        } finally {
            setAgencyLoading(false);
        }
    }, [auth.user?.email, createRequestController]);

    useEffect(() => {
        fetchServicesWidget();
        fetchBookingsWidget();
        fetchProfileWidget();
        fetchAgencyWidget();
    }, [fetchServicesWidget, fetchBookingsWidget, fetchProfileWidget, fetchAgencyWidget]);

    useEffect(() => {
        const nextTab = getTabFromLocation(location.pathname, location.search);
        setTabState((current) => current === nextTab ? current : nextTab);
    }, [location.pathname, location.search, navigate]);

    const handleApplyAgency = useCallback(async (formData) => {
        const application = await applyPartnerAgency(formData);
        await fetchAgencyWidget();
        return application;
    }, [fetchAgencyWidget]);

    const handleUpdatePassword = useCallback(async (data) => {
        return updatePassword(data);
    }, []);

    const handleUpdateProfile = useCallback(async (data) => {
        const result = await updateProfile(data);
        await fetchProfileWidget();
        return result;
    }, [fetchProfileWidget]);

    const handleUpdateAvatar = useCallback((avatar) => {
        return handleUpdateProfile({ avatar });
    }, [handleUpdateProfile]);

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
        setEditing(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((t) => {
        setEditing(t);
        setFormOpen(true);
    }, []);

    const openView = useCallback((t) => {
        setViewTour(t);
        setViewOpen(true);
    }, []);

    const handleBookingClick = useCallback((booking) => {
        const id = booking?.bookingId || booking?.id;
        if (id) navigate(`/bookings/${id}`);
    }, [navigate]);

    return (
        <ManageToursView
            tab={tab}
            tours={tours}
            bookings={bookings}
            profile={profile}
            agencyApplication={agencyApplication}
            agencyLoading={agencyLoading}

            loading={loading}
            bookingLoading={bookingLoading}
            profileLoading={profileLoading}
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
            fetchTours={fetchServicesWidget}
            fetchBookings={fetchBookingsWidget}
            fetchProfile={fetchProfileWidget}
            fetchAgency={fetchAgencyWidget}
            onApplyAgency={handleApplyAgency}
            onUpdatePassword={handleUpdatePassword}
            onUpdateAvatar={handleUpdateAvatar}
            onUpdateProfile={handleUpdateProfile}
            toast={toast}
            setToast={setToast}
            setFormOpen={setFormOpen}
            setViewOpen={setViewOpen}
            setViewTour={setViewTour}
            onBookingClick={handleBookingClick}
        />
    );
}
