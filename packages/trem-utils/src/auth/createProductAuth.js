import { buildGlobalAuthUrl } from "./globalAuth.js";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";

const POST_JSON = (url) =>
  fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

export const createProductAuth = ({
  app,
  apiBase,
  emit,
  registerSessionCacheClearer,
  clearUserSessionCache,
}) => {
  if (typeof registerSessionCacheClearer === "function" && clearUserSessionCache) {
    registerSessionCacheClearer(clearUserSessionCache);
  }

  const logout = async (headerConfig) => {
    const logoutConfig = headerConfig?.authActions?.logout || {};
    const redirectTo = logoutConfig.redirectTo || `/${app}`;

    await POST_JSON(`${apiBase}/auth/logout`);

    clearAuthBrowserState({ prefixes: ["travelstrem"] });
    emit("USER_LOGOUT", { source: "header" }, { skipController: true });
    emitAuthEvent({ type: "LOGOUT" });

    clearUserSessionCache?.();
    window.location.replace(redirectTo);
  };

  const buildAuthAction = (headerConfig, session) => {
    if (session?.isAuthenticated) {
      return {
        label: headerConfig?.authActions?.logout?.label || "Sign out",
        onClick: () => logout(headerConfig),
        variant: "secondary",
      };
    }
    return {
      label: headerConfig?.authActions?.login?.label || "Sign in",
      href: buildGlobalAuthUrl({
        app,
        returnTo: typeof window !== "undefined" ? window.location.href : "",
      }),
      variant: "primary",
    };
  };

  return { logout, buildAuthAction };
};
