import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { initApp } from "../../core/initApp";
import { getHeaderConfig } from "../../services/configService";
import { clearUserSessionCache } from "../../services/userSession";
import {
  clearAuthBrowserState,
  subscribeAuthEvents,
  useSessionInactivity,
} from "@packages/trem-auth-core";
import { applyDocumentBranding, buildGlobalAuthUrl } from "@packages/trem-utils";
import { SessionTimeoutModal, ThemeProvider } from "@packages/trem-ui";
import apiService from "../../services/apiService";
import {
  createPortalEventController,
  emit,
  registerEventHandler,
  registerSessionCacheClearer,
} from "@packages/trem-events";

const DEFAULT_SESSION = {
  user: null,
  permissions: ["public"],
  isAuthenticated: false,
  flags: { role: "public" },
};

const adminRoles = ["admin", "agent"];

export const isAllowedAdminRole = (session) => adminRoles.includes(session?.user?.role);

const DEFAULT_HEADER_CONFIG = {
  brand: { label: "AdminTREM", homePath: "/admin/tours" },
  leftSection: { welcome: true, showStatus: true },
  menu: [
    { id: "adminTours", label: "Tours", path: "/admin/tours", access: "roles", roles: adminRoles },
    { id: "agentTours", label: "Agent", path: "/agent/tours", access: "roles", roles: adminRoles },
  ],
  authActions: {
    login: { label: "Login", path: "/login" },
    logout: { label: "Logout" },
  },
  routes: [],
  remotes: {},
  fallbacks: {
    authenticated: "/admin/tours",
    anonymous: "/login",
    unauthorized: "/login",
  },
};

const DEFAULT_PAGE_CONFIG = {
  page: "admin",
  widgets: [],
};

const clearLocalAuthState = () => {
  try {
    clearAuthBrowserState({ prefixes: ["adminTREM"] });
  } catch {}
  clearUserSessionCache();
};

const AdminPortalConfigContext = React.createContext({
  loading: true,
  error: null,
  session: DEFAULT_SESSION,
  userSession: DEFAULT_SESSION,
  headerConfig: DEFAULT_HEADER_CONFIG,
  pageConfig: DEFAULT_PAGE_CONFIG,
  reload: () => Promise.resolve(),
  refreshHeader: () => Promise.resolve(),
  dispatchEvent: () => Promise.resolve(false),
});

const getPortalParams = ({ pathname, search, hash }) => ({
  pathname,
  search,
  hash,
  app: "adminTREM",
});

