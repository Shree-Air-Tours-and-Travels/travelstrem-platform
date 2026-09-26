import { afterEach, describe, expect, it } from "vitest";
import { buildGlobalAuthUrl, getGlobalAuthBaseUrl } from "../auth/globalAuth.js";

const originalWindow = globalThis.window;
const originalAuthUrl = process.env.REACT_APP_AUTH_APP_URL;

afterEach(() => {
  globalThis.window = originalWindow;
  process.env.REACT_APP_AUTH_APP_URL = originalAuthUrl;
});

describe("global AuthTREM routing", () => {
  it("never falls back to a local product portal login", () => {
    process.env.REACT_APP_AUTH_APP_URL = "";
    globalThis.window = { location: { hostname: "localhost", origin: "http://localhost:3004" } };

    expect(getGlobalAuthBaseUrl()).toBe("http://localhost:3003");
    expect(buildGlobalAuthUrl({ app: "partner", returnTo: "http://localhost:3004/" })).toBe(
      "http://localhost:3003/login?returnTo=http%3A%2F%2Flocalhost%3A3004%2F&mode=login&app=partner",
    );
  });

  it("uses the configured AuthTREM origin when supplied", () => {
    process.env.REACT_APP_AUTH_APP_URL = "https://identity.example.com";
    expect(getGlobalAuthBaseUrl()).toBe("https://identity.example.com");
  });
});
