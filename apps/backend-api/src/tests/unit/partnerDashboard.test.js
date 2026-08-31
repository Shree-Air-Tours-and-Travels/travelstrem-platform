import {
    buildPartnerDashboard,
    partnerDashboardScopes,
} from "../../modules/tenancy/partnerDashboard.service.js";

const baseAccess = {
    agencyId: "agency-1",
    role: "partner_admin",
    user: { _id: "admin-1", name: "Agency Owner", productAccess: ["trevista"] },
    agency: {
        _id: "agency-1",
        agencyName: "Shree Air Tours",
        status: "active",
        productAccess: ["trevista", "trevio"],
        settings: { currency: "INR", timezone: "Asia/Kolkata" },
    },
};

const counts = {
    agents: { active: 3, inactive: 1 },
    customers: { total: 12, active: 10 },
    enquiries: { new: 2, inReview: 1, responded: 4 },
    notifications: { unread: 5 },
    trevista: { total: 6, published: 3, draft: 2, pending: 1, upcoming: 2 },
    trevio: { total: 4, published: 2, draft: 1, pending: 1, upcoming: 1 },
};

const records = {
    enquiries: [
        {
            _id: "lead-1",
            tourTitle: "Rajasthan Journey",
            fields: { name: "Traveller One", email: "private@example.com" },
            status: "new",
            updatedAt: "2026-08-24T10:00:00.000Z",
        },
    ],
    products: [
        {
            _id: "tour-1",
            product: "trevista",
            title: "Rajasthan Journey",
            status: "published",
            updatedAt: "2026-08-24T09:00:00.000Z",
        },
    ],
    customers: [],
};

describe("partner dashboard contract", () => {
    test("creates an agency-wide admin dashboard with all assigned products", () => {
        const result = buildPartnerDashboard({ access: baseAccess, counts, records });

        expect(result.schemaVersion).toBe("partner-dashboard.v1");
        expect(result.scope).toBe("agency");
        expect(result.products.map((product) => product.key)).toEqual(["trevista", "trevio"]);
        expect(result.kpis.find((metric) => metric.id === "active-agents")?.value).toBe(3);
        expect(result.kpis.find((metric) => metric.id === "open-enquiries")?.value).toBe(3);
        expect(result.quickActions.some((action) => action.id === "manage-team")).toBe(true);
        expect(JSON.stringify(result)).not.toContain("private@example.com");
    });

    test("creates an agent dashboard without agency team controls", () => {
        const access = {
            ...baseAccess,
            role: "partner_agent",
            user: {
                _id: "agent-1",
                name: "Travel Agent",
                productAccess: ["trevista"],
            },
        };
        const result = buildPartnerDashboard({ access, counts, records });

        expect(result.scope).toBe("agent");
        expect(result.hero.title).toBe("Agent dashboard");
        expect(result.products.map((product) => product.key)).toEqual(["trevista"]);
        expect(result.kpis[0].id).toBe("my-products");
        expect(result.kpis[0].value).toBe(6);
        expect(result.quickActions.some((action) => action.id === "manage-team")).toBe(false);
    });

    test("adds ownerAgent to every agent-owned resource scope", () => {
        const scopes = partnerDashboardScopes({
            ...baseAccess,
            role: "partner_agent",
            user: { _id: "agent-1" },
        });

        expect(scopes.products).toEqual({ agencyId: "agency-1", ownerAgent: "agent-1" });
        expect(scopes.customers).toEqual({
            agencyId: "agency-1",
            ownerAgent: "agent-1",
            deletedAt: null,
        });
        expect(scopes.enquiries).toEqual({ agencyId: "agency-1", ownerAgent: "agent-1" });
    });

    test("keeps admin scopes tenant-isolated without narrowing to an owner", () => {
        const scopes = partnerDashboardScopes(baseAccess);
        expect(scopes.products).toEqual({ agencyId: "agency-1" });
        expect(scopes.customers).toEqual({ agencyId: "agency-1", deletedAt: null });
        expect(scopes.enquiries).toEqual({ agencyId: "agency-1" });
    });

    test("returns exactly six globally ordered activities per requested page", () => {
        const activityRecords = {
            products: Array.from({ length: 7 }, (_, index) => ({
                _id: `tour-${index}`,
                product: "trevista",
                title: `Tour ${index}`,
                status: "published",
                updatedAt: new Date(Date.UTC(2026, 7, 24, 12, 0, 0) - index * 120000).toISOString(),
            })),
            enquiries: Array.from({ length: 4 }, (_, index) => ({
                _id: `lead-${index}`,
                tourTitle: `Enquiry ${index}`,
                status: "new",
                updatedAt: new Date(Date.UTC(2026, 7, 24, 11, 59, 0) - index * 120000).toISOString(),
            })),
            customers: Array.from({ length: 3 }, (_, index) => ({
                _id: `customer-${index}`,
                name: `Customer ${index}`,
                status: "active",
                updatedAt: new Date(Date.UTC(2026, 7, 24, 11, 58, 0) - index * 120000).toISOString(),
            })),
        };

        const result = buildPartnerDashboard({
            access: baseAccess,
            counts,
            records: activityRecords,
            activityPagination: { page: 2, limit: 6, total: 14 },
        });

        expect(result.recentActivity).toHaveLength(6);
        expect(result.recentActivityPagination).toEqual({
            page: 2,
            limit: 6,
            total: 14,
            totalPages: 3,
            hasPrevious: true,
            hasNext: true,
        });
        expect(
            result.recentActivity.every((item, index, items) =>
                index === 0 || new Date(items[index - 1].occurredAt) >= new Date(item.occurredAt),
            ),
        ).toBe(true);
    });
});
