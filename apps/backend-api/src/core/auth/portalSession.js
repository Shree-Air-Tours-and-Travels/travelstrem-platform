export const PORTAL_SESSION_HEADER = "x-travelstrem-portal";
export const PORTAL_SCOPES = Object.freeze({
  CUSTOMER: "customer",
  ADMIN: "admin",
  PARTNER: "partner",
});

const aliases = Object.freeze({
  customer: PORTAL_SCOPES.CUSTOMER,
  dashboard: PORTAL_SCOPES.CUSTOMER,
  app: PORTAL_SCOPES.CUSTOMER,
  appshell: PORTAL_SCOPES.CUSTOMER,
  "app-shell": PORTAL_SCOPES.CUSTOMER,
  admin: PORTAL_SCOPES.ADMIN,
  admintrem: PORTAL_SCOPES.ADMIN,
  partner: PORTAL_SCOPES.PARTNER,
  partnertrem: PORTAL_SCOPES.PARTNER,
  agent: PORTAL_SCOPES.PARTNER,
});

export const normalizePortalScope = (value) => aliases[String(value || "").trim().toLowerCase()] || PORTAL_SCOPES.CUSTOMER;

export const getPortalScope = (req) => normalizePortalScope(req?.headers?.[PORTAL_SESSION_HEADER]);

const isProduction = String(process.env.NODE_ENV || "development").trim().toLowerCase() === "production";
const sharedCookieDomain = String(process.env.AUTH_COOKIE_DOMAIN || "").trim();
const useSharedCookieDomain = isProduction && Boolean(sharedCookieDomain);

export const getPortalCookieNames = (reqOrScope) => {
  const scope = typeof reqOrScope === "string" ? normalizePortalScope(reqOrScope) : getPortalScope(reqOrScope);
  const prefix = isProduction && !useSharedCookieDomain ? "__Host-" : "";
  return {
    scope,
    access: `${prefix}trem-${scope}-token`,
    refresh: `${prefix}trem-${scope}-refresh-token`,
  };
};

export const portalCookieOptions = ({ maxAge = 0 } = {}) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction && !useSharedCookieDomain ? "strict" : "lax",
  path: "/",
  ...(useSharedCookieDomain ? { domain: sharedCookieDomain } : {}),
  maxAge,
});

export const readPortalAccessToken = (req) => {
  const { access } = getPortalCookieNames(req);
  return req?.cookies?.[access] || null;
};

export const readPortalRefreshToken = (req) => {
  const { refresh } = getPortalCookieNames(req);
  return req?.cookies?.[refresh] || null;
};
