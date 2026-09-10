import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader, Breadcrumbs, PRODUCT_TYPE, PortalPreloader, SideBar } from "@packages/trem-ui";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { emit, resolveNotificationLink, useNotificationInbox } from "@packages/trem-events";
import { buildGlobalAuthUrl, fetchData, useThemeMode } from "@packages/trem-utils";
import Routers from "./routes";
import { isAllowedAgentRole, useAgentPortalConfig } from "./providers/AgentPortalProvider";
import authService from "../services/authService";

const roleLabel = (user) =>
  user?.agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent";

function activeNavigation(pathname) {
  if (pathname.includes("/agent/support")) return "support";
  if (pathname.includes("/trevio/trips")) return "trevioTrips";
  if (pathname.includes("/services/tours")) return "trevistaTours";
  if (
    pathname.includes("/agent/agency") ||
    pathname.includes("/agent/agents") ||
    pathname.includes("/agent/partner-agency")
  )
    return "agencyWorkspace";
  if (pathname.includes("/agent/customers")) return "customers";
  if (pathname.includes("/agent/notifications")) return "notifications";
  if (
    pathname.includes("/agent/enquiries") ||
    pathname.includes("/agent/bookings") ||
    pathname.includes("/services/bookings")
  )
    return "enquiries";
  if (pathname.includes("/agent/profile") || pathname.includes("/agent/settings")) return "profile";
  if (pathname.includes("/agent/reports")) return "reports";
  return "dashboard";
}

const isRouteMatch = (pathname, route) =>
  Boolean(route && (pathname === route || pathname.startsWith(`${route}/`)));

export const resolvePartnerBreadcrumbs = (pathname, definitions = []) => {
  const items =
    definitions
      .filter((definition) => isRouteMatch(pathname, definition?.match))
      .sort((left, right) => right.match.length - left.match.length)[0]?.items || [];
  const detailMatch = pathname.match(/^(.*\/(?:bookings|enquiries))\/([^/]+)\/?$/);
  if (!detailMatch || !items.length) return items;
  return [
    ...items.slice(0, -1),
    { ...items[items.length - 1], path: detailMatch[1] },
    { label: decodeURIComponent(detailMatch[2]) },
  ];
};

