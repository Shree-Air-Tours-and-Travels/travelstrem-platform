import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const lean = jest.fn();
const select = jest.fn(() => ({ lean }));
const userModel = { findById: jest.fn(() => ({ select })) };
const agencyModel = { findById: jest.fn() };
const accessSecret = "middleware-test-secret-at-least-32-characters";

jest.unstable_mockModule("../../config/index.js", () => ({ default: { JWT: { accessSecret } } }));
jest.unstable_mockModule("../../modules/auth/models/User.js", () => ({ default: userModel }));
jest.unstable_mockModule("../../modules/auth/models/PartnerAgency.js", () => ({
    default: agencyModel,
}));

const { default: authMiddleware } = await import("../../core/auth/authMiddleware.js");
const { getPortalCookieNames } = await import("../../core/auth/portalSession.js");

const response = () => {
    const res = { statusCode: 200, body: null };
    res.status = jest.fn((status) => {
        res.statusCode = status;
        return res;
    });
    res.json = jest.fn((body) => {
        res.body = body;
        return res;
    });
    return res;
};

beforeEach(() => jest.clearAllMocks());

test("anonymous protected request returns structured AUTH_REQUIRED", async () => {
    const res = response();
    await authMiddleware({ headers: {}, cookies: {} }, res, jest.fn());
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ code: "AUTH_REQUIRED" });
});

test("valid portal-scoped session attaches the internal user", async () => {
    const token = jwt.sign(
        { sub: "507f1f77bcf86cd799439011", portal: "customer", tokenVersion: 0 },
        accessSecret,
        { expiresIn: "5m" },
    );
    const names = getPortalCookieNames("customer");
    lean.mockResolvedValue({
        role: "member",
        tokenVersion: 0,
        accountStatus: "active",
        agencyId: null,
    });
    const req = {
        headers: { "x-travelstrem-portal": "customer" },
        cookies: { [names.access]: token },
    };
    const next = jest.fn();
    await authMiddleware(req, response(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ sub: "507f1f77bcf86cd799439011", role: "member" });
});

test("a session cannot be used against another portal", async () => {
    const token = jwt.sign(
        { sub: "507f1f77bcf86cd799439011", portal: "customer", tokenVersion: 0 },
        accessSecret,
        { expiresIn: "5m" },
    );
    const names = getPortalCookieNames("admin");
    const res = response();
    await authMiddleware(
        { headers: { "x-travelstrem-portal": "admin" }, cookies: { [names.access]: token } },
        res,
        jest.fn(),
    );
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ code: "INVALID_SESSION" });
});
