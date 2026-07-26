import React from "react";
import { initApp } from "../../core/initApp";
import { clearUserSessionCache } from "../../services/userSession";
import {
  emit,
  registerSessionCacheClearer,
} from "@packages/trem-events";

const AUTH_STORAGE_PREFIX = "dashboardTREM";
const SHARED_STORAGE_PREFIX = "travelstrem";

const DEFAULT_SESSION = {
  user: null,
  permissions: ["public"],
  isAuthenticated: false,
  flags: { role: "public" },
};

function persistToken(session) {
  try {
    const token = session?.token;
    if (!token) return;
    localStorage.setItem(`${AUTH_STORAGE_PREFIX}:token`, token);
    localStorage.setItem(`${SHARED_STORAGE_PREFIX}:token`, token);
  } catch {}
}

const DashboardConfigContext = React.createContext({
  loading: true,
  error: null,
  session: DEFAULT_SESSION,
  reload: () => Promise.resolve(),
});

export function DashboardProvider({ children }) {
  const initOnceRef = React.useRef(null);
  const sessionRef = React.useRef(DEFAULT_SESSION);
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    session: DEFAULT_SESSION,
  });

  React.useEffect(() => {
    registerSessionCacheClearer(clearUserSessionCache);
  }, []);

  const loadSession = React.useCallback(async ({ forceSession = false } = {}) => {
    if (forceSession) {
      clearUserSessionCache();
      initOnceRef.current = null;
    }

    if (initOnceRef.current) return initOnceRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));

    initOnceRef.current = (async () => {
      const { session } = await initApp({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });

      const resolved = session || DEFAULT_SESSION;
      persistToken(resolved);
      setState({
        loading: false,
        error: null,
        session: resolved,
      });
      sessionRef.current = resolved;
    })().catch((error) => {
      console.warn("[DashboardProvider] initApp failed:", error?.message || error);
      setState({
        loading: false,
        error: error?.message || "init-app-failed",
        session: DEFAULT_SESSION,
      });
    });

    return initOnceRef.current;
  }, []);

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  const value = React.useMemo(
    () => ({
      ...state,
      reload: loadSession,
    }),
    [loadSession, state]
  );

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
}

export const useDashboardConfig = () => React.useContext(DashboardConfigContext);
