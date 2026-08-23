import { jest } from "@jest/globals";

const repoDouble = {
    countDocuments: jest.fn(),
    find: jest.fn(),
};
const userFindById = jest.fn();

jest.unstable_mockModule("../../modules/forms/repositories/ContactLeadRepository.js", () => ({
    __esModule: true,
    default: repoDouble,
}));
jest.unstable_mockModule("../../modules/auth/models/User.js", () => ({
    __esModule: true,
    default: { findById: userFindById },
}));

const { buildDashboardSnapshot } =
    await import("../../modules/pageDefinitions/dashboardDataService.js");

const lead = (overrides = {}) => ({
    _id: `id-${Math.random().toString(16).slice(2)}`,
    enquiryRef: "ENQ-AAA001",
    tourTitle: "Kashmir Escape",
    product: "trevista",
    status: "new",
    claimedBy: "user-1",
    createdAt: new Date().toISOString(),
    fields: {},
    ...overrides,
});

const mockUserEmail = (email) => {
    userFindById.mockReturnValue({
        select: () => ({ lean: async () => ({ email }) }),
    });
};

beforeEach(() => {
    repoDouble.countDocuments.mockReset();
    repoDouble.find.mockReset();
    userFindById.mockReset();
});

describe("buildDashboardSnapshot", () => {
    test("injects metrics and caps recent activity at five", async () => {
        mockUserEmail("traveller@example.com");
        repoDouble.countDocuments.mockImplementation((query) => {
            if (query.status) return Promise.resolve(3);
            return Promise.resolve(7);
        });
        const leads = Array.from({ length: 7 }, (_, index) =>
            lead({ enquiryRef: `ENQ-00${index}` }),
        );
        repoDouble.find.mockReturnValue({
            sort: () => ({
                // Honor the DB-level cap the way Mongo would.
                limit: (n) => ({ lean: async () => leads.slice(0, n) }),
            }),
        });

        const snapshot = await buildDashboardSnapshot("user-1");

        expect(snapshot.metrics).toEqual({
            totalEnquiries: 7,
            upcomingTrips: 0,
            awaitingResponse: 3,
        });
        expect(repoDouble.countDocuments).toHaveBeenCalledWith(
            expect.objectContaining({ $or: [expect.anything(), expect.anything()] }),
        );
        expect(snapshot.recentActivity).toHaveLength(5);
        expect(snapshot.recentActivity[0]).toMatchObject({
            recordType: "enquiry",
            perspective: "sent",
            title: "Kashmir Escape",
        });
    });

    test("keeps upcoming trips empty until the quote-and-payment journey exists", async () => {
        mockUserEmail("traveller@example.com");
        repoDouble.countDocuments.mockResolvedValue(1);
        repoDouble.find.mockReturnValue({
            sort: () => ({
                limit: () => ({
                    lean: async () => [
                        lead({
                            fields: {
                                preferredStartDate: new Date(Date.now() + 864e5).toISOString(),
                            },
                        }),
                    ],
                }),
            }),
        });

        const snapshot = await buildDashboardSnapshot("user-1");

        // Future-dated enquiries must NOT become upcoming trips — a trip only
        // counts once the traveller accepts a quote and pays.
        expect(snapshot.upcomingTrips).toEqual([]);
        expect(snapshot.metrics.upcomingTrips).toBe(0);
        expect(snapshot.recentActivity).toHaveLength(1);
    });

    test("falls back to a claimed-only query when the viewer has no email", async () => {
        mockUserEmail("");
        repoDouble.countDocuments.mockResolvedValue(0);
        repoDouble.find.mockReturnValue({
            sort: () => ({ limit: () => ({ lean: async () => [] }) }),
        });

        await buildDashboardSnapshot("user-1");

        expect(repoDouble.countDocuments).toHaveBeenCalledWith({ claimedBy: "user-1" });
    });

    test("returns a safe empty snapshot when the data layer fails", async () => {
        mockUserEmail("traveller@example.com");
        repoDouble.countDocuments.mockRejectedValue(new Error("db down"));
        repoDouble.find.mockReturnValue({
            sort: () => ({ limit: () => ({ lean: async () => [] }) }),
        });

        const snapshot = await buildDashboardSnapshot("user-1");

        expect(snapshot.metrics).toEqual({
            totalEnquiries: 0,
            upcomingTrips: 0,
            awaitingResponse: 0,
        });
        expect(snapshot.recentActivity).toEqual([]);
        expect(snapshot.upcomingTrips).toEqual([]);
    });

    test("returns an empty snapshot without a userId", async () => {
        const snapshot = await buildDashboardSnapshot(null);
        expect(snapshot.recentActivity).toEqual([]);
        expect(repoDouble.countDocuments).not.toHaveBeenCalled();
    });
});
