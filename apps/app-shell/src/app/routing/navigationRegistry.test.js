import {
  FALLBACK_NAVIGATION_CONFIG,
  isGuestAccessibleDestination,
  buildDestinationLocation,
  normalizeNavigationConfig,
  resolveDestination,
  resolveNavigationIntent,
} from "./navigationRegistry";

describe("navigationRegistry", () => {
  const config = normalizeNavigationConfig(FALLBACK_NAVIGATION_CONFIG);

  it("resolves backend aliases and query tabs to registered destinations", () => {
    expect(resolveDestination(config, { pathname: "/trip/bali", search: "" }).renderer).toBe("trevio");
    expect(resolveDestination(config, { pathname: "/", search: "?tab=favorites" }).id).toBe("favorites");
    expect(resolveDestination(config, { pathname: "/booking", search: "?product=trevio" }).renderer).toBe("bookingEngine");
    expect(resolveDestination(config, { pathname: "/help/requests", search: "" }).id).toBe("support");
  });

  it("keeps booking and account destinations protected from guest mode", () => {
    expect(isGuestAccessibleDestination({ id: "trevista" })).toBe(true);
    expect(isGuestAccessibleDestination({ id: "trevio" })).toBe(true);
    expect(isGuestAccessibleDestination({ id: "booking-engine" })).toBe(false);
    expect(isGuestAccessibleDestination({ id: "bookings" })).toBe(false);
    expect(isGuestAccessibleDestination({ id: "favorites" })).toBe(false);
  });

  it("builds a fresh destination query without leaking the current route", () => {
    const favorites = config.destinations.find((item) => item.id === "favorites");
    expect(buildDestinationLocation(favorites)).toEqual({
      pathname: "/",
      search: "?tab=favorites",
      hash: "",
    });
  });

  it("rejects backend attempts to mount an unknown renderer", () => {
    const normalized = normalizeNavigationConfig({
      destinations: [{ id: "unsafe", kind: "remote", renderer: "https://evil.test/app.js", path: "/" }],
    });
    expect(normalized.destinations.some((item) => item.id === "unsafe")).toBe(false);
  });

  it("allows same-origin paths and blocks non-allowlisted external origins", () => {
    expect(resolveNavigationIntent(config, "/trip/bali", "https://dashboard.test").type).toBe("internal-path");
    expect(resolveNavigationIntent(config, "https://evil.test/path", "https://dashboard.test").type).toBe("blocked");
  });

  it("allows explicitly configured HTTPS external origins", () => {
    const externalConfig = normalizeNavigationConfig({
      ...FALLBACK_NAVIGATION_CONFIG,
      security: {
        allowedExternalProtocols: ["https:"],
        allowedExternalOrigins: ["https://support.travelstrem.com"],
      },
    });
    expect(resolveNavigationIntent(
      externalConfig,
      "https://support.travelstrem.com/help",
      "https://dashboard.test",
    ).type).toBe("external");
  });

  it("matches parameterized paths and safely encodes generated parameters", () => {
    const dynamic = normalizeNavigationConfig({
      defaultDestination: "overview",
      destinations: [
        { id: "overview", kind: "tab", tab: "overview", path: "/" },
        {
          id: "orders",
          kind: "internal",
          path: "/orders/:orderId",
          patterns: ["/orders/:orderId"],
        },
      ],
    });
    expect(resolveDestination(dynamic, { pathname: "/orders/TREM-1", search: "" }).id).toBe("orders");
    const orders = dynamic.destinations.find((item) => item.id === "orders");
    expect(buildDestinationLocation(orders, {
      params: { orderId: "TREM 1/2" },
    }).pathname).toBe("/orders/TREM%201%2F2");
  });

  it("keeps only valid backend mobile action-panel items", () => {
    const normalized = normalizeNavigationConfig({
      ...FALLBACK_NAVIGATION_CONFIG,
      mobileActionPanel: {
        variant: "mobile-navigation",
        ariaLabel: "Primary navigation",
        items: [
          { id: "home", label: "Home", icon: "home", target: "overview" },
          { id: "new-booking", label: "New booking", icon: "plus", action: "open-primary-action", emphasis: true },
          { id: "unsafe", label: "Unsafe", icon: "home", target: "missing" },
        ],
      },
    });

    expect(normalized.mobileActionPanel).toEqual({
      variant: "mobile-navigation",
      ariaLabel: "Primary navigation",
      items: [{
        id: "home",
        label: "Home",
        icon: "home",
        target: "overview",
        action: "",
        activeTargets: ["overview"],
        emphasis: false,
        disabled: false,
      }, {
        id: "new-booking",
        label: "New booking",
        icon: "plus",
        target: "",
        action: "open-primary-action",
        activeTargets: [],
        emphasis: true,
        disabled: false,
      }],
    });
  });
});
