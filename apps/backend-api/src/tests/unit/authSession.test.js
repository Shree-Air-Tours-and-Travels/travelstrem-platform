import { jest } from "@jest/globals";

const sessions = [];
const matches = (record, query) =>
    Object.entries(query).every(([key, value]) => {
        if (key === "sessionId" && value?.$ne !== undefined) return record.sessionId !== value.$ne;
        return String(record[key]) === String(value);
    });
const refreshModel = {
    cleanupExpired: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(async (payload) => {
        const record = {
            ...payload,
            revokedAt: null,
            createdAt: new Date(),
            save: jest.fn().mockResolvedValue(undefined),
        };
        sessions.push(record);
        return record;
    }),
    findOne: jest.fn((query) => {
        const find = () => sessions.filter((record) => matches(record, query)).at(-1) || null;
        return { then: (resolve) => resolve(find()), sort: async () => find() };
    }),
    updateOne: jest.fn(async (query, update) => {
        const record = sessions.find((candidate) => matches(candidate, query));
        if (record) Object.assign(record, update.$set || {});
        return { acknowledged: true };
    }),
    updateMany: jest.fn(async (query, update) => {
        sessions
            .filter((candidate) => matches(candidate, query))
            .forEach((record) => Object.assign(record, update.$set || {}));
        return { acknowledged: true };
    }),
};
const user = {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    name: "Session User",
    email: "session@example.com",
    role: "member",
    accountStatus: "active",
    tokenVersion: 0,
};
const userModel = {
    findById: jest.fn().mockResolvedValue(user),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
};

jest.unstable_mockModule("../../config/index.js", () => ({
    default: {
        JWT: {
            accessSecret: "test-access-secret-at-least-32-characters",
            accessExpires: "15m",
            refreshExpires: "30d",
        },
    },
}));
jest.unstable_mockModule("../../modules/auth/models/RefreshToken.js", () => ({
    default: refreshModel,
}));
jest.unstable_mockModule("../../modules/auth/models/User.js", () => ({ default: userModel }));

const { createSession, rotateSession, revokeCurrentSession } =
    await import("../../modules/auth/services/session.service.js");
const { getPortalCookieNames } = await import("../../core/auth/portalSession.js");

const makeResponse = () => {
    const cookies = {};
    return {
        cookies,
        cookie: jest.fn((name, value) => {
            cookies[name] = value;
        }),
    };
};
const makeRequest = (cookies = {}) => ({
    headers: { "x-travelstrem-portal": "customer", "user-agent": "Jest" },
    cookies,
    ip: "127.0.0.1",
    get(name) {
        return this.headers[name.toLowerCase()];
    },
});

beforeEach(() => {
    sessions.length = 0;
    jest.clearAllMocks();
    delete user.avatar;
    userModel.findById.mockResolvedValue(user);
    userModel.updateOne.mockResolvedValue({ acknowledged: true });
});

test("session creation stores only a hashed refresh token and sets HttpOnly-cookie values", async () => {
    const req = makeRequest();
    const res = makeResponse();
    const result = await createSession({ user, req, res, portal: "customer" });
    const names = getPortalCookieNames("customer");
    expect(result.authenticated).toBe(true);
    expect(res.cookies[names.access]).toBeTruthy();
    expect(res.cookies[names.refresh]).toBeTruthy();
    expect(sessions[0].tokenHash).not.toBe(res.cookies[names.refresh]);
});

test("session creation applies and persists the first profile avatar when none exists", async () => {
    const result = await createSession({
        user,
        req: makeRequest(),
        res: makeResponse(),
        portal: "customer",
    });

    expect(result.user.avatar).toBe("user");
    expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: user._id, avatar: null },
        { $set: { avatar: "user" } },
    );
});

test("refresh token rotates and the previous session is revoked", async () => {
    const firstRes = makeResponse();
    await createSession({ user, req: makeRequest(), res: firstRes, portal: "customer" });
    const names = getPortalCookieNames("customer");
    const oldRefresh = firstRes.cookies[names.refresh];
    const nextRes = makeResponse();
    const result = await rotateSession({
        req: makeRequest({ [names.refresh]: oldRefresh }),
        res: nextRes,
        portal: "customer",
    });
    expect(result.authenticated).toBe(true);
    expect(nextRes.cookies[names.refresh]).not.toBe(oldRefresh);
    expect(sessions[0].revokedAt).toBeInstanceOf(Date);
});

test("invalid refresh token fails", async () => {
    const names = getPortalCookieNames("customer");
    await expect(
        rotateSession({
            req: makeRequest({ [names.refresh]: "invalid" }),
            res: makeResponse(),
            portal: "customer",
        }),
    ).resolves.toBeNull();
});

test("replayed revoked refresh token revokes its token family", async () => {
    const firstRes = makeResponse();
    await createSession({ user, req: makeRequest(), res: firstRes, portal: "customer" });
    const names = getPortalCookieNames("customer");
    const oldRefresh = firstRes.cookies[names.refresh];
    await rotateSession({
        req: makeRequest({ [names.refresh]: oldRefresh }),
        res: makeResponse(),
        portal: "customer",
    });
    await expect(
        rotateSession({
            req: makeRequest({ [names.refresh]: oldRefresh }),
            res: makeResponse(),
            portal: "customer",
        }),
    ).resolves.toBeNull();
    expect(sessions.every((session) => session.revokedAt instanceof Date)).toBe(true);
});

test("logout revokes the presented session and clears both cookies", async () => {
    const firstRes = makeResponse();
    await createSession({ user, req: makeRequest(), res: firstRes, portal: "customer" });
    const names = getPortalCookieNames("customer");
    const logoutRes = makeResponse();
    await revokeCurrentSession(
        makeRequest({ [names.refresh]: firstRes.cookies[names.refresh] }),
        logoutRes,
        "customer",
    );
    expect(sessions[0].revokedAt).toBeInstanceOf(Date);
    expect(logoutRes.cookies[names.access]).toBe("");
    expect(logoutRes.cookies[names.refresh]).toBe("");
});
