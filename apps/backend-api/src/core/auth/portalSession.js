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

export const normalizePortalScope = (value) =>
    aliases[
        String(value || "")
            .trim()
            .toLowerCase()
    ] || PORTAL_SCOPES.CUSTOMER;

export const getPortalScope = (req) => normalizePortalScope(req?.headers?.[PORTAL_SESSION_HEADER]);

/**
 * Environment tiers:
 * - production: hardened cookies (Secure + __Host-/Strict, or shared domain).
 * - development: local machines; Lax over plain http keeps LAN device testing working.
 * - test: HOSTED non-production (e.g. api-*.onrender.com behind
 *   auth-dev.travelstrem.com). Frontend and API sit on different sites there,
 *   and browsers discard Strict/Lax cookies on cross-site XHR — which surfaced
 *   as "login succeeds but /session stays unauthenticated". This tier therefore
 *   defaults to SameSite=None; Secure without the __Host- prefix.
 */
const rawNodeEnv = String(process.env.NODE_ENV || "development")
    .trim()
    .toLowerCase();
export const ENV_TIER =
    rawNodeEnv === "production" ? "production" : rawNodeEnv === "test" ? "test" : "development";
const isProductionLike = ENV_TIER === "production" || ENV_TIER === "test";
const isTestTier = ENV_TIER === "test";

const sharedCookieDomain = String(process.env.AUTH_COOKIE_DOMAIN || "").trim();
const useSharedCookieDomain = isProductionLike && Boolean(sharedCookieDomain);

/**
 * Optional explicit override for production deployments whose API lives on a
 * different site than the frontends. Set AUTH_COOKIE_SAMESITE=none to emit
 * SameSite=None; Secure cookies instead of __Host-/Strict.
 */
const configuredSameSite = String(process.env.AUTH_COOKIE_SAMESITE || "")
    .trim()
    .toLowerCase();
const useCrossSiteCookies = ["none", "cross-site"].includes(configuredSameSite);

const cookieSameSite =
    useCrossSiteCookies || isTestTier
        ? "none"
        : isProductionLike && !useSharedCookieDomain
          ? "strict"
          : "lax";

export const getPortalCookieNames = (reqOrScope) => {
    const scope =
        typeof reqOrScope === "string"
            ? normalizePortalScope(reqOrScope)
            : getPortalScope(reqOrScope);
    const prefix =
        isProductionLike && !useSharedCookieDomain && cookieSameSite === "strict" ? "__Host-" : "";
    return {
        scope,
        access: `${prefix}trem-${scope}-token`,
        refresh: `${prefix}trem-${scope}-refresh-token`,
    };
};

export const portalCookieOptions = ({ maxAge } = {}) => ({
    httpOnly: true,
    // SameSite=None requires the Secure attribute per spec.
    secure: cookieSameSite === "none" ? true : isProductionLike,
    sameSite: cookieSameSite,
    path: "/",
    ...(useSharedCookieDomain ? { domain: sharedCookieDomain } : {}),
    ...(maxAge === undefined ? {} : { maxAge }),
});

export const readPortalAccessToken = (req) => {
    const { access } = getPortalCookieNames(req);
    return req?.cookies?.[access] || null;
};

export const readPortalRefreshToken = (req) => {
    const { refresh } = getPortalCookieNames(req);
    return req?.cookies?.[refresh] || null;
};
