import { effectiveRole, permissionsFor, PERMISSIONS } from "../../modules/tenancy/permissions.js";
import { assertTenant, tenantQuery } from "../../modules/tenancy/policy.js";

describe("tenant RBAC policy", () => {
    test("master admin receives platform permissions", () => {
        const user = { role: "admin", adminLevel: "master" };
        expect(effectiveRole(user)).toBe("master_admin");
        expect(permissionsFor(user)).toContain(PERMISSIONS.AGENCY_CREATE);
    });
    test("partner agent does not receive agency-wide visibility", () => {
        const permissions = permissionsFor({ role: "agent", agencyRole: "partner_agent" });
        expect(permissions).toContain(PERMISSIONS.TRIP_VIEW_OWN);
        expect(permissions).not.toContain(PERMISSIONS.TRIP_VIEW_AGENCY);
    });
    test("permission denials override grants and role permissions", () => {
        const permissions = permissionsFor({
            role: "agent",
            agencyRole: "partner_admin",
            permissionDenials: [PERMISSIONS.TRIP_PUBLISH],
        });
        expect(permissions).not.toContain(PERMISSIONS.TRIP_PUBLISH);
    });
    test("tenant query cannot be overridden by caller data", () => {
        const req = { access: { isMaster: false, agencyId: "agency-a" } };
        expect(tenantQuery(req, { status: "active", agencyId: "agency-b" })).toEqual({
            status: "active",
            agencyId: "agency-a",
        });
    });
    test("cross-agency records are rejected", () => {
        const req = { access: { isMaster: false, agencyId: "agency-a" } };
        expect(assertTenant(req, { agencyId: "agency-a" })).toBe(true);
        expect(assertTenant(req, { agencyId: "agency-b" })).toBe(false);
    });
    test("partner admin cannot receive platform permissions through its role", () => {
        const permissions = permissionsFor({ role: "agent", agencyRole: "partner_admin" });
        expect(permissions).toContain(PERMISSIONS.AGENT_CREATE);
        expect(permissions).not.toContain(PERMISSIONS.AGENCY_CREATE);
        expect(permissions).not.toContain(PERMISSIONS.AGENT_DELETE_APPROVE);
        expect(permissions).not.toContain(PERMISSIONS.AUDIT_VIEW_PLATFORM);
    });
    test("master tenant queries deliberately remain platform-scoped", () => {
        expect(tenantQuery({ access: { isMaster: true } }, { status: "active" })).toEqual({
            status: "active",
        });
    });
});
