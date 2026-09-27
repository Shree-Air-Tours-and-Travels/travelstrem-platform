import { jest } from "@jest/globals";

const repoDouble = {
    countDocuments: jest.fn(),
    find: jest.fn(),
};
const favoriteCountDocuments = jest.fn();
const quoteFind = jest.fn();

jest.unstable_mockModule("../../modules/forms/repositories/ContactLeadRepository.js", () => ({
    __esModule: true,
    default: repoDouble,
}));
jest.unstable_mockModule("../../modules/tours/models/Favorite.js", () => ({
    __esModule: true,
    default: { countDocuments: favoriteCountDocuments },
}));
jest.unstable_mockModule("../../modules/bookings/models/BookingQuote.js", () => ({
    __esModule: true,
    default: { find: quoteFind },
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

beforeEach(() => {
    repoDouble.countDocuments.mockReset();
    repoDouble.find.mockReset();
    favoriteCountDocuments.mockReset();
    quoteFind.mockReset();
    favoriteCountDocuments.mockResolvedValue(0);
});

describe("buildDashboardSnapshot", () => {
    test("injects metrics and caps recent activity at five", async () => {
        favoriteCountDocuments.mockResolvedValue(4);
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
            totalFavorites: 4,
            upcomingTrips: 0,
            awaitingResponse: 3,
        });
        expect(favoriteCountDocuments).toHaveBeenCalledWith({ userId: "user-1" });
        expect(snapshot.journeyStage).toBe("awaiting");
        expect(snapshot.recentActivity).toHaveLength(5);
        expect(snapshot.recentActivity[0]).toMatchObject({
            recordType: "enquiry",
            perspective: "sent",
            title: "Kashmir Escape",
        });
    });

    test("keeps upcoming trips empty until the quote-and-payment journey exists", async () => {
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

    test("includes quote lifecycle events in the recent activity timeline", async () => {
        repoDouble.countDocuments.mockResolvedValue(1);
        repoDouble.find.mockReturnValue({
            sort: () => ({
                limit: () => ({
                    lean: async () => [
                        lead({
                            bookingId: "booking-1",
                            createdAt: "2026-08-20T10:00:00.000Z",
                            updatedAt: "2026-08-20T10:00:00.000Z",
                        }),
                    ],
                }),
            }),
        });
        quoteFind.mockReturnValue({
            sort: () => ({
                limit: () => ({
                    lean: async () => [
                        {
                            _id: "quote-1",
                            bookingId: "booking-1",
                            createdAt: "2026-08-21T10:00:00.000Z",
                            sentAt: "2026-08-22T10:00:00.000Z",
                            rejectedAt: "2026-08-23T10:00:00.000Z",
                        },
                    ],
                }),
            }),
        });

        const snapshot = await buildDashboardSnapshot("user-1");

        expect(snapshot.recentActivity.map((item) => item.activityType)).toEqual([
            "quote_rejected",
            "quote_sent",
            "quote_uploaded",
            "enquiry_new",
        ]);
    });

    test("uses the member identity rather than matching enquiries by shared email", async () => {
        repoDouble.countDocuments.mockResolvedValue(0);
        repoDouble.find.mockReturnValue({
            sort: () => ({ limit: () => ({ lean: async () => [] }) }),
        });

        await buildDashboardSnapshot("user-1");

        expect(repoDouble.countDocuments).toHaveBeenCalledWith({ claimedBy: "user-1" });
    });

    test("keeps the rest of the dashboard available if favorites cannot be counted", async () => {
        favoriteCountDocuments.mockRejectedValue(new Error("favorites unavailable"));
        repoDouble.countDocuments.mockResolvedValue(2);
        repoDouble.find.mockReturnValue({
            sort: () => ({ limit: () => ({ lean: async () => [] }) }),
        });

        const snapshot = await buildDashboardSnapshot("user-1");

        expect(snapshot.metrics.totalEnquiries).toBe(2);
        expect(snapshot.metrics.totalFavorites).toBe(0);
    });

    test("returns a safe empty snapshot when the data layer fails", async () => {
        repoDouble.countDocuments.mockRejectedValue(new Error("db down"));
        repoDouble.find.mockReturnValue({
            sort: () => ({ limit: () => ({ lean: async () => [] }) }),
        });

        const snapshot = await buildDashboardSnapshot("user-1");

        expect(snapshot.metrics).toEqual({
            totalEnquiries: 0,
            totalFavorites: 0,
            upcomingTrips: 0,
            awaitingResponse: 0,
        });
        expect(snapshot.journeyStage).toBe("discover");
        expect(snapshot.recentActivity).toEqual([]);
        expect(snapshot.upcomingTrips).toEqual([]);
    });

    test("returns an empty snapshot without a userId", async () => {
        const snapshot = await buildDashboardSnapshot(null);
        expect(snapshot.recentActivity).toEqual([]);
        expect(repoDouble.countDocuments).not.toHaveBeenCalled();
    });
});
