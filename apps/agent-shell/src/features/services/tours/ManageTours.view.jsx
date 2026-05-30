import React, { useCallback } from "react";
import { Button, Paragraph, SubTitle } from "@packages/trem-ui";
import "./ManageTours.scss";
import CreateTourForm from "./CreateTourForm";
import TourView from "./TourView";
import { agentWidgetRegistry } from "../../../widgets/registry/widgetRegistry";
import { TAB_WIDGET_MAP } from "./tours.constants";
import pageConfig from "./manageToursPage.config.json";
import AgentWorkspaceSidebar from "./AgentWorkspaceSidebar.view";

export function ConfirmModal({ open, title = pageConfig.confirmModal.defaultTitle, message = pageConfig.confirmModal.defaultMessage, onCancel, onConfirm }) {
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
                    <Button type="button" primaryClassName="btn tm-btn-cancel" variant="outline" onClick={onCancel} text={pageConfig.confirmModal.cancelText} />
                    <Button type="button" primaryClassName="btn tm-btn-danger" variant="solid" color="danger" onClick={onConfirm} text={pageConfig.confirmModal.confirmText} />
                </div>
            </div>
        </div>
    );
}

export function Toast({ toast, setToast }) {
    if (!toast.visible) return null;
    return (
        <div className={`tm-toast tm-toast--${toast.type || "info"}`} onClick={() => setToast({ message: "", type: "info", visible: false })} role="alert">
            <span>{toast.message}</span>
            <span aria-hidden="true">x</span>
        </div>
    );
}

export default function ManageToursView({
    tab, tours, bookings, profile, agencyApplication, agencyLoading, loading, bookingLoading, profileLoading,
    formOpen, viewOpen, editing, viewTour, error, auth, setTab, openCreate, openEdit, openView, handleDelete,
    fetchTours, fetchBookings, fetchProfile, fetchAgency, onApplyAgency, onUpdatePassword, onUpdateAvatar, onUpdateProfile, setFormOpen, setViewOpen, setViewTour,
    confirmDelete, confirmMessage, handleConfirmDelete, handleCancelDelete,
    toast, setToast, onBookingClick
}) {
    const handleClose = useCallback(() => {
        setViewOpen(false);
        setViewTour(null);
    }, [setViewOpen, setViewTour]);

    const handleViewEdit = useCallback((t) => {
        setViewOpen(false);
        openEdit(t);
    }, [setViewOpen, openEdit]);

    return (
        <main className="agent-ops">
            <header className="agent-ops__heading">
                <SubTitle text={pageConfig.pageTitle} />
            </header>

            <div className="agent-ops__body">
                <AgentWorkspaceSidebar profile={profile} auth={auth} loading={profileLoading} activeNav={tab} onNavChange={setTab} onProfileAction={() => setTab("settings")} />
                <section className="agent-ops__content">
                    {(() => {
                        const def = agentWidgetRegistry.get(TAB_WIDGET_MAP[tab]);
                        const Component = def?.component;
                        if (!Component) return null;
                        return (
                            <Component
                                tours={tours}
                                bookings={bookings}
                                profile={profile}
                                agencyApplication={agencyApplication}
                                agencyLoading={agencyLoading}
                                loading={loading}
                                bookingLoading={bookingLoading}
                                profileLoading={profileLoading}
                                error={error}
                                auth={auth}

                                openCreate={openCreate}
                                openEdit={openEdit}
                                openView={openView}
                                handleDelete={handleDelete}
                                fetchTours={fetchTours}
                                fetchBookings={fetchBookings}
                                fetchProfile={fetchProfile}
                                fetchAgency={fetchAgency}
                                onApplyAgency={onApplyAgency}
                                onUpdatePassword={onUpdatePassword}
                                onUpdateAvatar={onUpdateAvatar}
                                onUpdateProfile={onUpdateProfile}
                                setToast={setToast}
                                onBookingClick={onBookingClick}
                                onNavigateSettings={() => setTab("settings")}
                            />
                        );
                    })()}
                </section>
            </div>

            {(viewOpen || formOpen) && (
                <div className="mt-panels-overlay" role="dialog" aria-modal="true">
                    {viewOpen && (
                        <TourView
                            tour={viewTour}
                            onClose={handleClose}
                            onEdit={handleViewEdit}
                        />
                    )}

                    {formOpen && (
                        <CreateTourForm
                            initial={editing}
                            onCancel={() => setFormOpen(false)}
                            onSaved={async () => {
                                setFormOpen(false);
                                await fetchTours();
                            }}
                        />
                    )}
                </div>
            )}

            <Toast toast={toast} setToast={setToast} />
            <ConfirmModal
                open={confirmDelete !== null}
                message={confirmMessage}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />
        </main>
    );
}