export function AdminPortalConfigProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initOnceRef = React.useRef(null);
  const latestLocationRef = React.useRef(location);
  const lastHeaderRouteRef = React.useRef("");
  const sessionRef = React.useRef(DEFAULT_SESSION);
  const eventControllerRef = React.useRef(null);
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    session: DEFAULT_SESSION,
    headerConfig: DEFAULT_HEADER_CONFIG,
    pageConfig: DEFAULT_PAGE_CONFIG,
  });
  const [sessionExitBusy, setSessionExitBusy] = React.useState(false);
  const sessionExpired = useSessionInactivity({
    enabled: Boolean(state.session?.isAuthenticated),
    timeoutMs: state.session?.config?.session?.inactivityTimeoutMs,
  });

  React.useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  React.useEffect(() => {
    sessionRef.current = state.session;
  }, [state.session]);

  React.useEffect(() => {
    registerSessionCacheClearer(clearUserSessionCache);
  }, []);

  const refreshHeader = React.useCallback(
    async (nextLocation = latestLocationRef.current, session = sessionRef.current) => {
      const routeKey = `${nextLocation.pathname}${nextLocation.search}${nextLocation.hash}`;
      lastHeaderRouteRef.current = routeKey;
      const params = {
        ...getPortalParams(nextLocation),
        isAuthenticated: session?.isAuthenticated ? "true" : "false",
        app: "adminTREM",
        role: session?.user?.role || "public",
        userName: session?.user?.name || "",
        userEmail: session?.user?.email || "",
      };
      const header = await getHeaderConfig(params);
      applyDocumentBranding(header?.brand, { tenant: Boolean(header?.tenantId) });

      setState((current) => ({
        ...current,
        headerConfig: header || DEFAULT_HEADER_CONFIG,
        pageConfig: header?.pageConfig || current.pageConfig,
      }));

      return header;
    },
    [],
  );

  const loadPortalConfig = React.useCallback(
    async ({ forceSession = false, background = false, location: nextLocation = null } = {}) => {
      const params = getPortalParams(nextLocation || latestLocationRef.current);

      if (forceSession || background) {
        clearUserSessionCache();
        initOnceRef.current = null;
      }

      if (initOnceRef.current) return initOnceRef.current;

      if (!background) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }

      initOnceRef.current = (async () => {
        const { session, header, pageConfig } = await initApp(params);
        applyDocumentBranding(header?.brand, { tenant: Boolean(header?.tenantId) });
        lastHeaderRouteRef.current = `${params.pathname}${params.search}${params.hash}`;

        setState({
          loading: false,
          error: null,
          session: session || DEFAULT_SESSION,
          headerConfig: header || DEFAULT_HEADER_CONFIG,
          pageConfig: pageConfig || DEFAULT_PAGE_CONFIG,
        });
        sessionRef.current = session || DEFAULT_SESSION;
      })().catch((error) => {
        console.warn(
          "[AdminPortalConfig] initApp failed, using shell fallbacks:",
          error?.message || error,
        );
        setState((current) => ({
          ...current,
          loading: false,
          error: error?.message || "init-app-failed",
        }));
      });

      return initOnceRef.current;
    },
    [],
  );

  if (!eventControllerRef.current) {
    eventControllerRef.current = createPortalEventController({
      navigate,
      emit,
      reload: loadPortalConfig,
      getLocation: () => latestLocationRef.current,
      getSession: () => sessionRef.current,
    });
  }

  React.useEffect(() => {
    eventControllerRef.current.configure({
      sessionConfig: state.session?.config || {},
      headerConfig: state.headerConfig || DEFAULT_HEADER_CONFIG,
    });
  }, [state.headerConfig, state.session]);

  React.useEffect(() => {
    const unsubscribe = registerEventHandler((eventName, payload, meta) =>
      eventControllerRef.current.dispatch(eventName, payload, meta),
    );

    return unsubscribe;
  }, []);

  const dispatchEvent = React.useCallback(
    (eventName, payload = {}, meta = {}) =>
      eventControllerRef.current.dispatch(eventName, payload, meta),
    [],
  );

  React.useEffect(() => {
    loadPortalConfig();
  }, [loadPortalConfig]);

  React.useEffect(() => {
    const redirectToLogin = () => {
      clearLocalAuthState();
      setState({
        loading: false,
        error: null,
        session: DEFAULT_SESSION,
        headerConfig: DEFAULT_HEADER_CONFIG,
        pageConfig: DEFAULT_PAGE_CONFIG,
      });
      window.location.replace(buildGlobalAuthUrl({ app: "admin", returnTo: window.location.href }));
    };
    const unsubscribe = subscribeAuthEvents((message) => {
      if (message?.type === "LOGOUT") {
        redirectToLogin();
        return;
      }
      if (message?.type === "LOGIN" || message?.type === "SESSION_CHANGED") {
        loadPortalConfig({ background: true });
      }
    });
    const onWindowLogout = () => redirectToLogin();
    window.addEventListener("USER_LOGOUT", onWindowLogout);
    return () => {
      unsubscribe();
      window.removeEventListener("USER_LOGOUT", onWindowLogout);
    };
  }, [loadPortalConfig]);

  React.useEffect(() => {
    if (state.loading) return;
    const routeKey = `${location.pathname}${location.search}${location.hash}`;
    if (lastHeaderRouteRef.current === routeKey) return;

    refreshHeader(location).catch((error) => {
      console.warn("[AdminPortalConfig] header refresh failed:", error?.message || error);
    });
  }, [location, location.pathname, location.search, location.hash, refreshHeader, state.loading]);

  React.useEffect(() => {
    const refresh = () => loadPortalConfig({ background: true });
    window.addEventListener('focus', refresh);
    window.addEventListener('TENANT_CONFIG_UPDATED', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('TENANT_CONFIG_UPDATED', refresh); };
  }, [loadPortalConfig]);

  const reload = React.useCallback(
    () => loadPortalConfig({ forceSession: true }),
    [loadPortalConfig],
  );

  const value = React.useMemo(
    () => ({
      ...state,
      userSession: state.session,
      reload,
      refreshHeader,
      dispatchEvent,
    }),
    [dispatchEvent, loadPortalConfig, refreshHeader, reload, state],
  );

  const continueToLogin = React.useCallback(async () => {
    setSessionExitBusy(true);
    await apiService.post("/auth/logout").catch(() => null);
    window.dispatchEvent(new CustomEvent("USER_LOGOUT", { detail: { reason: "inactivity" } }));
  }, []);

  return (
    <AdminPortalConfigContext.Provider value={value}>
      <ThemeProvider tenantId={state.headerConfig?.tenantId} tenantTheme={state.headerConfig?.tenantTheme}>{children}</ThemeProvider>
      <SessionTimeoutModal
        open={sessionExpired}
        busy={sessionExitBusy}
        onLogin={continueToLogin}
      />
    </AdminPortalConfigContext.Provider>
  );
}

export const useAdminPortalConfig = () => React.useContext(AdminPortalConfigContext);
