import React, { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { emit } from "@packages/trem-events";
import { buildGlobalAuthUrl, useThemeMode } from "@packages/trem-utils";
import { AppHeader, Breadcrumbs, SideBar } from "@packages/trem-ui";
import { useAdminPortalConfig } from "../../app/providers/AdminPortalProvider";
import authService from "../../services/authService";
import AdminOverviewView from "../../views/AdminOverviewView";
import AdminServicesView from "../../views/AdminServicesView";
import AdminProfileView from "../../views/AdminProfileView";
import TripView from "../trips/TripView";
import CreateTripForm from "../trips/CreateTripForm";
import TenancyManagement from "../tenancy/TenancyManagement";
import EnquiriesPage from "../enquiries/EnquiriesPage";
import ManageClients from "../clients/ManageClients";
import "./ManageTours.scss";

export function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  onCancel,
  onConfirm,
}) {
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
          <button className="tm-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="tm-btn-danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
      <span style={{ fontSize: 18, lineHeight: 1, opacity: 0.8 }}>x</span>
    </div>
  );
}

export default function ManageToursView({
  tab,
  setTab,
  tours,
  trips,
  profile,
  admins,
  agents,
  partnerAgencies,
  loading,
  agencyLoading,
  dashboardDefinition,
  dashboardLoading,
  dashboardError,
  refreshDashboard,
  auth,
  tripFormOpen,
  setTripFormOpen,
  tripEditing,
  tripViewOpen,
  setTripViewOpen,
  viewTrip,
  setViewTrip,
  openCreate,
  openEdit,
  openView,
  verifyTour,
  verifyTrip,
  openTripCreate,
  openTripEdit,
  openTripView,
  handleDelete,
  handleDeleteAll,
  handleTripDelete,
  handleTripDeleteAll,
  handleConfirmDelete,
  handleCancelDelete,
  confirmDelete,
  confirmMessage,
  fetchTrips,
  fetchAgencyManagement,
  handleReviewAdmin,
  handleRemoveAdmin,
  handleReviewAgent,
  handleReviewPartnerAgency,
  handleSaveProfile,
  handleUpdatePassword,
  handleUpdateAvatar,
  profileSaving,
  passwordSaving,
  avatarSaving,
  refreshAll,
  toast,
  setToast,
}) {
  const { theme, toggleTheme } = useThemeMode();
  const { headerConfig: backendHeaderConfig } = useAdminPortalConfig();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const mergedUser = useMemo(() => ({ ...auth.user, ...(profile || {}) }), [auth.user, profile]);
  const closeMobileSidebar = React.useCallback(() => setMobileSidebarOpen(false), []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => null);
    clearAuthBrowserState({ prefixes: ["adminTREM"] });
    emit("USER_LOGOUT", { source: "admin-shell" }, { skipController: true });
    emitAuthEvent({ type: "LOGOUT" });
    window.location.replace(buildGlobalAuthUrl({ app: "admin", returnTo: window.location.origin }));
  }, []);

  const onAction = useCallback(
    (action) => {
      if (action === "logout") return logout();
      if (action === "createTour") return openCreate();
      return setTab(action || "overview");
    },
    [logout, openCreate, setTab],
  );

  const navigationItems = useMemo(
    () =>
      (backendHeaderConfig?.adminNavigation || []).filter(
        (item) => !item.masterOnly || auth.adminLevel === "master",
      ),
    [auth.adminLevel, backendHeaderConfig?.adminNavigation],
  );

  const sidebarConfig = useMemo(() => {
    const byId = (ids) => navigationItems.filter((item) => ids.includes(item.id));
    return {
      ariaLabel: "AdminTREM navigation",
      brand: {
        name: backendHeaderConfig?.brand?.label || "AdminTREM",
        fallbackSubtitle: backendHeaderConfig?.brand?.subtitle || "Platform Administration",
      },
      sections: [
        { id: "workspace", title: "Workspace", items: byId(["overview", "enquiries"]) },
        { id: "catalog", title: "Catalogue", items: byId(["services"]) },
        { id: "governance", title: "Governance", items: byId(["tenancy", "clients"]) },
        { id: "account", title: "Account", items: byId(["profile", "logout"]) },
      ].filter((section) => section.items.length),
      profile: {
        metaKey: "adminRoleLabel",
        actionTarget: "profile",
        actionLabel: "View profile",
      },
    };
  }, [backendHeaderConfig?.brand, navigationItems]);

  const activeInventory = dashboardDefinition?.data?.inventory || [];
  const primaryProduct = activeInventory[0];
  const primaryCreateAction =
    primaryProduct?.id === "trevio" ? openTripCreate : primaryProduct ? openCreate : null;

  const headerConfig = useMemo(
    () => ({
      variant: "admin",
      ariaLabel: "AdminTREM application header",
      brand: {
        name: backendHeaderConfig?.brand?.label || "AdminTREM",
        subtitle: backendHeaderConfig?.brand?.subtitle || "Platform Administration",
      },
      search: { enabled: false },
      primaryAction: {
        label: primaryProduct
          ? `Create ${primaryProduct.label} ${primaryProduct.id === "trevio" ? "trip" : "tour"}`
          : "Create travel product",
        icon: "plus",
        enabled: Boolean(primaryCreateAction),
        onClick: primaryCreateAction,
      },
      notification: { hide: true },
      themeAction: {},
      user: {
        fallbackName: "Administrator",
        variant: "outlined",
        items: [
          { id: "profile", label: "My profile", icon: "user", action: "profile" },
          { id: "logout", label: "Sign out", icon: "logout", action: "logout" },
        ],
      },
      mobileMenu: {
        openLabel: "Open administration navigation",
        closeLabel: "Close administration navigation",
      },
    }),
    [backendHeaderConfig?.brand, primaryCreateAction, primaryProduct],
  );

  const adminUser = useMemo(
    () => ({
      ...mergedUser,
      adminRoleLabel: auth.adminLevel === "master" ? "Master Admin" : "Administrator",
    }),
    [auth.adminLevel, mergedUser],
  );

  const breadcrumbItems = backendHeaderConfig?.adminBreadcrumbs?.[tab] || [];

  return (
    <div
      className={`admin-dashboard-shell has-admin-navigation${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
    >
      <SideBar
        config={sidebarConfig}
        user={adminUser}
        activeId={tab}
        mobileOpen={mobileSidebarOpen}
        collapsed={sidebarCollapsed}
        onNavigate={(target) => {
          if (String(target).startsWith("/")) navigate(target);
          else setTab(target);
          closeMobileSidebar();
        }}
        onAction={onAction}
        onClose={closeMobileSidebar}
        onCollapsedChange={setSidebarCollapsed}
      />
      <AppHeader
        config={headerConfig}
        user={adminUser}
        theme={theme}
        menuOpen={mobileSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onMenuToggle={() => setMobileSidebarOpen((open) => !open)}
        onToggleTheme={toggleTheme}
        onAction={onAction}
      />

      <main className="admin-dashboard-shell__content">
        {breadcrumbItems.length ? (
          <div className="admin-dashboard-shell__breadcrumb">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        ) : null}
        <div className="admin-dashboard-shell__page">
          {tab === "overview" && (
            <AdminOverviewView
              user={adminUser}
              definition={dashboardDefinition}
              loading={dashboardLoading}
              error={dashboardError}
              onRefresh={refreshDashboard}
              onTabChange={setTab}
              isMasterAdmin={auth.adminLevel === "master"}
            />
          )}
          {tab === "enquiries" && <EnquiriesPage />}
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
                activeProducts={dashboardDefinition?.data?.inventory}
                fetchAgencyManagement={fetchAgencyManagement}
                handleReviewAdmin={handleReviewAdmin}
                handleRemoveAdmin={handleRemoveAdmin}
                handleReviewAgent={handleReviewAgent}
                handleReviewPartnerAgency={handleReviewPartnerAgency}
              />
              {tripViewOpen &&
                createPortal(
                  <TripView
                    trip={viewTrip}
                    onClose={() => {
                      setTripViewOpen(false);
                      setViewTrip(null);
                    }}
                    onEdit={(trip) => {
                      setTripViewOpen(false);
                      openTripEdit(trip);
                    }}
                  />,
                  document.body,
                )}
              {tripFormOpen &&
                createPortal(
                  <CreateTripForm
                    initial={tripEditing}
                    onCancel={() => setTripFormOpen(false)}
                    onSaved={async () => {
                      setTripFormOpen(false);
                      await fetchTrips();
                    }}
                  />,
                  document.body,
                )}
            </>
          )}
          {tab === "profile" && (
            <AdminProfileView
              user={mergedUser}
              onSaveProfile={handleSaveProfile}
              onUpdatePassword={handleUpdatePassword}
              onUpdateAvatar={handleUpdateAvatar}
              saving={profileSaving}
              passwordSaving={passwordSaving}
              avatarSaving={avatarSaving}
            />
          )}
          {tab === "tenancy" && auth.adminLevel === "master" && <TenancyManagement />}
          {tab === "clients" && <ManageClients embedded />}
        </div>
      </main>

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
