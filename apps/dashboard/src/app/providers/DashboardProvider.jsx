import React from "react";
import { initApp } from "../../core/initApp";
import { clearUserSessionCache } from "../../services/userSession";
import { clearCsrfToken } from "../../services/security";
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

  const loadSession = React.useCallback(async ({ forceSession = false, _retryCount = 0 } = {}) => {
    if (forceSession) {
      clearUserSessionCache();
      clearCsrfToken();
      initOnceRef.current = null;
    }

    if (initOnceRef.current) return initOnceRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 1000;

    const attempt = async (retryCount) => {
      try {
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
      } catch (error) {
        console.warn(`[DashboardProvider] initApp failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error?.response?.data?.message || error?.message || error);

        if (retryCount < MAX_RETRIES) {
          initOnceRef.current = null;
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retryCount + 1)));
          return attempt(retryCount + 1);
        }

        setState({
          loading: false,
          error: error?.message || "init-app-failed",
          session: DEFAULT_SESSION,
        });
      }
    };

    initOnceRef.current = attempt(_retryCount);
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
