import React from "react";
import { Button, SubTitle, Title, Paragraph } from "@packages/trem-ui";
import "./ManageTours.scss";
import { adminWidgetRegistry } from "../../widgets/registry/widgetRegistry";

const TAB_WIDGET_MAP = {
    dashboard: "AdminDashboard",
    tours: "AdminTourManagement",
    trips: "AdminTripManagement",
    agencies: "AgencyManagement",
};

export function ConfirmModal({ open, title = "Confirm", message = "Are you sure?", onCancel, onConfirm }) {
    if (!open) return null;
    return (
        <div className="tm-modal-overlay" role="dialog" aria-modal="true">
            <div className="tm-modal">
                <div className="tm-modal-header">
                    <SubTitle text={title} />
                </div>
                <div className="tm-modal-body">
                    <Paragraph>{message}</Paragraph>
                </div>
                <div className="tm-modal-actions">
                    <Button type="button" primaryClassName="btn tm-btn-cancel" variant="outline" onClick={onCancel} text="Cancel" />
                    <Button type="button" primaryClassName="btn tm-btn-danger" variant="solid" color="danger" onClick={onConfirm} text="Confirm" />
                </div>
            </div>
        </div>
    );
}

export function Toast({ toast, setToast }) {
    if (!toast.visible) return null;
    const bgMap = { success: "#2e7d32", error: "#c62828", info: "#1565c0" };
    return (
        <div
            className="tm-toast"
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 9999,
                background: bgMap[toast.type] || bgMap.info,
                color: "#fff",
                padding: "12px 20px",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                cursor: "pointer",
                animation: "tm-toast-in 260ms ease",
            }}
            onClick={() => setToast({ message: "", type: "info", visible: false })}
            role="alert"
        >
            <span>{toast.message}</span>
            <span style={{ fontSize: 18, lineHeight: 1, opacity: 0.8 }}>×</span>
        </div>
    );
}

export default function ManageToursView({
    tab, tours, trips, admins, agents, partnerAgencies, loading, agencyLoading, formOpen, tripFormOpen, tripEditing,
    viewOpen, editing, viewTour, error, auth, setTab, openCreate, openEdit, openView,
    openTripCreate, openTripEdit, handleTripDelete, handleTripDeleteAll, fetchTrips,
    handleDelete, handleDeleteAll, fetchTours, fetchAgencyManagement,
    handleReviewAdmin, handleRemoveAdmin, handleReviewAgent, handleReviewPartnerAgency,
    setFormOpen, setTripFormOpen, setViewOpen, setViewTour,
    confirmDelete, confirmMessage, handleConfirmDelete, handleCancelDelete,
    toast, setToast,
}) {
    return (
        <div className="mt-root">
            <header className="mt-toolbar">
                <Title text="Admin Operations" />
                <div className="mt-actions">
                    <Button primaryClassName={`btn ${tab === "dashboard" ? "is-active" : ""}`} variant={tab === "dashboard" ? "solid" : "outline"} onClick={() => setTab("dashboard")} text="Dashboard" />
                    <Button primaryClassName={`btn ${tab === "tours" ? "is-active" : ""}`} variant={tab === "tours" ? "solid" : "outline"} onClick={() => setTab("tours")} text="Tours" />
                    <Button primaryClassName={`btn ${tab === "trips" ? "is-active" : ""}`} variant={tab === "trips" ? "solid" : "outline"} onClick={() => setTab("trips")} text="Trips" />
                    <Button primaryClassName={`btn ${tab === "agencies" ? "is-active" : ""}`} variant={tab === "agencies" ? "solid" : "outline"} onClick={() => setTab("agencies")} text="Agencies" />
                </div>
            </header>

            <div className="mt-session-bar">
                <strong>Signed in as:</strong> {auth.user?.name || auth.user?.email} · role: {auth.role} · admin: {auth.user?.adminLevel || "standard"}
            </div>

            {(() => {
                const def = adminWidgetRegistry.get(TAB_WIDGET_MAP[tab]);
                const Component = def?.component;
                if (!Component) return null;
                return (
                    <Component
                        tours={tours}
                        trips={trips}
                        admins={admins}
                        agents={agents}
                        partnerAgencies={partnerAgencies}
                        loading={loading}
                        agencyLoading={agencyLoading}
                        formOpen={tab === "trips" ? tripFormOpen : formOpen}
                        viewOpen={viewOpen}
                        editing={editing}
                        viewTour={viewTour}
                        error={error}
                        auth={auth}
                        openCreate={tab === "trips" ? openTripCreate : openCreate}
                        openEdit={tab === "trips" ? openTripEdit : openEdit}
                        openView={openView}
                        handleDelete={tab === "trips" ? handleTripDelete : handleDelete}
                        handleDeleteAll={tab === "trips" ? handleTripDeleteAll : handleDeleteAll}
                        fetchTrips={fetchTrips}
                        fetchTours={fetchTrips}
                        fetchAgencyManagement={fetchAgencyManagement}
                        handleReviewAdmin={handleReviewAdmin}
                        handleRemoveAdmin={handleRemoveAdmin}
                        handleReviewAgent={handleReviewAgent}
                        handleReviewPartnerAgency={handleReviewPartnerAgency}
                        setFormOpen={tab === "trips" ? setTripFormOpen : setFormOpen}
                        setViewOpen={setViewOpen}
                        setViewTour={setViewTour}
                    />
                );
            })()}

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
