import config from "../../../config/index.js";
import { normalizePortalScope } from "../../../core/auth/portalSession.js";

const portalBase = (portal) =>
    ({
        customer: config.SHELL_URL,
        admin: config.ADMIN_URL,
        partner: config.PARTNER_URL,
    })[normalizePortalScope(portal)] || config.SHELL_URL;

const originOf = (value) => {
    try {
        return value ? new URL(value).origin : null;
    } catch {
        return null;
    }
};

const portalAllowedOrigins = (portal) =>
    new Set(
        (
            {
                customer: [config.SHELL_URL, config.TREVISTA_URL, config.TREVIO_URL],
                admin: [config.ADMIN_URL],
                partner: [config.PARTNER_URL],
            }[normalizePortalScope(portal)] || []
        )
            .map(originOf)
            .filter(Boolean),
    );

export const safeReturnUrl = (value, portal = "customer") => {
    const base = portalBase(portal);
    if (!base) throw new Error(`No frontend URL configured for ${portal}.`);
    if (!value) return base;
    try {
        const resolved = new URL(value, base);
        if (!portalAllowedOrigins(portal).has(resolved.origin)) return base;
        if (!/^https?:$/.test(resolved.protocol)) return base;
        resolved.username = "";
        resolved.password = "";
        return resolved.toString();
    } catch {
        return base;
    }
};

export const authFailureUrl = ({ portal = "customer", code = "AUTH_FAILED" } = {}) => {
    const base = config.AUTH_APP_URL || portalBase("customer");
    const url = new URL("/login", base);
    url.searchParams.set("app", normalizePortalScope(portal));
    url.searchParams.set("error", code);
    return url.toString();
};
