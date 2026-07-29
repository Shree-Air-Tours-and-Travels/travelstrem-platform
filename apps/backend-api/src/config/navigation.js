const externalOrigins = (process.env.DASHBOARD_EXTERNAL_NAV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export default {
  version: 1,
  defaultDestination: "overview",
  notFoundDestination: "overview",
  security: {
    allowedExternalOrigins: externalOrigins,
    allowedExternalProtocols: ["https:"],
  },
  destinations: [
    { id: "overview", kind: "tab", tab: "overview", path: "/", activeId: "overview" },
    { id: "bookings", kind: "tab", tab: "bookings", path: "/", activeId: "bookings" },
    { id: "favorites", kind: "tab", tab: "favorites", path: "/", activeId: "favorites" },
    { id: "profile", kind: "tab", tab: "profile", path: "/", activeId: "profile" },
    {
      id: "trevio",
      kind: "remote",
      renderer: "trevio",
      tab: "trevio",
      product: "trevio",
      path: "/",
      activeId: "trips",
      patterns: ["/trevio/*", "/trip/*"],
    },
    {
      id: "booking-engine",
      kind: "remote",
      renderer: "bookingEngine",
      path: "/booking",
      activeId: "bookings",
      patterns: ["/booking/*"],
    },
  ],
};
