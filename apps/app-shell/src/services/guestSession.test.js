import { clearGuestSession, enableGuestSession, getGuestContinuationUrl, GUEST_SESSION_KEY, isGuestSession } from "./guestSession";

const storage = () => {
  const values = new Map();
  return {
    getItem: jest.fn((key) => values.get(key) || null),
    setItem: jest.fn((key, value) => values.set(key, value)),
    removeItem: jest.fn((key) => values.delete(key)),
  };
};

test("guest=1 makes guest intent durable before the app shell initializes", () => {
  const sessionStorage = storage();
  expect(isGuestSession({ search: "?tab=overview&guest=1", storage: sessionStorage })).toBe(true);
  expect(sessionStorage.setItem).toHaveBeenCalledWith(GUEST_SESSION_KEY, "true");
  expect(isGuestSession({ search: "?tab=overview", storage: sessionStorage })).toBe(true);
});

describe("getGuestContinuationUrl", () => {
  it("preserves a public product URL and its existing query/hash", () => {
    expect(getGuestContinuationUrl({
      href: "http://localhost:3006/trevista/tours/udaipur-complete-royal-escape?source=share#overview",
      keepCurrent: true,
    })).toBe("/trevista/tours/udaipur-complete-royal-escape?source=share&guest=1#overview");
  });

  it("uses overview when the current destination is protected", () => {
    expect(getGuestContinuationUrl({
      href: "http://localhost:3006/?tab=bookings",
      keepCurrent: false,
    })).toBe("/?tab=overview&guest=1");
  });
});

test("guest intent can be explicitly enabled and cleared", () => {
  const sessionStorage = storage();
  enableGuestSession(sessionStorage);
  expect(isGuestSession({ search: "", storage: sessionStorage })).toBe(true);
  clearGuestSession(sessionStorage);
  expect(isGuestSession({ search: "", storage: sessionStorage })).toBe(false);
});
