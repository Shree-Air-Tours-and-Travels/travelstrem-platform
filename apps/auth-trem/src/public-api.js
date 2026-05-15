export { default as AuthPage } from "./AuthPage.jsx";
export { default as AuthTremApp } from "./App.jsx";
export { createAuthService, createAuthApi } from "./services.js";
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
