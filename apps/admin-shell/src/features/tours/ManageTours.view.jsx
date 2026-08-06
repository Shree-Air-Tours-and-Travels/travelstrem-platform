import React from "react";
import { createPortal } from "react-dom";
import { useThemeMode } from "@packages/trem-utils";
import Sidebar from "../../components/AdminSidebar";
import DashboardHeader from "../../components/AdminDashboardHeader";
import AdminOverviewView from "../../views/AdminOverviewView";
import AdminBookingsView from "../payments/AdminPaymentsBookings";
import AdminServicesView from "../../views/AdminServicesView";
import AdminProfileView from "../../views/AdminProfileView";
import TourView from "./TourView";
import CreateTourForm from "./CreateTourForm";
import TripView from "../trips/TripView";
import CreateTripForm from "../trips/CreateTripForm";
import TenancyManagement from "../tenancy/TenancyManagement";
import "./ManageTours.scss";

export function ConfirmModal({ open, title = "Confirm", message = "Are you sure?", onCancel, onConfirm }) {
    if (!open) return null;
    return createPortal(
        <div className="tm-modal-overlay" role="dialog" aria-modal="true">
            <div className="tm-modal">
                <div className="tm-modal-header">
                    <h4>{title}</h4>
                </div>
                <div className="tm-modal-body">
                    <p>{message}</p>
                </div>
                <div className="tm-modal-actions">
                    <button className="tm-btn-cancel" onClick={onCancel}>Cancel</button>
                    <button className="tm-btn-danger" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export function Toast({ toast, setToast }) {
    if (!toast.visible) return null;
    const bgMap = { success: "#2e7d32", error: "#c62828", info: "#1565c0" };
    return (
        <div
            className="tm-toast"
            style={{
                position: "fixed", top: 20, right: 20, zIndex: 9999,
                background: bgMap[toast.type] || bgMap.info, color: "#fff",
                padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer",
                animation: "tm-toast-in 260ms ease",
            }}
            onClick={() => setToast({ message: "", type: "info", visible: false })}
            role="alert"
        >
            <span>{toast.message}</span>
            <span style={{ fontSize: 18, lineHeight: 1, opacity: 0.8 }}>x</span>
        </div>
    );
}

export default function ManageToursView({
    tab, setTab,
    tours, trips, bookings, profile,
    admins, agents, partnerAgencies,
    loading, bookingsLoading, agencyLoading,
    stats, auth, error,
    formOpen, setFormOpen,
    tripFormOpen, setTripFormOpen,
    tripEditing,
    viewOpen, setViewOpen,
    tripViewOpen, setTripViewOpen,
    editing, viewTour, setViewTour,
    viewTrip, setViewTrip,
    openCreate, openEdit, openView, verifyTour, verifyTrip,
    openTripCreate, openTripEdit, openTripView,
    handleDelete, handleDeleteAll,
    handleTripDelete, handleTripDeleteAll,
    handleConfirmDelete, handleCancelDelete,
    confirmDelete, confirmMessage,
    fetchTours, fetchTrips, fetchAgencyManagement,
    handleReviewAdmin, handleRemoveAdmin,
    handleReviewAgent, handleReviewPartnerAgency,
    handleSaveProfile,
    refreshAll,
    toast, setToast,
}) {
    const { theme, toggleTheme } = useThemeMode();
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
    const mergedUser = { ...auth.user, ...(profile || {}) };
    const closeMobileSidebar = React.useCallback(() => setMobileSidebarOpen(false), []);

    return (
        <div className="dash-layout">
            <Sidebar
                activeTab={tab}
                onTabChange={setTab}
                user={mergedUser}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={closeMobileSidebar}
            />

            <div className="dash-main">
                <DashboardHeader
                    activeTab={tab}
                    onTabChange={setTab}
                    user={mergedUser}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />

                <div className="dash-content">
                    {tab === "overview" && (
                        <AdminOverviewView
                            user={mergedUser}
                            stats={stats}
                            recentBookings={bookings}
                            onTabChange={setTab}
                            onViewBooking={(b) => {
                                const id = b.id || b._id;
                                if (id) window.location.href = `/bookings/${id}`;
                            }}
                        />
                    )}
                    {tab === "bookings" && (
                        <AdminBookingsView
                            bookings={bookings}
                            loading={bookingsLoading}
                            onViewBooking={(b) => {
                                const id = b.id || b._id;
                                if (id) window.location.href = `/bookings/${id}`;
                            }}
                        />
                    )}
                    {tab === "services" && (
                        <>
                            <AdminServicesView
                                tours={tours}
                                trips={trips}
                                loading={loading}
                                onEditTour={openEdit}
                                onViewTour={openView}
                                onDeleteTour={handleDelete}
                                onVerifyTour={verifyTour}
                                onEditTrip={openTripEdit}
                                onViewTrip={openTripView}
                                onDeleteTrip={handleTripDelete}
                                onVerifyTrip={verifyTrip}
                                onCreateTour={openCreate}
                                onCreateTrip={openTripCreate}
                                onRefresh={refreshAll}
                                onDeleteAllTours={handleDeleteAll}
                                onDeleteAllTrips={handleTripDeleteAll}
                                admins={admins}
                                agents={agents}
                                partnerAgencies={partnerAgencies}
                                agencyLoading={agencyLoading}
                                auth={auth}
                                fetchAgencyManagement={fetchAgencyManagement}
                                handleReviewAdmin={handleReviewAdmin}
                                handleRemoveAdmin={handleRemoveAdmin}
                                handleReviewAgent={handleReviewAgent}
                                handleReviewPartnerAgency={handleReviewPartnerAgency}
                            />
                            {viewOpen && createPortal(
                                <TourView
                                    tour={viewTour}
                                    onClose={() => { setViewOpen(false); setViewTour(null); }}
                                    onEdit={(tour) => { setViewOpen(false); openEdit(tour); }}
                                />,
                                document.body
                            )}
                            {tripViewOpen && createPortal(
                                <TripView
                                    trip={viewTrip}
                                    onClose={() => { setTripViewOpen(false); setViewTrip(null); }}
                                    onEdit={(trip) => { setTripViewOpen(false); openTripEdit(trip); }}
                                />,
                                document.body
                            )}
                            {formOpen && createPortal(
                                <CreateTourForm
                                    initial={editing}
                                    onCancel={() => setFormOpen(false)}
                                    onSaved={async () => { setFormOpen(false); await fetchTours(); }}
                                />,
                                document.body
                            )}
                            {tripFormOpen && createPortal(
                                <CreateTripForm
                                    initial={tripEditing}
                                    onCancel={() => setTripFormOpen(false)}
                                    onSaved={async () => { setTripFormOpen(false); await fetchTrips(); }}
                                />,
                                document.body
                            )}
                        </>
                    )}
                    {tab === "profile" && (
                        <AdminProfileView
                            user={mergedUser}
                            onSaveProfile={handleSaveProfile}
                            saving={false}
                        />
                    )}
                    {tab === "tenancy" && auth.adminLevel === "master" && <TenancyManagement />}
                </div>
            </div>

            <Toast toast={toast} setToast={setToast} />
            <ConfirmModal
                open={confirmDelete !== null}
                message={confirmMessage}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
