import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  AppHeader,
  AppFooter,
  Breadcrumbs,
  ErrorState,
  FloatingActionBar,
  GlobalLoader,
  NoDataFound,
  Preloader,
  ScrollToTop,
  SideBar,
  ThemeProvider,
  useTheme,
  Toaster,
} from "@packages/trem-ui";
import {
  initRealtimeNotifications,
  REALTIME_EVENTS,
  RealtimeProvider,
  resolveNotificationLink,
  useNotificationInbox,
  useRealtimeEvent,
} from "@packages/trem-events";
import { AppShellProvider, useAppShellConfig } from "./providers/AppShellProvider";
import AppShellPage from "../features/app-shell/AppShell.container";
import { buildGlobalAuthUrl, fetchData, SHELL_NAVIGATION_EVENT } from "@packages/trem-utils";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import LoginPrompt from "../components/LoginPrompt";
import SecurityMonitor from "../components/SecurityMonitor";
import SupportRoutes from "../features/support/SupportRoutes";
import { checkRateLimit } from "../services/security";
import { clearGuestSession, enableGuestSession, isGuestSession } from "../services/guestSession";
import {
  FALLBACK_NAVIGATION_CONFIG,
  normalizeNavigationConfig,
  resolveDestination,
  resolveNavigationIntent,
  isGuestAccessibleDestination,
} from "./routing/navigationRegistry";
import {
  resolveAuthReturnTo,
  setActiveAuthReturnTo,
} from "./routing/authReturnDestination";
import "../styles/global.scss";

/* global __webpack_init_sharing__, __webpack_share_scopes__ */

