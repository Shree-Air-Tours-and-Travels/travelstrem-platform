import React from "react";
import { initApp } from "../../core/initApp";
import { clearUserSessionCache } from "../../services/userSession";
import { clearCsrfToken } from "../../services/security";
import {
  clearAuthBrowserState,
  subscribeAuthEvents,
  useSessionInactivity,
} from "@packages/trem-auth-core";
import { buildGlobalAuthUrl } from "@packages/trem-utils";
import { SessionTimeoutModal } from "@packages/trem-ui";
import { isGuestSession } from "../../services/guestSession";
import { registerSessionCacheClearer } from "@packages/trem-events";
import apiService from "../../services/apiService";
import { getActiveAuthReturnTo } from "../routing/authReturnDestination";

const AUTH_STORAGE_PREFIX = "appShellTREM";
const SHARED_STORAGE_PREFIX = "travelstrem";
const SESSION_EXIT_REQUEST_TIMEOUT_MS = 2500;
const SESSION_NAVIGATION_FALLBACK_MS = 5000;

const DEFAULT_SESSION = {
  user: null,
  permissions: ["public"],
  isAuthenticated: false,
  flags: { role: "public" },
};

function clearLocalAuthState() {
  try {
    clearAuthBrowserState({ prefixes: [AUTH_STORAGE_PREFIX, SHARED_STORAGE_PREFIX] });
  } catch {}
  clearCsrfToken();
  clearUserSessionCache();
}

const AppShellConfigContext = React.createContext({
  loading: true,
  error: null,
  session: DEFAULT_SESSION,
  reload: () => Promise.resolve(),
});

export function AppShellProvider({ children }) {
  const initOnceRef = React.useRef(null);
  const sessionRef = React.useRef(DEFAULT_SESSION);
  const sessionExitStartedRef = React.useRef(false);
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    session: DEFAULT_SESSION,
  });
  const [sessionExitBusy, setSessionExitBusy] = React.useState(false);
  const sessionExpired = useSessionInactivity({
    enabled: Boolean(state.session?.isAuthenticated),
    timeoutMs: state.session?.config?.session?.inactivityTimeoutMs,
  });

  React.useEffect(() => {
    registerSessionCacheClearer(clearUserSessionCache);
  }, []);

  const loadSession = React.useCallback(
    async ({ forceSession = false, background = false, _retryCount = 0 } = {}) => {
      if (forceSession || background) {
        clearUserSessionCache();
        clearCsrfToken();
        initOnceRef.current = null;
      }

      if (initOnceRef.current) return initOnceRef.current;

      if (!background) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }

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
          setState({
            loading: false,
            error: null,
            session: resolved,
          });
          sessionRef.current = resolved;
        } catch (error) {
          console.warn(
            `[AppShellProvider] initApp failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`,
            error?.response?.data?.message || error?.message || error,
          );

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
    },
    [],
  );

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  const redirectToLogin = React.useCallback(() => {
    if (!sessionRef.current?.isAuthenticated && isGuestSession()) return;
    clearLocalAuthState();
    sessionRef.current = DEFAULT_SESSION;
    setState({ loading: false, error: null, session: DEFAULT_SESSION });
    window.setTimeout(() => window.location.reload(), SESSION_NAVIGATION_FALLBACK_MS);
    window.location.replace(
      buildGlobalAuthUrl({
        app: "app-shell",
        returnTo: getActiveAuthReturnTo(),
      }),
    );
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeAuthEvents((message) => {
      if (message?.type === "LOGOUT") {
        redirectToLogin();
        return;
      }
      if (message?.type === "LOGIN" || message?.type === "SESSION_CHANGED") {
        loadSession({ background: true });
      }
    });
    const onWindowLogout = () => {
      if (!sessionRef.current?.isAuthenticated && isGuestSession()) return;
      redirectToLogin();
    };
    window.addEventListener("USER_LOGOUT", onWindowLogout);
    return () => {
      unsubscribe();
      window.removeEventListener("USER_LOGOUT", onWindowLogout);
    };
  }, [loadSession, redirectToLogin]);

  const reload = React.useCallback(() => loadSession({ background: true }), [loadSession]);

  const value = React.useMemo(
    () => ({
      ...state,
      reload,
    }),
    [reload, state],
  );

  const continueToLogin = React.useCallback(async () => {
    if (sessionExitStartedRef.current) return;
    sessionExitStartedRef.current = true;
    setSessionExitBusy(true);
    await Promise.race([
      apiService.post("/auth/logout").catch(() => null),
      new Promise((resolve) => window.setTimeout(resolve, SESSION_EXIT_REQUEST_TIMEOUT_MS)),
    ]);
    redirectToLogin();
  }, [redirectToLogin]);

  React.useEffect(() => {
    if (sessionExpired) continueToLogin();
  }, [continueToLogin, sessionExpired]);

  return (
    <AppShellConfigContext.Provider value={value}>
      {children}
      <SessionTimeoutModal
        open={sessionExpired}
        busy={sessionExitBusy}
        onLogin={continueToLogin}
      />
    </AppShellConfigContext.Provider>
  );
}

export const useAppShellConfig = () => React.useContext(AppShellConfigContext);
