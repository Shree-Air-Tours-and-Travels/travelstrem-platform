import { clearGuestSession, enableGuestSession, GUEST_SESSION_KEY, isGuestSession } from "./guestSession";

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

test("guest intent can be explicitly enabled and cleared", () => {
  const sessionStorage = storage();
  enableGuestSession(sessionStorage);
  expect(isGuestSession({ search: "", storage: sessionStorage })).toBe(true);
  clearGuestSession(sessionStorage);
  expect(isGuestSession({ search: "", storage: sessionStorage })).toBe(false);
});
