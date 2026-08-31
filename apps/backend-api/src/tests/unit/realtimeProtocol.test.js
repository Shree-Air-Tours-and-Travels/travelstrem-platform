import { jest } from "@jest/globals";

jest.unstable_mockModule("../../config/index.js", () => ({
    __esModule: true,
    default: {
        FRONTENDS: ["http://localhost:3006"],
        CORS_ALLOWED_DOMAIN_SUFFIXES: [],
        IS_DEVELOPMENT: true,
        IS_PRODUCTION: false,
        REDIS_URL: "",
    },
}));

const {
    REALTIME_COMMANDS,
    REALTIME_ERROR_CODES,
    REALTIME_EVENTS,
    REALTIME_RESOURCES,
    room,
    realtimeError,
} = await import("../../realtime/realtime.constants.js");
const { validateSubscriptionPayload } = await import("../../realtime/realtime.validation.js");
const { isRealtimeOriginAllowed, realtimeConfig } =
    await import("../../realtime/realtime.config.js");

const OBJECT_ID = "507f1f77bcf86cd799439011";

describe("realtime rooms and event registry", () => {
    test("builds stable room names", () => {
        expect(room.user(OBJECT_ID)).toBe(`user:${OBJECT_ID}`);
        expect(room.agency("agency-1")).toBe("agency:agency-1");
        expect(room.admin()).toBe("admin");
        expect(room.booking("b1")).toBe("booking:b1");
        expect(room.support("t9")).toBe("support:t9");
        expect(room.catalog()).toBe("catalog");
    });

    test("event names follow the domain:event convention", () => {
        Object.values(REALTIME_EVENTS).forEach((name) => {
            expect(name).toMatch(/^[a-z]+:[a-z-]+$/);
        });
        Object.values(REALTIME_COMMANDS).forEach((name) => {
            expect(name).toMatch(/^[a-z]+:(subscribe|unsubscribe)$/);
        });
    });
});

describe("realtime subscription payload validation", () => {
    test("accepts a well-formed subscription", () => {
        const result = validateSubscriptionPayload({ resource: "booking", id: OBJECT_ID });
        expect(result).toEqual({ ok: true, resource: "booking", id: OBJECT_ID });
    });

    test("rejects malformed payloads without throwing", () => {
        expect(validateSubscriptionPayload(null).ok).toBe(false);
        expect(validateSubscriptionPayload("booking").ok).toBe(false);
        expect(validateSubscriptionPayload({ resource: "admin", id: OBJECT_ID }).code).toBe(
            REALTIME_ERROR_CODES.INVALID_PAYLOAD,
        );
        expect(validateSubscriptionPayload({ resource: "booking", id: "room of admin" }).ok).toBe(
            false,
        );
        expect(validateSubscriptionPayload({ resource: "booking" }).ok).toBe(false);
    });

    test("rejects oversized payloads", () => {
        const result = validateSubscriptionPayload({
            resource: "tour",
            id: OBJECT_ID,
            junk: "x".repeat(1024),
        });
        expect(result.code).toBe(REALTIME_ERROR_CODES.INVALID_PAYLOAD);
    });

    test("only known resources are submittable", () => {
        expect(REALTIME_RESOURCES).toEqual(
            expect.arrayContaining(["booking", "tour", "trip", "support"]),
        );
        expect(REALTIME_RESOURCES).not.toContain("user");
    });
});

describe("realtime error shape", () => {
    test("produces the standardized { code, message } contract", () => {
        const error = realtimeError(REALTIME_ERROR_CODES.FORBIDDEN, "No access");
        expect(error).toEqual({ code: "REALTIME_FORBIDDEN", message: "No access" });
    });
});

describe("realtime origin policy", () => {
    test("config exposes a non-wildcard path and stays enabled by default", () => {
        expect(realtimeConfig.path.startsWith("/")).toBe(true);
        expect(realtimeConfig.enabled).toBe(true);
    });

    test("allows no-origin (non-browser) handshakes and configured frontends", () => {
        expect(isRealtimeOriginAllowed(undefined)).toBe(true);
        expect(isRealtimeOriginAllowed("http://localhost:3006")).toBe(true);
        expect(isRealtimeOriginAllowed("https://evil.example.com")).toBe(false);
    });
});