const TrevistaApp = React.lazy(() => import("trevista/App"));
const TrevioApp = React.lazy(() => import("trevio/App"));
const remoteScriptPromises = new Map();
const normalizeRemoteEntry = (explicitEntry, baseUrl, fallback) => {
  const value = explicitEntry || baseUrl || fallback;
  return value.endsWith("/remoteEntry.js") ? value : `${value.replace(/\/$/, "")}/remoteEntry.js`;
};
const loadRemoteScript = (scope, url) => {
  if (window[scope]) return Promise.resolve();
  if (remoteScriptPromises.has(scope)) return remoteScriptPromises.get(scope);

  const existingScript = document.querySelector(`script[data-trem-remote="${scope}"]`);
  if (existingScript) {
    const existingPromise = new Promise((resolve, reject) => {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
    remoteScriptPromises.set(scope, existingPromise);
    return existingPromise;
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    script.async = true;
    script.dataset.tremRemote = scope;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${scope} remote from ${url}`));
    document.head.appendChild(script);
  });
  remoteScriptPromises.set(scope, promise);
  return promise;
};
const loadFederatedModule = async ({ scope, module, url }) => {
  await loadRemoteScript(scope, url);
  const container = window[scope];
  if (!container) throw new Error(`Remote container ${scope} is not available`);
  if (typeof __webpack_init_sharing__ === "function") {
    await __webpack_init_sharing__("default");
  }
  if (!container.__tremInitialized) {
    const shareScope =
      typeof __webpack_share_scopes__ === "undefined" ? {} : __webpack_share_scopes__.default || {};
    await container.init(shareScope);
    container.__tremInitialized = true;
  }
  const factory = await container.get(module);
  return factory();
};
const TrehubApp = React.lazy(() =>
  loadFederatedModule({
    scope: "trehub",
    module: "./App",
    url: normalizeRemoteEntry(
      process.env.REACT_APP_TREHUB_REMOTE_ENTRY,
      process.env.REACT_APP_TREHUB_URL,
      "http://localhost:3008",
    ),
  }).then((module) => ({ default: module.default || module.TrehubApp })),
);
const REMOTE_RENDERERS = Object.freeze({ trevio: TrevioApp, trevista: TrevistaApp, trehub: TrehubApp });
const USER_PROFILE_UPDATED_EVENT = "USER_PROFILE_UPDATED";
const fetchShellConfiguration = ({ force = false } = {}) =>
  Promise.all([
    fetchData("/sidebar-config", force ? { params: { refresh: Date.now() } } : {}),
    fetchData("/app-header-config", force ? { params: { refresh: Date.now() } } : {}),
    fetchData("/navigation-config", force ? { params: { refresh: Date.now() } } : {}),
  ]);

class RemoteBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This section is temporarily unavailable"
          description="The rest of your dashboard is still available. Return home and continue working."
          retry={this.props.onRecover}
          retryText="Return home"
        />
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({
  children,
  onContinueAsGuest,
  allowGuest = false,
  suppressPrompt = false,
  returnTo,
}) {
  const { loading, session } = useAppShellConfig();

  if (loading) return <Preloader variant="stack" count={3} label="Loading account" />;

  if (!session?.isAuthenticated && !allowGuest) {
    if (suppressPrompt) return null;
    const authUrl = process.env.REACT_APP_AUTH_APP_URL || "";
    const resolvedReturnTo = returnTo || `${window.location.origin}/?tab=overview`;

    if (!authUrl) {
      return (
        <LoginPrompt
          onContinueAsGuest={onContinueAsGuest}
          title="Explore TravelsTREM"
          description="Authentication is unavailable, but you can continue as a guest to explore trips and tours."
        />
      );
    }

    return (
      <LoginPrompt
        onContinueAsGuest={onContinueAsGuest}
        onLogin={() => {
          if (!checkRateLimit("login-attempt", 5, 300000)) {
            console.warn("[Security] Too many login attempts. Please wait.");
            return;
          }
          window.location.assign(
            buildGlobalAuthUrl({ app: "app-shell", returnTo: resolvedReturnTo }),
          );
        }}
      />
    );
  }

  return children;
}

function AppShell() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, session } = useAppShellConfig();
  const { theme, toggleTheme } = useTheme();
  const notificationInbox = useNotificationInbox({
    loadInbox: async ({ limit = 6 } = {}) => (await fetchData("/tenancy/notifications", { params: { limit } })).componentData?.data,
    readInboxItem: (id) => fetchData(`/tenancy/notifications/${id}/read`, { method: "PATCH" }),
    readAllInboxItems: () => fetchData("/tenancy/notifications/read-all", { method: "PATCH" }),
  });
  const loadNotifications = notificationInbox.load;
  const baseUser = session?.user || null;
  const [profileUserPatch, setProfileUserPatch] = useState(null);
  const user = useMemo(
    () => (baseUser ? { ...baseUser, ...(profileUserPatch || {}) } : profileUserPatch),
    [baseUser, profileUserPatch],
  );
  const [sidebarConfig, setSidebarConfig] = useState({});
  const [appHeaderConfig, setAppHeaderConfig] = useState({});
  const [navigationConfig, setNavigationConfig] = useState(() =>
    normalizeNavigationConfig(FALLBACK_NAVIGATION_CONFIG),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [guestMode, setGuestMode] = useState(() => isGuestSession());
  const [authPromptDismissed, setAuthPromptDismissed] = useState(false);
  const [primaryActionOpen, setPrimaryActionOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openArticleTitle, setOpenArticleTitle] = useState("");

  const applyShellConfiguration = useCallback(
    ([sidebarResponse, headerResponse, navigationResponse]) => {
      setSidebarConfig(sidebarResponse?.componentData || {});
      setAppHeaderConfig(headerResponse?.componentData || {});
      const serverNavigationConfig = navigationResponse?.componentData || FALLBACK_NAVIGATION_CONFIG;
      const fallbackNotificationDestination = FALLBACK_NAVIGATION_CONFIG.destinations.find(
        (item) => item.id === "notifications",
      );
      const destinations = Array.isArray(serverNavigationConfig.destinations)
        ? serverNavigationConfig.destinations
        : [];
      setNavigationConfig(
        normalizeNavigationConfig(
          destinations.some((item) => item?.id === "notifications")
            ? serverNavigationConfig
            : { ...serverNavigationConfig, destinations: [...destinations, fallbackNotificationDestination] },
        ),
      );
    },
    [],
  );

  useEffect(() => {
    setProfileUserPatch(null);
  }, [baseUser?.id, baseUser?._id, baseUser?.email]);

  useEffect(() => {
    const onProfileUpdated = (event) => {
      const nextUser = event?.detail?.user;
      if (!nextUser || typeof nextUser !== "object") return;
      setProfileUserPatch((current) => ({ ...(current || {}), ...nextUser }));
    };
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(USER_PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, []);
  const destination = useMemo(
    () => resolveDestination(navigationConfig, location),
    [location, navigationConfig],
  );
  const selectedTab = destination.tab || searchParams.get("tab") || "overview";
  const activeTab = destination.activeId || selectedTab;
  const selectedBookingRecordRef =
    activeTab === "bookings"
      ? searchParams.get("booking") || searchParams.get("enquiry") || ""
      : "";
  const isRemote = destination.kind === "remote";
  const authReturnTo = resolveAuthReturnTo(destination);
  const isSupportScreen = location.pathname === "/help" || location.pathname.startsWith("/help/");
  const mobileShellPresentation = destination.shellPresentation?.mobile;
  const destinationMobileHeader = mobileShellPresentation?.appHeader;
  const productFilter = searchParams.get("product") || "all";
  const publicDestination = isGuestAccessibleDestination(destination);
  const mobileActionPanel = navigationConfig.mobileActionPanel || {};
  const resolvedMobileActionPanelItems = useMemo(
    () =>
      (mobileActionPanel.items || []).map((item) =>
        item.id === "wishlist" || item.target === "favorites"
          ? {
              ...item,
              id: "support",
              label: "Support",
              icon: "support",
              target: "support",
              activeTargets: ["support"],
            }
          : item,
      ),
    [mobileActionPanel.items],
  );
  const continueAsGuest = useCallback(() => {
    setAuthPromptDismissed(true);
    enableGuestSession();
    setGuestMode(true);
  }, []);
  const requireAuthentication = useCallback(
    ({ returnTo = authReturnTo } = {}) => {
      clearGuestSession();
      window.location.assign(buildGlobalAuthUrl({ app: "app-shell", returnTo }));
    },
    [authReturnTo],
  );

  useEffect(() => {
    setActiveAuthReturnTo(authReturnTo);
  }, [authReturnTo]);

  useEffect(() => {
    if (!session?.isAuthenticated) return;
    clearGuestSession();
    setGuestMode(false);
  }, [session?.isAuthenticated]);

  useEffect(() => {
    if (publicDestination) setAuthPromptDismissed(false);
  }, [publicDestination]);

  const handleNavigation = useCallback(
    (rawIntent) => {
      const result = resolveNavigationIntent(navigationConfig, rawIntent, window.location.origin);
      if (result.type === "internal" || result.type === "internal-path") {
        navigate(result.location, { replace: result.replace });
        return true;
      }
      if (result.type === "external") {
        if (result.target === "_blank") {
          window.open(result.url, "_blank", "noopener,noreferrer");
        } else {
          window.location.assign(result.url);
        }
        return true;
      }
      console.warn(`[Navigation] ${result.reason}`);
      return false;
    },
    [navigate, navigationConfig],
  );

  const handleTabChange = useCallback(
    (target, item = {}) =>
      handleNavigation({
        destination: target,
        targetWindow: item.target,
      }),
    [handleNavigation],
  );

  const mobileNavigationActions = useMemo(
    () =>
      (mobileActionPanel.variant === "mobile-navigation" ? resolvedMobileActionPanelItems : []).map(
        (item) => ({
          id: item.id,
          label: item.label,
          iconLeft: item.icon,
          emphasis: item.emphasis,
          disabled: item.disabled,
          active: item.activeTargets.includes(destination.id),
          onClick:
            item.action === "open-primary-action"
              ? () => setPrimaryActionOpen(true)
              : item.action === "open-profile-menu"
                ? () => setProfileMenuOpen(true)
              : () => handleTabChange(item.target, item),
        }),
      ),
    [destination.id, handleTabChange, mobileActionPanel.variant, resolvedMobileActionPanelItems],
  );
  const showMobileNavigation =
    mobileNavigationActions.length > 0 && mobileShellPresentation?.footer !== "hidden";

  const handleGlobalSearch = useCallback(
    async (query, signal) => {
      const response = await fetchData(appHeaderConfig.search?.endpoint || "/search", {
        params: {
          q: query,
          limit: appHeaderConfig.search?.resultLimit || 6,
        },
        signal,
      });
      if (response?.status !== "success") {
        return { status: response?.status || "error", message: response?.message };
      }
      return {
        status: "success",
        ...(response.componentData?.data || {}),
      };
    },
    [appHeaderConfig.search],
  );

  const handleGlobalSearchSelect = useCallback(
    (result) => {
      handleNavigation({
        destination: result.destination,
        path: result.path,
        params: result.params,
        query: result.query,
        targetWindow: result.target,
      });
    },
    [handleNavigation],
  );

  useEffect(() => {
    let cancelled = false;
    fetchShellConfiguration()
      .then((responses) => {
        if (!cancelled) applyShellConfiguration(responses);
      })
      .catch(() => {
        if (!cancelled) {
          setSidebarConfig({});
          setAppHeaderConfig({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyShellConfiguration]);

  useRealtimeEvent(REALTIME_EVENTS.PRODUCT_CATALOG_UPDATED, () => {
    fetchShellConfiguration({ force: true }).then(applyShellConfiguration).catch(() => null);
  });

  useEffect(() => {
    const onShellNavigation = (event) => {
      const detail = event?.detail || {};
      handleNavigation({
        destination: detail.destination,
        query: detail.query,
        params: detail.params,
        replace: detail.replace,
        targetWindow: detail.target,
      });
    };
    window.addEventListener(SHELL_NAVIGATION_EVENT, onShellNavigation);
    return () => window.removeEventListener(SHELL_NAVIGATION_EVENT, onShellNavigation);
  }, [handleNavigation]);

  useEffect(() => {
    setMobileSidebarOpen(false);
    setDesktopSidebarOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "notifications") loadNotifications({ limit: 50 }).catch(() => null);
  }, [activeTab, loadNotifications]);

  const handleSidebarAction = useCallback(
    async (action) => {
      if (action === "login") {
        requireAuthentication();
        return;
      }
      if (action !== "logout") return;
      clearGuestSession();
      try {
        await fetchData("/auth/logout", { method: "POST" });
      } catch {}
      clearAuthBrowserState({ prefixes: ["appShellTREM", "travelstrem"] });
      window.dispatchEvent(new CustomEvent("USER_LOGOUT", { detail: { reason: "logout" } }));
      emitAuthEvent({ type: "LOGOUT" });
      window.location.replace(
        buildGlobalAuthUrl({
          app: "app-shell",
          returnTo: authReturnTo,
        }),
      );
    },
    [authReturnTo, requireAuthentication],
  );

  const handleHeaderAction = useCallback(
    (action, item = {}) => {
      if (action === "navigate" && item.target) {
        handleTabChange(item.target, item);
        return;
      }
      if (navigationConfig.destinations.some((destinationItem) => destinationItem.id === action)) {
        handleTabChange(action, item);
        return;
      }
      handleSidebarAction(action, item);
    },
    [handleSidebarAction, handleTabChange, navigationConfig.destinations],
  );

  const notificationDestination = useMemo(
    () => navigationConfig.destinations.find((item) => item?.id === "notifications"),
    [navigationConfig.destinations],
  );

  const openNotification = useCallback(
    async (item) => {
      if (!item) return;
      if (!item.readAt) await notificationInbox.markRead(item._id).catch(() => null);
      const target = resolveNotificationLink(item, { portal: "customer" });
      if (target) handleNavigation({ path: target });
    },
    [handleNavigation, notificationInbox],
  );

  const resolvedAppHeaderConfig = useMemo(() => {
    const existingActions = Array.isArray(appHeaderConfig.actions) ? appHeaderConfig.actions : [];
    const actions = existingActions
      .filter((item) => item?.id !== "wishlist")
      .map((item) => ({ ...item, active: item.target === activeTab }));
    const navigationTabs = appHeaderConfig.navigationTabs
      ? {
          ...appHeaderConfig.navigationTabs,
          items: (appHeaderConfig.navigationTabs.items || []).map((item) => ({
            ...item,
            active: (item.activeTargets || [item.target]).includes(activeTab),
          })),
        }
      : null;
    return {
      ...appHeaderConfig,
      navigationTabs,
      notification: {
        enabled: true,
        count: notificationInbox.unread,
        items: notificationInbox.items,
        onItemClick: openNotification,
        onMarkAllRead: notificationInbox.markAllRead,
        onViewAll: notificationDestination
          ? () => handleTabChange(notificationDestination.id)
          : undefined,
      },
      mobile: {
        ...destinationMobileHeader,
        ...(appHeaderConfig.mobile || {}),
      },
      actions: [
        ...actions,
        {
          id: "wishlist",
          label: "Wishlist",
          ariaLabel: "Open wishlist",
          icon: "heart",
          target: "favorites",
          mobileOnly: true,
          active: activeTab === "favorites",
        },
      ],
    };
  }, [
    activeTab,
    appHeaderConfig,
    destinationMobileHeader,
    handleTabChange,
    notificationDestination,
    notificationInbox,
    openNotification,
  ]);

  const shellBreadcrumbItems = useMemo(() => {
    const items = (sidebarConfig.sections || []).flatMap((section) => section.items || []);
    const home = items.find((item) => item.target === "overview" || item.id === "overview");
    const current = items.find(
      (item) => item.target === activeTab || item.id === activeTab || item.target === selectedTab,
    );

    if (!home) return [];
    if (!current || current.id === home.id) return [{ label: home.label }];

    const breadcrumbs = [
      { label: home.label, path: "/?tab=overview" },
      { label: current.label },
    ];

    const openArticleId = activeTab === "articles" ? searchParams.get("article") || "" : "";
    if (openArticleId) {
      return [
        { ...breadcrumbs[0] },
        { ...breadcrumbs[1], path: "/?tab=articles" },
        { label: openArticleTitle || current.label },
      ];
    }

    return selectedBookingRecordRef
      ? [
          { ...breadcrumbs[0] },
          { ...breadcrumbs[1], path: "/?tab=bookings" },
          { label: selectedBookingRecordRef },
        ]
      : breadcrumbs;
  }, [
    activeTab,
    openArticleTitle,
    searchParams,
    selectedBookingRecordRef,
    selectedTab,
    sidebarConfig.sections,
  ]);

  if (loading) {
    return <GlobalLoader visible text="Loading App" />;
  }

  if (!session?.isAuthenticated && !guestMode && !authPromptDismissed) {
    return (
      <div className="dash-auth-only">
        <ProtectedRoute onContinueAsGuest={continueAsGuest} returnTo={authReturnTo}>
          <></>
        </ProtectedRoute>
      </div>
    );
  }

  const RemoteRenderer = REMOTE_RENDERERS[destination.renderer] || null;
  const remoteElement = RemoteRenderer ? <RemoteRenderer embedded userSession={session} /> : null;

  return (
    <div
      className={`dash-layout${sidebarConfig.variant === "top-dropdown" ? " dash-layout--top-dropdown" : ""}${sidebarCollapsed ? " dash-layout--sidebar-collapsed" : ""}${showMobileNavigation ? " dash-layout--mobile-action-panel" : ""}`}
    >
      <SideBar
        config={{
          ...sidebarConfig,
          sections: (sidebarConfig.sections || []).map((section) => ({
            ...section,
            items: (section.items || []).map((item) =>
              item.id === "notifications"
                ? { ...item, indicator: notificationInbox.unread > 0 }
                : item.id === "login"
                  ? { ...item, hide: Boolean(session?.isAuthenticated) }
                : item.id === "logout"
                  ? { ...item, hide: !session?.isAuthenticated }
                  : item,
            ),
          })),
        }}
        activeId={activeTab}
        user={user}
        mobileOpen={mobileSidebarOpen}
        desktopOpen={desktopSidebarOpen}
        collapsed={sidebarCollapsed}
        onNavigate={handleTabChange}
        onAction={handleSidebarAction}
        onClose={() => {
          setMobileSidebarOpen(false);
          setDesktopSidebarOpen(false);
        }}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className="dash-main">
        <AppHeader
          config={{
            ...resolvedAppHeaderConfig,
            brand: sidebarConfig.brand || resolvedAppHeaderConfig.brand,
            navigation: {
              ...(sidebarConfig.topDropdown || {}),
              variant: sidebarConfig.variant,
            },
            user: {
              ...(resolvedAppHeaderConfig.user || {}),
              variant: "outlined",
            },
          }}
          user={user}
          theme={theme}
          sidebarCollapsed={sidebarCollapsed}
          onToggleTheme={toggleTheme}
          onAction={handleHeaderAction}
          onSearch={handleGlobalSearch}
          onSearchSelect={handleGlobalSearchSelect}
          onLogoClick={() => handleNavigation({ destination: "overview" })}
          menuOpen={mobileSidebarOpen}
          onMenuToggle={() => setMobileSidebarOpen((open) => !open)}
          desktopNavigationOpen={desktopSidebarOpen}
          onDesktopNavigationToggle={() => setDesktopSidebarOpen((open) => !open)}
          primaryActionOpen={primaryActionOpen}
          onPrimaryActionOpenChange={setPrimaryActionOpen}
          onPrimaryActionSelect={(item) => handleTabChange(item.target, item)}
          userMenuOpen={profileMenuOpen}
          onUserMenuOpenChange={setProfileMenuOpen}
        />

        {!isRemote &&
        !isSupportScreen &&
        activeTab !== "overview" &&
        shellBreadcrumbItems.length ? (
          <div className="dash-shell-breadcrumb">
            <Breadcrumbs items={shellBreadcrumbItems} />
          </div>
        ) : null}

        <div
          data-scroll-root
          className={`dash-content${isRemote ? " dash-content--remote" : ""}${isSupportScreen ? " dash-content--support" : ""}${activeTab === "overview" ? " dash-content--overview dash-content--home" : ""}`}
        >
          <ProtectedRoute
            allowGuest={guestMode}
            suppressPrompt={authPromptDismissed}
            onContinueAsGuest={continueAsGuest}
            returnTo={authReturnTo}
          >
            <RemoteBoundary
              resetKey={`${location.pathname}${location.search}`}
              onRecover={() => handleTabChange("overview")}
            >
              {isSupportScreen ? (
                <SupportRoutes
                  isAuthenticated={Boolean(session?.isAuthenticated)}
                  onRequireAuthentication={requireAuthentication}
                />
              ) : activeTab === "notifications" ? (
                <section className="dash-notifications" aria-label="Notifications">
                  {notificationInbox.items.length ? notificationInbox.items.map((item) => (
                    <button key={item._id} type="button" className={item.readAt ? "" : "is-unread"} onClick={() => openNotification(item)}>
                      <strong>{item.title || "Notification"}</strong>
                      {item.message ? <span>{item.message}</span> : null}
                      {item.createdAt ? <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time> : null}
                    </button>
                  )) : (
                    <NoDataFound
                      icon="bell"
                      title="No notifications"
                      description="You are all caught up."
                    />
                  )}
                </section>
              ) : remoteElement ? (
                <Suspense
                  fallback={
                    <Preloader variant="grid" count={4} label="Loading customer product" />
                  }
                >
                  <Routes>
                    {(destination.patterns || []).map((pattern) => (
                      <Route key={pattern} path={pattern} element={remoteElement} />
                    ))}
                    <Route path="*" element={remoteElement} />
                  </Routes>
                </Suspense>
              ) : (
                <Suspense
                  fallback={<Preloader variant="stack" count={3} label="Loading page" />}
                >
                  <AppShellPage
                    productFilter={productFilter}
                    activeTab={selectedTab}
                    onTabChange={handleTabChange}
                    onArticleTitleChange={setOpenArticleTitle}
                  />
                </Suspense>
              )}
            </RemoteBoundary>
          </ProtectedRoute>
          {activeTab === "overview" && !isRemote && !isSupportScreen && appHeaderConfig.footer ? (
            <AppFooter config={appHeaderConfig.footer} className="dash-app-footer" />
          ) : null}
        </div>
      </div>

      {showMobileNavigation ? (
        <FloatingActionBar
          variant={mobileActionPanel.variant}
          actions={mobileNavigationActions}
          sheetTitle={mobileActionPanel.ariaLabel}
          hideOnDesktop
        />
      ) : null}
    </div>
  );
}

export default function App() {
  // Backend-authored realtime toasts (e.g. enquiry created confirmation).
  useEffect(() => initRealtimeNotifications(), []);

  return (
    <ThemeProvider>
      <AppShellProvider>
        <RealtimeProvider>
          <Toaster />
          <SecurityMonitor>
            <ScrollToTop />
            <Routes>
              <Route path="/*" element={<AppShell />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SecurityMonitor>
        </RealtimeProvider>
      </AppShellProvider>
    </ThemeProvider>
  );
}
