import { sanitizeAuditPayload } from "../../modules/tenancy/audit.service.js";

describe("tenant audit sanitization", () => {
  test("removes nested credentials without losing safe context", () => {
    expect(sanitizeAuditPayload({
      email: "agent@example.com",
      password: "never-log-this",
      activationToken: "secret-token",
      nested: { otp: "123456", status: "active", Authorization: "Bearer secret" },
    })).toEqual({ email: "agent@example.com", nested: { status: "active" } });
  });

  test("sanitizes values inside arrays", () => {
    expect(sanitizeAuditPayload([{ name: "A", passwordHash: "hash" }])).toEqual([{ name: "A" }]);
  });
});
