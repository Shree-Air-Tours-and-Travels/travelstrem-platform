import { USER_ROLE } from "../constants/index.js";

export const PERMISSIONS = Object.freeze({
  AUTHENTICATED: "authenticated",
  ADMIN: "admin",
  AGENT: "agent",
});

export function hasRole(user, allowedRoles = []) {
  if (!user || !Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;
  return allowedRoles.includes(user.role);
}

export function isAdmin(user) {
  return hasRole(user, [USER_ROLE.ADMIN]);
}

export function isAgent(user) {
  return hasRole(user, [USER_ROLE.AGENT]);
}

export default {
  PERMISSIONS,
  hasRole,
  isAdmin,
  isAgent,
};

