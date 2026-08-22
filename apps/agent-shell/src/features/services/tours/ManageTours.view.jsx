import React from "react";
import { Button, Paragraph, SubTitle } from "@packages/trem-ui";
import "./ManageTours.scss";
import { agentWidgetRegistry } from "../../../widgets/registry/widgetRegistry";
import { TAB_WIDGET_MAP } from "./tours.constants";
import pageConfig from "./manageToursPage.config.json";
import PartnerWorkspace from "../../tenancy/PartnerWorkspace";

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
    tab, tours, profile, agencyApplication, agencyLoading, loading, profileLoading,
    error, auth, setTab, openCreate, openEdit, openView, handleDelete,
    fetchTours, fetchProfile, fetchAgency, onApplyAgency, onUpdatePassword, onUpdateAvatar, onUpdateProfile,
    confirmDelete, confirmMessage, handleConfirmDelete, handleCancelDelete,
    toast, setToast
}) {
    return (
        <main className="agent-ops">
            <header className="agent-ops__heading">
                <SubTitle text={pageConfig.pageTitle} />
            </header>

            <div className="agent-ops__body">
                <section className="agent-ops__content">
                    {(() => {
                        if (["dashboard", "agents", "customers", "reports", "deletions", "notifications"].includes(tab)) return <PartnerWorkspace tab={tab} user={auth.user} />;
                        const def = agentWidgetRegistry.get(TAB_WIDGET_MAP[tab]);
                        const Component = def?.component;
                        if (!Component) return null;
                        return (
                            <Component
                                tours={tours}
                                profile={profile}
                                agencyApplication={agencyApplication}
                                agencyLoading={agencyLoading}
                                loading={loading}
                                profileLoading={profileLoading}
                                error={error}
                                auth={auth}

                                openCreate={openCreate}
                                openEdit={openEdit}
                                openView={openView}
                                handleDelete={handleDelete}
                                fetchTours={fetchTours}
                                fetchProfile={fetchProfile}
                                fetchAgency={fetchAgency}
                                onApplyAgency={onApplyAgency}
                                onUpdatePassword={onUpdatePassword}
                                onUpdateAvatar={onUpdateAvatar}
                                onUpdateProfile={onUpdateProfile}
                                setToast={setToast}
                                onNavigateSettings={() => setTab("settings")}
                            />
                        );
                    })()}
                </section>
            </div>

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
