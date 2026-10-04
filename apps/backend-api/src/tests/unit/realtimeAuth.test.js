import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const SECRET = "test-access-secret";
const sign = (payload) => jwt.sign(payload, SECRET);

const mockUser = (overrides = {}) => ({
    _id: "507f1f77bcf86cd799439011",
    role: "member",
    adminLevel: "none",
    agencyRole: "none",
    agencyId: null,
    accountStatus: "active",
    tokenVersion: 0,
    ...overrides,
});

const userModel = { findById: jest.fn() };
const agencyModel = { findById: jest.fn() };

// Mirrors the mongoose chain used by realtime.auth.js: findById().select().lean()
const docQuery = (doc) => ({ select: () => ({ lean: async () => doc }) });

jest.unstable_mockModule("../../config/index.js", () => ({
    __esModule: true,
    default: { JWT: { accessSecret: SECRET } },
}));
jest.unstable_mockModule("../../modules/auth/models/User.js", () => ({
    __esModule: true,
    default: userModel,
}));
jest.unstable_mockModule("../../modules/auth/models/PartnerAgency.js", () => ({
    __esModule: true,
    default: agencyModel,
}));

const { authenticateHandshake } = await import("../../realtime/realtime.auth.js");

// Mock specifiers resolve from this test file; they normalize onto the same
// module files that src/realtime/realtime.auth.js imports at runtime.

const handshakeWithCookie = (token, portal = "customer") => ({
    auth: { portal },
    headers: { cookie: `trem-${portal}-token=${token}` },
});

beforeEach(() => {
    userModel.findById.mockReset();
    agencyModel.findById.mockReset();
});

describe("realtime handshake authentication", () => {
    test("accepts a valid portal cookie session and returns a safe context", async () => {
        userModel.findById.mockReturnValue(docQuery(mockUser()));

        const token = sign({
            sub: "507f1f77bcf86cd799439011",
            portal: "customer",
            tokenVersion: 0,
        });
        const result = await authenticateHandshake(handshakeWithCookie(token));

        expect(result.ok).toBe(true);
        expect(result.context).toEqual({
            userId: "507f1f77bcf86cd799439011",
            role: "member",
            adminLevel: "none",
            agencyId: null,
            agencyRole: "none",
            portal: "customer",
            sessionId: null,
        });
        // No sensitive fields ever reach the socket context.
        expect(JSON.stringify(result.context)).not.toMatch(/token|password|secret/i);
    });

    test("rejects unauthenticated handshakes (no cookie, no bearer)", async () => {
        const result = await authenticateHandshake({ auth: {}, headers: {} });
        expect(result.ok).toBe(false);
        expect(result.code).toBe("REALTIME_UNAUTHORIZED");
    });

    test("rejects invalid or expired credentials", async () => {
        const result = await authenticateHandshake(handshakeWithCookie("not-a-jwt"));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/invalid or expired/i);
    });

    test("rejects sessions whose portal claim does not match the requested scope", async () => {
        const token = sign({ sub: "507f1f77bcf86cd799439011", portal: "admin", tokenVersion: 0 });
        const result = await authenticateHandshake(handshakeWithCookie(token, "customer"));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/different portal/i);
    });

    test("rejects revoked sessions via tokenVersion mismatch", async () => {
        userModel.findById.mockReturnValue(docQuery(mockUser({ tokenVersion: 3 })));
        const token = sign({
            sub: "507f1f77bcf86cd799439011",
            portal: "customer",
            tokenVersion: 0,
        });
        const result = await authenticateHandshake(handshakeWithCookie(token));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/revoked/i);
    });

    test("rejects suspended accounts", async () => {
        userModel.findById.mockReturnValue(docQuery(mockUser({ accountStatus: "suspended" })));
        const token = sign({
            sub: "507f1f77bcf86cd799439011",
            portal: "customer",
            tokenVersion: 0,
        });
        const result = await authenticateHandshake(handshakeWithCookie(token));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/suspended/);
    });

    test("rejects users whose agency is not active", async () => {
        userModel.findById.mockReturnValue(
            docQuery(mockUser({ agencyId: "507f1f77bcf86cd799439022" })),
        );
        agencyModel.findById.mockReturnValue(docQuery({ status: "inactive" }));
        const token = sign({ sub: "507f1f77bcf86cd799439011", portal: "partner", tokenVersion: 0 });
        const result = await authenticateHandshake(handshakeWithCookie(token, "partner"));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/agency/i);
    });

    test("reads the partner portal cookie for partner handshakes", async () => {
        userModel.findById.mockReturnValue(docQuery(mockUser()));
        const token = sign({ sub: "507f1f77bcf86cd799439011", portal: "partner", tokenVersion: 0 });
        const result = await authenticateHandshake(handshakeWithCookie(token, "partner"));
        expect(result.ok).toBe(true);
        expect(result.context.portal).toBe("partner");
    });
});
