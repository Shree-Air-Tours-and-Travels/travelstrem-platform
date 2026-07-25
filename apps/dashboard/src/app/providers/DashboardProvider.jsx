import React from "react";
import { useLocation } from "react-router-dom";
import { initApp } from "../../core/initApp";
import { clearUserSessionCache } from "../../services/userSession";
import {
  emit,
  registerSessionCacheClearer,
} from "@packages/trem-events";

const DEFAULT_SESSION = {
  user: null,
  permissions: ["public"],
  isAuthenticated: false,
  flags: { role: "public" },
};

const DashboardConfigContext = React.createContext({
  loading: true,
  error: null,
  session: DEFAULT_SESSION,
  reload: () => Promise.resolve(),
});

export function DashboardProvider({ children }) {
  const location = useLocation();
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
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      });

      setState({
        loading: false,
        error: null,
        session: session || DEFAULT_SESSION,
      });
      sessionRef.current = session || DEFAULT_SESSION;
    })().catch((error) => {
      console.warn("[DashboardProvider] initApp failed:", error?.message || error);
      setState({
        loading: false,
        error: error?.message || "init-app-failed",
        session: DEFAULT_SESSION,
      });
    });

    return initOnceRef.current;
  }, [location.pathname, location.search, location.hash]);

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
