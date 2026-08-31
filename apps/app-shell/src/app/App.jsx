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
  Breadcrumbs,
  ErrorState,
  FloatingActionBar,
  GlobalLoader,
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

const TrevistaApp = React.lazy(() => import("trevista/App"));
const TrevioApp = React.lazy(() => import("trevio/App"));
const REMOTE_RENDERERS = Object.freeze({ trevio: TrevioApp, trevista: TrevistaApp });
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
          title="This product is temporarily unavailable"
          description="The customer shell could not load this product. Please retry after its service is running."
          error={this.state.error?.message}
          retry={() => window.location.reload()}
          retryText="Retry"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [guestMode, setGuestMode] = useState(() => isGuestSession());
  const [authPromptDismissed, setAuthPromptDismissed] = useState(false);
  const [primaryActionOpen, setPrimaryActionOpen] = useState(false);

  const applyShellConfiguration = useCallback(
    ([sidebarResponse, headerResponse, navigationResponse]) => {
      setSidebarConfig(sidebarResponse?.componentData || {});
      setAppHeaderConfig(headerResponse?.componentData || {});
      setNavigationConfig(
        normalizeNavigationConfig(
          navigationResponse?.componentData || FALLBACK_NAVIGATION_CONFIG,
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
    if (!publicDestination) navigate("/?tab=overview&guest=1", { replace: true });
  }, [navigate, publicDestination]);
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
  }, [activeTab]);

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

  const resolvedAppHeaderConfig = useMemo(() => {
    const existingActions = Array.isArray(appHeaderConfig.actions) ? appHeaderConfig.actions : [];
    const actions = existingActions.filter((item) => item?.id !== "wishlist");
    return {
      ...appHeaderConfig,
      mobile: destinationMobileHeader,
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
  }, [activeTab, appHeaderConfig, destinationMobileHeader]);

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
    return selectedBookingRecordRef
      ? [
          { ...breadcrumbs[0] },
          { ...breadcrumbs[1], path: "/?tab=bookings" },
          { label: selectedBookingRecordRef },
        ]
      : breadcrumbs;
  }, [activeTab, selectedBookingRecordRef, selectedTab, sidebarConfig.sections]);

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
      className={`dash-layout${sidebarCollapsed ? " dash-layout--sidebar-collapsed" : ""}${showMobileNavigation ? " dash-layout--mobile-action-panel" : ""}`}
    >
      <SideBar
        config={sidebarConfig}
        activeId={activeTab}
        user={user}
        mobileOpen={mobileSidebarOpen}
        collapsed={sidebarCollapsed}
        onNavigate={handleTabChange}
        onAction={handleSidebarAction}
        onClose={() => setMobileSidebarOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className="dash-main">
        <AppHeader
          config={{
            ...resolvedAppHeaderConfig,
            brand: sidebarConfig.brand || resolvedAppHeaderConfig.brand,
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
          primaryActionOpen={primaryActionOpen}
          onPrimaryActionOpenChange={setPrimaryActionOpen}
          onPrimaryActionSelect={(item) => handleTabChange(item.target, item)}
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
          className={`dash-content${isRemote ? " dash-content--remote" : ""}${isSupportScreen ? " dash-content--support" : ""}`}
        >
          <ProtectedRoute
            allowGuest={publicDestination && guestMode}
            suppressPrompt={authPromptDismissed}
            onContinueAsGuest={continueAsGuest}
            returnTo={authReturnTo}
          >
            <RemoteBoundary resetKey={`${location.pathname}${location.search}`}>
              {isSupportScreen ? (
                <SupportRoutes />
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
                  />
                </Suspense>
              )}
            </RemoteBoundary>
          </ProtectedRoute>
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
