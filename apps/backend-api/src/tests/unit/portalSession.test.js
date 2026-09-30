import {
    getPortalCookieNames,
    getPortalScope,
    portalCookieOptions,
    readPortalAccessToken,
    readPortalRefreshToken,
} from "../../core/auth/portalSession.js";

describe("portal-scoped authentication sessions", () => {
    test("hosted test tier defaults to cross-site friendly cookies", async () => {
        const { ENV_TIER } = await import("../../core/auth/portalSession.js");
        expect(ENV_TIER).toBe("test"); // Jest runs with NODE_ENV=test

        const options = portalCookieOptions({ maxAge: 1000 });
        expect(options.sameSite).toBe("none"); // survives cross-site XHR (frontend ≠ API site)
        expect(options.secure).toBe(true); // mandatory pairing for SameSite=None
        expect(options.httpOnly).toBe(true);
        expect(getPortalCookieNames("customer").access).toBe("trem-customer-token"); // no __Host- prefix
    });
    test("defaults unknown and missing portal headers to customer", () => {
        expect(getPortalScope({ headers: {} })).toBe("customer");
        expect(getPortalScope({ headers: { "x-travelstrem-portal": "unknown" } })).toBe("customer");
    });

    test.each([
        ["dashboard", "customer"],
        ["adminTREM", "admin"],
        ["PartnerTREM", "partner"],
    ])("normalizes %s to the %s session", (header, expected) => {
        expect(getPortalScope({ headers: { "x-travelstrem-portal": header } })).toBe(expected);
    });

    test("reads only the cookie belonging to the requesting portal", () => {
        const customer = getPortalCookieNames("customer");
        const admin = getPortalCookieNames("admin");
        const partner = getPortalCookieNames("partner");
        const cookies = {
            [customer.access]: "customer-access",
            [admin.access]: "admin-access",
            [partner.access]: "partner-access",
            [customer.refresh]: "customer-refresh",
            [admin.refresh]: "admin-refresh",
            [partner.refresh]: "partner-refresh",
        };

        const adminRequest = { headers: { "x-travelstrem-portal": "admin" }, cookies };
        expect(readPortalAccessToken(adminRequest)).toBe("admin-access");
        expect(readPortalRefreshToken(adminRequest)).toBe("admin-refresh");
    });
});
