import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader, ErrorState, GlobalLoader, ScrollToTop, SideBar, ThemeProvider, useTheme } from "@packages/trem-ui";
import { AppShellProvider, useAppShellConfig } from "./providers/AppShellProvider";
import AppShellPage from "../features/app-shell/AppShell";
import { buildGlobalAuthUrl, fetchData, SHELL_NAVIGATION_EVENT } from "@packages/trem-utils";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import LoginPrompt from "../components/LoginPrompt";
import SecurityMonitor from "../components/SecurityMonitor";
import { checkRateLimit } from "../services/security";
import { clearGuestSession, enableGuestSession, isGuestSession } from "../services/guestSession";
import {
  FALLBACK_NAVIGATION_CONFIG,
  normalizeNavigationConfig,
  resolveDestination,
  resolveNavigationIntent,
} from "./routing/navigationRegistry";
import "../styles/global.scss";

const TrevioApp = React.lazy(() => import("trevio/App"));
const TrevistaApp = React.lazy(() => import("trevista/App"));
const EmbeddedBookingEngine = React.lazy(() => import("bookingEngine/EmbeddedApp"));

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

function ProtectedRoute({ children, onContinueAsGuest, allowGuest = false }) {
  const { loading, session } = useAppShellConfig();

  if (loading) return <GlobalLoader visible text="Loading App" />;

  if (!session?.isAuthenticated && !allowGuest) {
    const authUrl = process.env.REACT_APP_AUTH_APP_URL || "";
    const returnTo = window.location.href;

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
      <LoginPrompt onContinueAsGuest={onContinueAsGuest} onLogin={() => {
        if (!checkRateLimit("login-attempt", 5, 300000)) {
          console.warn("[Security] Too many login attempts. Please wait.");
          return;
        }
        window.location.assign(buildGlobalAuthUrl({ app: "app-shell", returnTo }));
      }} />
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
  const user = session?.user || null;
  const [sidebarConfig, setSidebarConfig] = useState({});
  const [appHeaderConfig, setAppHeaderConfig] = useState({});
  const [navigationConfig, setNavigationConfig] = useState(() => normalizeNavigationConfig(FALLBACK_NAVIGATION_CONFIG));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [guestMode, setGuestMode] = useState(() => isGuestSession());

  const destination = useMemo(
    () => resolveDestination(navigationConfig, location),
    [location, navigationConfig],
  );
  const selectedTab = destination.tab || searchParams.get("tab") || "overview";
  const activeTab = destination.activeId || selectedTab;
  const isRemote = destination.kind === "remote";
  const isBookingsScreen = destination.renderer === "app-shell" && activeTab === "bookings";
  const isBookingDetail = isBookingsScreen && Boolean(searchParams.get("bookingId"));
  const productFilter = searchParams.get("product") || "all";
  const publicDestination = ["overview", "trevista", "trevio", "booking-engine"].includes(destination.id);
  const continueAsGuest = useCallback(() => {
    enableGuestSession();
    setGuestMode(true);
    navigate("/?tab=overview&guest=1");
  }, [navigate]);
  const requireAuthentication = useCallback(({ returnTo = window.location.href } = {}) => {
    clearGuestSession();
    window.location.assign(buildGlobalAuthUrl({ app: "app-shell", returnTo }));
  }, []);

  useEffect(() => {
    if (!session?.isAuthenticated) return;
    clearGuestSession();
    setGuestMode(false);
  }, [session?.isAuthenticated]);

  const handleNavigation = useCallback((rawIntent) => {
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
  }, [navigate, navigationConfig]);

  const handleTabChange = useCallback((target, item = {}) => (
    handleNavigation({
      destination: target,
      targetWindow: item.target,
    })
  ), [handleNavigation]);

  const handleGlobalSearch = useCallback(async (query, signal) => {
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
  }, [appHeaderConfig.search]);

  const handleGlobalSearchSelect = useCallback((result) => {
    handleNavigation({
      destination: result.destination,
      path: result.path,
      params: result.params,
      query: result.query,
      targetWindow: result.target,
    });
  }, [handleNavigation]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchData("/sidebar-config"),
      fetchData("/app-header-config"),
      fetchData("/navigation-config"),
    ])
      .then(([sidebarResponse, headerResponse, navigationResponse]) => {
        if (!cancelled) {
          setSidebarConfig(sidebarResponse?.componentData || {});
          setAppHeaderConfig(headerResponse?.componentData || {});
          setNavigationConfig(normalizeNavigationConfig(navigationResponse?.componentData || FALLBACK_NAVIGATION_CONFIG));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSidebarConfig({});
          setAppHeaderConfig({});
        }
      });
    return () => { cancelled = true; };
  }, []);

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

  const handleSidebarAction = useCallback(async (action) => {
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
    window.location.replace(buildGlobalAuthUrl({
      app: "app-shell",
      returnTo: `${window.location.origin}/?tab=overview`,
    }));
  }, [requireAuthentication]);

  if (loading || (!session?.isAuthenticated && !guestMode)) {
    return (
      <div className="dash-auth-only">
        <ProtectedRoute onContinueAsGuest={continueAsGuest}>
          <></>
        </ProtectedRoute>
      </div>
    );
  }

  const remoteElement = destination.renderer === "trevio"
    ? <TrevioApp embedded userSession={session} basename={destination.path} />
    : destination.renderer === "trevista"
      ? <TrevistaApp embedded userSession={session} />
      : destination.renderer === "bookingEngine"
        ? <EmbeddedBookingEngine userSession={session} onRequireAuth={requireAuthentication} />
        : null;

  return (
    <div className={`dash-layout${sidebarCollapsed ? " dash-layout--sidebar-collapsed" : ""}`}>
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
            ...appHeaderConfig,
            brand: sidebarConfig.brand || appHeaderConfig.brand,
          }}
          user={user}
          theme={theme}
          sidebarCollapsed={sidebarCollapsed}
          onToggleTheme={toggleTheme}
          onAction={handleSidebarAction}
          onSearch={handleGlobalSearch}
          onSearchSelect={handleGlobalSearchSelect}
          onLogoClick={() => handleNavigation({ destination: "overview" })}
          menuOpen={mobileSidebarOpen}
          onMenuToggle={() => setMobileSidebarOpen((open) => !open)}
        />

        <div data-scroll-root className={`dash-content${isBookingsScreen ? " dash-content--bookings" : ""}${isBookingDetail ? " dash-content--booking-detail" : ""}${isRemote ? " dash-content--remote" : ""}`}>
          <ProtectedRoute allowGuest={publicDestination && guestMode}>
            <RemoteBoundary resetKey={`${location.pathname}${location.search}`}>
              {remoteElement ? (
                <Suspense fallback={<GlobalLoader visible text="Loading customer product" />}>
                  <Routes>
                    {(destination.patterns || []).map((pattern) => (
                      <Route key={pattern} path={pattern} element={remoteElement} />
                    ))}
                    <Route path="*" element={remoteElement} />
                  </Routes>
                </Suspense>
              ) : (
                <Suspense fallback={<GlobalLoader visible text="Loading customer product" />}>
                  <AppShellPage productFilter={productFilter} activeTab={selectedTab} onTabChange={handleTabChange} />
                </Suspense>
              )}
            </RemoteBoundary>
          </ProtectedRoute>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShellProvider>
        <SecurityMonitor>
          <ScrollToTop />
          <Routes>
            <Route path="/*" element={<AppShell />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SecurityMonitor>
      </AppShellProvider>
    </ThemeProvider>
  );
}
