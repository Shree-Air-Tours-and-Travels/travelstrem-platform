import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { emit } from "@packages/trem-events";
import { buildGlobalAuthUrl, useThemeMode } from "@packages/trem-utils";
import { AppHeader, Breadcrumbs, Button, SideBar } from "@packages/trem-ui";
import { useAdminPortalConfig } from "./providers/AdminPortalProvider";
import authService from "../services/authService";

const SECTION_IDS = [
  { id: "workspace", title: "Workspace", items: ["overview", "enquiries"] },
  { id: "catalog", title: "Catalogue", items: ["services"] },
  { id: "governance", title: "Governance", items: ["tenancy", "clients"] },
  { id: "account", title: "Account", items: ["profile", "logout"] },
];

export default function AdminRouteFrame({
  activeId = "services",
  currentLabel,
  backLabel,
  backTarget,
  pageClassName = "",
  children,
}) {
  const navigate = useNavigate();
  const { session, headerConfig: backendHeaderConfig } = useAdminPortalConfig();
  const { theme, toggleTheme } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const user = useMemo(() => session?.user || {}, [session?.user]);
  const adminLevel = user.adminLevel || session?.flags?.adminLevel || "standard";

  const navigationItems = useMemo(
    () =>
      (backendHeaderConfig?.adminNavigation || []).filter(
        (item) => !item.masterOnly || adminLevel === "master",
      ),
    [adminLevel, backendHeaderConfig?.adminNavigation],
  );

  const sidebarConfig = useMemo(() => {
    const byId = (ids) => navigationItems.filter((item) => ids.includes(item.id));
    return {
      ariaLabel: "AdminTREM navigation",
      brand: {
        name: backendHeaderConfig?.brand?.label || "AdminTREM",
        fallbackSubtitle: backendHeaderConfig?.brand?.subtitle || "Platform Administration",
      },
      sections: SECTION_IDS.map((section) => ({
        id: section.id,
        title: section.title,
        items: byId(section.items),
      })).filter((section) => section.items.length),
      profile: {
        metaKey: "adminRoleLabel",
        actionTarget: "profile",
        actionLabel: "View profile",
      },
    };
  }, [backendHeaderConfig?.brand, navigationItems]);

  const adminUser = useMemo(
    () => ({
      ...user,
      adminRoleLabel: adminLevel === "master" ? "Master Admin" : "Administrator",
    }),
    [adminLevel, user],
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => null);
    clearAuthBrowserState({ prefixes: ["adminTREM"] });
    emit("USER_LOGOUT", { source: "admin-shell" }, { skipController: true });
    emitAuthEvent({ type: "LOGOUT" });
    window.location.replace(
      buildGlobalAuthUrl({ app: "admin", returnTo: window.location.origin }),
    );
  }, []);

  const goToWorkspace = useCallback(
    (target) => {
      if (target === "logout") return logout();
      navigate(`/manage/tours?tab=${target || "overview"}`);
    },
    [logout, navigate],
  );

  const breadcrumbs = useMemo(() => {
    const configured = backendHeaderConfig?.adminBreadcrumbs?.[activeId] || [];
    const linked = configured.map((item, index) => ({
      ...item,
      path:
        index === configured.length - 1
          ? `/manage/tours?tab=${activeId}`
          : "/manage/tours?tab=overview",
    }));
    return currentLabel ? [...linked, { label: currentLabel }] : linked;
  }, [activeId, backendHeaderConfig?.adminBreadcrumbs, currentLabel]);

  const headerConfig = useMemo(
    () => ({
      variant: "admin",
      ariaLabel: "AdminTREM application header",
      brand: {
        name: backendHeaderConfig?.brand?.label || "AdminTREM",
        subtitle: backendHeaderConfig?.brand?.subtitle || "Platform Administration",
      },
      search: { enabled: false },
      primaryAction: { hide: true },
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
    [backendHeaderConfig?.brand],
  );

  return (
    <div
      className={`admin-dashboard-shell has-admin-navigation${collapsed ? " is-sidebar-collapsed" : ""}`}
    >
      <SideBar
        config={sidebarConfig}
        user={adminUser}
        activeId={activeId}
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onNavigate={goToWorkspace}
        onAction={goToWorkspace}
        onClose={() => setMobileOpen(false)}
        onCollapsedChange={setCollapsed}
      />
      <AppHeader
        config={headerConfig}
        user={adminUser}
        theme={theme}
        menuOpen={mobileOpen}
        sidebarCollapsed={collapsed}
        onMenuToggle={() => setMobileOpen((open) => !open)}
        onToggleTheme={toggleTheme}
        onLogoClick={() => goToWorkspace("overview")}
        onAction={goToWorkspace}
      />
      <main className="admin-dashboard-shell__content">
        <div className="admin-dashboard-shell__breadcrumb admin-dashboard-shell__breadcrumb--action">
          <Breadcrumbs items={breadcrumbs} />
          {backTarget ? (
            <Button
              text={backLabel || "Back"}
              iconLeft="arrowLeft"
              variant="text"
              onClick={() => navigate(backTarget)}
            />
          ) : null}
        </div>
        <div
          className={`admin-dashboard-shell__page${pageClassName ? ` ${pageClassName}` : ""}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
