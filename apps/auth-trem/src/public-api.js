export { default as AuthPage } from "./features/auth/AuthPage.jsx";
export { default as AuthTremApp } from "./app/App.jsx";
export { createAuthService, createAuthApi } from "./services/authService.js";
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
