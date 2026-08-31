import { jest } from "@jest/globals";

jest.unstable_mockModule("../../config/index.js", () => ({
    __esModule: true,
    default: { JWT: { accessSecret: "x" } },
}));

const { REALTIME_EVENTS, REALTIME_RESOURCES, room } =
    await import("../../realtime/realtime.constants.js");
const { enquiryDto } = await import("../../realtime/realtime.dto.js");

describe("enquiry realtime contract", () => {
    test("registers enquiry events in the central registry", () => {
        expect(REALTIME_EVENTS.ENQUIRY_CREATED).toBe("enquiry:created");
        expect(REALTIME_EVENTS.ENQUIRY_CLAIMED).toBe("enquiry:claimed");
        // Enquiries ride identity rooms; no per-resource subscription exists.
        expect(REALTIME_RESOURCES).not.toContain("enquiry");
    });

    test("enquiryDto whitelists safe fields only", () => {
        const lead = {
            _id: "507f1f77bcf86cd799439033",
            enquiryRef: "ENQ-ABC123",
            tourId: "tour-slug-or-id",
            tourTitle: "Kashmir Escape",
            product: "trevista",
            status: "new",
            agencyId: "507f1f77bcf86cd799439022",
            ownerAgent: { _id: "507f1f77bcf86cd799439044", name: "Agent" },
            claimedBy: null,
            notified: true,
            createdAt: new Date("2026-01-01").toISOString(),
            // Raw document noise that must never leak to sockets:
            fields: {
                name: "Jane",
                email: "jane@example.com",
                phone: "+91...",
                message: "secret",
                travellerCount: 3,
            },
            agentSnapshot: { email: "agent@agency.com", phone: "+91..." },
            customizationSnapshot: { customized: { totalMinor: 100 } },
        };

        const dto = enquiryDto(lead);
        expect(dto.enquiryId).toBe("507f1f77bcf86cd799439033");
        expect(dto.ownerAgentId).toBe("507f1f77bcf86cd799439044");
        expect(dto.travellerCount).toBe(3);
        expect(dto.notified).toBe(true);

        const serialized = JSON.stringify(dto);
        expect(serialized).not.toMatch(/jane@example\.com|\+91|secret|totalMinor/i);
    });

    test("enquiryDto tolerates sparse documents", () => {
        const dto = enquiryDto({});
        expect(dto.status).toBe("new");
        expect(dto.claimedUserId).toBeNull();
        expect(typeof dto.createdAt).toBe("string");
    });

    test("identity rooms cover every enquiry audience", () => {
        expect(room.user("u1")).toBe("user:u1");
        expect(room.agency("a1")).toBe("agency:a1");
        expect(room.admin()).toBe("admin");
    });
});
