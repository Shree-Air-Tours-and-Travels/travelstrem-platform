import { createAuthService } from "@packages/trem-auth-core";

describe("centralized customer authentication client", () => {
  const api = {
    defaults: { baseURL: "http://localhost:5000/api" },
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  test("starts Google authentication at the backend with a portal-scoped internal return URL", () => {
    const auth = createAuthService(api);
    const url = new URL(auth.getGoogleAuthUrl({ portal: "customer", returnTo: "/favorites" }));

    expect(url.origin + url.pathname).toBe("http://localhost:5000/api/auth/google");
    expect(url.searchParams.get("portal")).toBe("customer");
    expect(url.searchParams.get("returnTo")).toBe("/favorites");
  });

  test("uses backend-owned mobile and session endpoints", async () => {
    api.post.mockResolvedValue({ data: { challengeId: "challenge-1" } });
    api.get.mockResolvedValue({ data: { authenticated: false } });
    const auth = createAuthService(api);

    await auth.requestMobileOtp({ phoneNumber: "+919876543210", portal: "customer" });
    await auth.getCurrentUser();

    expect(api.post).toHaveBeenCalledWith("/auth/mobile/request-otp", {
      phoneNumber: "+919876543210",
      portal: "customer",
    });
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });
});