export default function AppLayout({ embedded = false }) {
  const { loading, session, headerConfig: backendHeaderConfig } = useAgentPortalConfig();
  const { theme, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedProductKey, setSelectedProductKey] = useState("");
  const hasPartnerAccess = session?.isAuthenticated && isAllowedAgentRole(session);
  const user = useMemo(() => session?.user || {}, [session?.user]);
  const notificationInbox = useNotificationInbox({
    loadInbox: async () =>
      (await fetchData("/tenancy/notifications", { params: { limit: 6 } })).componentData?.data,
    readInboxItem: (id) => fetchData(`/tenancy/notifications/${id}/read`, { method: "PATCH" }),
    readAllInboxItems: () => fetchData("/tenancy/notifications/read-all", { method: "PATCH" }),
  });
  const products = useMemo(
    () => (Array.isArray(user.productAccess) ? user.productAccess : []),
    [user.productAccess],
  );
  const isPartnerAdmin = user.agencyRole === "partner_admin";
  const productCatalog = useMemo(
    () =>
      (Array.isArray(backendHeaderConfig?.partnerProducts)
        ? backendHeaderConfig.partnerProducts
        : []
      ).filter((product) => products.includes(product.key)),
    [backendHeaderConfig?.partnerProducts, products],
  );
  const hasTrevio = productCatalog.some((product) => product.key === PRODUCT_TYPE.TREVIO);
  const hasTrevista = productCatalog.some((product) => product.key === PRODUCT_TYPE.TREVISTA);
  const partnerUser = useMemo(() => ({ ...user, partnerRoleLabel: roleLabel(user) }), [user]);

  useEffect(() => {
    const pathProduct = productCatalog.find((product) =>
      isRouteMatch(location.pathname, product.listPath),
    );
    if (pathProduct) {
      setSelectedProductKey(pathProduct.key);
      return;
    }
    if (!productCatalog.some((product) => product.key === selectedProductKey)) {
      setSelectedProductKey(productCatalog[0]?.key || "");
    }
  }, [location.pathname, productCatalog, selectedProductKey]);

  const selectedProduct = useMemo(
    () => productCatalog.find((product) => product.key === selectedProductKey) || productCatalog[0],
    [productCatalog, selectedProductKey],
  );
  const breadcrumbItems = useMemo(
    () =>
      location.pathname.startsWith("/agent/notifications")
        ? [{ label: "Workspace", path: "/agent/dashboard" }, { label: "Notifications" }]
        : resolvePartnerBreadcrumbs(location.pathname, backendHeaderConfig?.partnerBreadcrumbs || []),
    [backendHeaderConfig?.partnerBreadcrumbs, location.pathname],
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => null);
    clearAuthBrowserState({ prefixes: ["agentTREM"] });
    emit("USER_LOGOUT", { source: "partner-shell" }, { skipController: true });
    emitAuthEvent({ type: "LOGOUT" });
    window.location.replace(
      buildGlobalAuthUrl({ app: "partner", returnTo: window.location.origin }),
    );
  }, []);

  const sections = useMemo(
    () => [
      {
        id: "workspace",
        title: "Workspace",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "home", path: "/agent/dashboard" },
          {
            id: "enquiries",
            label: "Bookings & enquiries",
            icon: "calendar",
            path: "/agent/bookings",
          },
          {
            id: "customers",
            label: isPartnerAdmin ? "Customers" : "My Customers",
            icon: "usersRound",
            path: "/agent/customers",
          },
          ...(isPartnerAdmin
            ? [
                {
                  id: "agencyWorkspace",
                  label: "Agency Workspace",
                  icon: "building2",
                  path: "/agent/agency",
                },
              ]
            : []),
        ],
      },
      {
        id: "products",
        title: "Products",
        items: [
          ...(hasTrevio
            ? [
                {
                  id: "trevioTrips",
                  label: "Trevio Trips",
                  icon: "mountain",
                  path: "/agent/trevio/trips",
                },
              ]
            : []),
          ...(hasTrevista
            ? [
                {
                  id: "trevistaTours",
                  label: "Trevista Tours",
                  icon: "map",
                  path: "/agent/services/tours",
                },
              ]
            : []),
        ],
      },
      {
        id: "support-more",
        title: "Support & More",
        items: [
          {
            id: "notifications",
            label: "Notifications",
            icon: "bell",
            path: "/agent/notifications",
            indicator: notificationInbox.unread > 0,
          },
          { id: "support", label: "Help & Support", icon: "support", path: "/agent/support" },
        ],
      },
      {
        id: "account",
        title: "Account",
        items: [
          ...(isPartnerAdmin
            ? [{ id: "reports", label: "Reports", icon: "management", path: "/agent/reports" }]
            : []),
          { id: "profile", label: "My Profile", icon: "user", path: "/agent/profile" },
          { id: "logout", label: "Sign Out", icon: "logout", action: "logout" },
        ],
      },
    ],
    [hasTrevio, hasTrevista, isPartnerAdmin, notificationInbox.unread],
  );

  const sidebarConfig = useMemo(
    () => ({
      ariaLabel: "PartnerTREM navigation",
      brand: {
        name: "PartnerTREM",
        subtitleKey: "agencyName",
        fallbackSubtitle: "Agency Operations",
      },
      sections,
      profile: {
        metaKey: "partnerRoleLabel",
        actionTarget: "/agent/profile",
        actionLabel: "View profile",
      },
    }),
    [sections],
  );

  const notificationNavItem = useMemo(
    () => sections.flatMap((section) => section.items || []).find((item) => item.id === "notifications"),
    [sections],
  );

  const openNotification = useCallback(
    async (item) => {
      if (!item) return;
      if (!item.readAt) await notificationInbox.markRead(item._id).catch(() => null);
      const target = resolveNotificationLink(item, { portal: "partner" });
      if (target) navigate(target);
    },
    [navigate, notificationInbox],
  );

  const headerConfig = useMemo(
    () => ({
      variant: backendHeaderConfig?.variant || "partner",
      ariaLabel: "PartnerTREM application header",
      brand: { name: "PartnerTREM", subtitle: user.agencyName || roleLabel(user) },
      search: { enabled: false, placeholder: "Search trips and customers" },
      productMenu: {
        label: productCatalog.length > 1 ? selectedProduct?.label || "" : "",
        ariaLabel: "Choose agency product",
        items: productCatalog.map((product) => ({
          id: product.key,
          label: product.menuLabel || product.label,
          icon: product.icon,
          active: product.key === selectedProduct?.key,
          onClick: () => {
            setSelectedProductKey(product.key);
            navigate(product.listPath);
          },
        })),
      },
      primaryAction: selectedProduct
        ? {
            label: selectedProduct.createLabel,
            icon: "plus",
            enabled: true,
            onClick: () => navigate(selectedProduct.createPath),
          }
        : {},
      notification: {
        enabled: true,
        count: notificationInbox.unread,
        items: notificationInbox.items,
        onItemClick: openNotification,
        onMarkAllRead: notificationInbox.markAllRead,
        onViewAll: notificationNavItem?.path ? () => navigate(notificationNavItem.path) : undefined,
      },
      themeAction: {},
      user: {
        fallbackName: "Partner",
        variant: "outlined",
        items: [
          { id: "profile", label: "My Profile", icon: "user", action: "profile" },
          ...(isPartnerAdmin
            ? [
                {
                  id: "agency",
                  label: "Agency Workspace",
                  icon: "building2",
                  action: "agency",
                },
              ]
            : []),
          { id: "logout", label: "Sign Out", icon: "logout", action: "logout" },
        ],
      },
      mobileMenu: { openLabel: "Open partner navigation", closeLabel: "Close partner navigation" },
    }),
    [
      backendHeaderConfig?.variant,
      isPartnerAdmin,
      navigate,
      notificationInbox,
      notificationNavItem?.path,
      openNotification,
      productCatalog,
      selectedProduct,
      user,
    ],
  );

  const onAction = useCallback(
    (action) => {
      if (action === "logout") return logout();
      if (action === "agency") return navigate("/agent/agency");
      return navigate("/agent/profile");
    },
    [logout, navigate],
  );

  return (
    <div
      className={`agent-app-shell${embedded ? " agent-app-shell--embedded" : ""}${hasPartnerAccess ? " has-partner-navigation" : ""}${collapsed ? " is-sidebar-collapsed" : ""}`}
    >
      {hasPartnerAccess ? (
        <>
          <SideBar
            config={sidebarConfig}
            user={partnerUser}
            activeId={activeNavigation(location.pathname)}
            mobileOpen={mobileOpen}
            collapsed={collapsed}
            onNavigate={(path) => navigate(path)}
            onAction={onAction}
            onClose={() => setMobileOpen(false)}
            onCollapsedChange={setCollapsed}
          />
          <AppHeader
            config={headerConfig}
            user={partnerUser}
            theme={theme}
            menuOpen={mobileOpen}
            sidebarCollapsed={collapsed}
            onMenuToggle={() => setMobileOpen((open) => !open)}
            onToggleTheme={toggleTheme}
            onAction={onAction}
          />
        </>
      ) : null}
      <div className="partner-shell__content">
        {hasPartnerAccess && breadcrumbItems.length && !/\/(?:bookings|enquiries)\/[^/]+\/quotebuilder\/?$/.test(location.pathname) ? (
          <div className="partner-shell__breadcrumb">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        ) : null}
        <div className="partner-shell__content--margin">
          <Routers theme={theme} onToggleTheme={toggleTheme} />
        </div>
      </div>
      {loading && <PortalPreloader type="app" text="Preparing your PartnerTREM workspace" />}
    </div>
  );
}
