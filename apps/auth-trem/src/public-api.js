export { default as AuthPage } from "./features/auth/AuthPage.jsx";
export { default as AuthTremApp } from "./app/App.jsx";
export { createAuthApi, createAuthService } from "@packages/trem-auth-core";
export {
  DEFAULT_AUTH_ROLES,
  canAccessAuthRoute,
  clearAuthHeader,
  clearAuthSession,
  createRefreshHandler,
  extractSafeUser,
  extractToken,
  filterRoles,
  getReturnPath,
  getStoredAuthToken,
  hasAuthRole,
  normalizeAuthConfig,
  persistAuthSession,
  setAuthHeader,
  useAuthConfig,
  useAuthFlow,
} from "@packages/trem-auth-core";
