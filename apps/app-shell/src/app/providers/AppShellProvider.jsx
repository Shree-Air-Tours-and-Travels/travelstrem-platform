import React from "react";
import { initApp } from "../../core/initApp";
import { clearUserSessionCache, validateUserSession } from "../../services/userSession";
import { clearCsrfToken } from "../../services/security";
import { clearAuthBrowserState, subscribeAuthEvents } from "@packages/trem-auth-core";
import { buildGlobalAuthUrl } from "@packages/trem-utils";
import { isGuestSession } from "../../services/guestSession";
import { registerSessionCacheClearer } from "@packages/trem-events";

const AUTH_STORAGE_PREFIX = "appShellTREM";
const SHARED_STORAGE_PREFIX = "travelstrem";
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;
const SESSION_FOCUS_STALE_MS = 15 * 1000;

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
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    session: DEFAULT_SESSION,
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

  React.useEffect(() => {
    const redirectToLogin = () => {
      if (!sessionRef.current?.isAuthenticated && isGuestSession()) return;
      clearLocalAuthState();
      setState({ loading: false, error: null, session: DEFAULT_SESSION });
      window.location.replace(
        buildGlobalAuthUrl({
          app: "app-shell",
          returnTo: window.location.href,
        }),
      );
    };
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
  }, [loadSession]);

  React.useEffect(() => {
    let cancelled = false;
    let checking = false;
    let lastCheckedAt = 0;

    const expireSession = () => {
      if (!sessionRef.current?.isAuthenticated) return;
      clearLocalAuthState();
      setState({ loading: false, error: null, session: DEFAULT_SESSION });
      window.dispatchEvent(
        new CustomEvent("USER_LOGOUT", { detail: { reason: "session_expired" } }),
      );
    };

    const checkSession = async ({ force = false } = {}) => {
      if (cancelled || checking || !sessionRef.current?.isAuthenticated) return;
      const now = Date.now();
      if (!force && now - lastCheckedAt < SESSION_FOCUS_STALE_MS) return;
      checking = true;
      lastCheckedAt = now;
      try {
        const session = await validateUserSession({
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        });
        if (cancelled) return;
        if (!session?.isAuthenticated) {
          expireSession();
          return;
        }
        sessionRef.current = session;
        setState((current) => ({ ...current, session }));
      } catch {
        if (!cancelled) expireSession();
      } finally {
        checking = false;
      }
    };

    const onFocus = () => checkSession({ force: false });
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSession({ force: false });
    };

    const interval = window.setInterval(() => checkSession({ force: true }), SESSION_CHECK_INTERVAL_MS);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const reload = React.useCallback(() => loadSession({ background: true }), [loadSession]);

  const value = React.useMemo(
    () => ({
      ...state,
      reload,
    }),
    [reload, state],
  );

  return <AppShellConfigContext.Provider value={value}>{children}</AppShellConfigContext.Provider>;
}

export const useAppShellConfig = () => React.useContext(AppShellConfigContext);
