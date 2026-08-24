const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const RENDERERS = new Set(["app-shell", "trevista"]);
const KINDS = new Set(["tab", "remote", "internal", "external"]);
const GUEST_ACCESSIBLE_DESTINATIONS = new Set(["overview", "trevista"]);
const MOBILE_PANEL_ACTIONS = new Set(["open-primary-action"]);

export const isGuestAccessibleDestination = (destination) =>
  GUEST_ACCESSIBLE_DESTINATIONS.has(destination?.id);

export const buildTrevistaTourPath = (tourRef) => {
  const normalizedRef = String(tourRef || "").trim();
  return normalizedRef
    ? `/trevista/tours/${encodeURIComponent(normalizedRef)}`
    : "/trevista/tours";
};

export const FALLBACK_NAVIGATION_CONFIG = {
  version: 1,
  defaultDestination: "overview",
  notFoundDestination: "overview",
  security: { allowedExternalOrigins: [], allowedExternalProtocols: ["https:"] },
  mobileActionPanel: {
    variant: "mobile-navigation",
    ariaLabel: "Primary mobile navigation",
    items: [
      {
        id: "home",
        label: "Home",
        icon: "home",
        target: "overview",
        activeTargets: ["overview", "trevista"],
      },
      { id: "bookings", label: "Bookings", icon: "calendar", target: "bookings" },
      {
        id: "new-booking",
        label: "New Booking",
        icon: "plus",
        action: "open-primary-action",
        emphasis: true,
      },
      { id: "support", label: "Support", icon: "support", target: "support" },
      { id: "profile", label: "Profile", icon: "user", target: "profile" },
    ],
  },
  destinations: [
    {
      id: "overview",
      kind: "tab",
      renderer: "app-shell",
      tab: "overview",
      path: "/",
      activeId: "overview",
    },
    {
      id: "favorites",
      kind: "tab",
      renderer: "app-shell",
      tab: "favorites",
      path: "/",
      activeId: "favorites",
    },
    {
      id: "bookings",
      kind: "tab",
      renderer: "app-shell",
      tab: "bookings",
      path: "/",
      activeId: "bookings",
    },
    {
      id: "profile",
      kind: "tab",
      renderer: "app-shell",
      tab: "profile",
      path: "/",
      activeId: "profile",
    },
    {
      id: "support",
      kind: "internal",
      renderer: "app-shell",
      path: "/help",
      activeId: "support",
      patterns: ["/help", "/help/*"],
    },
    {
      id: "trevista",
      kind: "remote",
      renderer: "trevista",
      tab: "trevista",
      product: "trevista",
      path: "/",
      activeId: "tours",
      patterns: ["/trevista/*", "/tour/*"],
    },
  ],
};

const safePath = (value, fallback = "/") => {
  const path = String(value || fallback).trim();
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return fallback;
  }
  if (
    path.length > 2048 ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    decoded.startsWith("//") ||
    /[\u0000-\u001f\\]/.test(decoded)
  )
    return fallback;
  return path;
};

const safePatterns = (patterns) =>
  (Array.isArray(patterns) ? patterns : [])
    .map((pattern) => safePath(pattern, ""))
    .filter(Boolean)
    .slice(0, 20);

export function normalizeNavigationConfig(value = {}) {
  const rawDestinations = Array.isArray(value.destinations) ? value.destinations : [];
  const destinations = rawDestinations
    .filter((item) => ID_PATTERN.test(String(item?.id || "")) && KINDS.has(item?.kind))
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      renderer: RENDERERS.has(item.renderer)
        ? item.renderer
        : item.kind === "remote"
          ? ""
          : "app-shell",
      tab: ID_PATTERN.test(String(item.tab || "")) ? item.tab : "",
      product: ID_PATTERN.test(String(item.product || "")) ? item.product : "",
      activeId: ID_PATTERN.test(String(item.activeId || "")) ? item.activeId : item.id,
      path: safePath(item.path),
      patterns: safePatterns(item.patterns),
    }))
    .filter((item) => item.kind !== "remote" || item.renderer);

  const usable = destinations.length
    ? destinations
    : normalizeNavigationConfig(FALLBACK_NAVIGATION_CONFIG).destinations;
  const ids = new Set(usable.map((item) => item.id));
  const requestedDefault = String(value.defaultDestination || "");
  const requestedNotFound = String(value.notFoundDestination || "");
  const protocols = Array.isArray(value.security?.allowedExternalProtocols)
    ? value.security.allowedExternalProtocols.filter(
        (protocol) => protocol === "https:" || protocol === "http:",
      )
    : ["https:"];
  const origins = Array.isArray(value.security?.allowedExternalOrigins)
    ? value.security.allowedExternalOrigins.flatMap((origin) => {
        try {
          return [new URL(origin).origin];
        } catch {
          return [];
        }
      })
    : [];
  const mobileActionPanelItems = (
    Array.isArray(value.mobileActionPanel?.items) ? value.mobileActionPanel.items : []
  )
    .filter(
      (item) =>
        ID_PATTERN.test(String(item?.id || "")) &&
        (ids.has(String(item?.target || "")) ||
          MOBILE_PANEL_ACTIONS.has(String(item?.action || ""))) &&
        String(item?.label || "").trim() &&
        ID_PATTERN.test(String(item?.icon || "")),
    )
    .slice(0, 5)
    .map((item) => ({
      id: String(item.id),
      label: String(item.label).trim().slice(0, 30),
      icon: String(item.icon),
      target: ids.has(String(item.target || "")) ? String(item.target) : "",
      action: MOBILE_PANEL_ACTIONS.has(String(item.action || "")) ? String(item.action) : "",
      activeTargets: (Array.isArray(item.activeTargets) ? item.activeTargets : [item.target])
        .map((target) => String(target || ""))
        .filter((target) => ids.has(target))
        .slice(0, 8),
      emphasis: Boolean(item.emphasis),
      disabled: Boolean(item.disabled),
    }));

  return {
    version: Number(value.version) || 1,
    defaultDestination: ids.has(requestedDefault) ? requestedDefault : usable[0].id,
    notFoundDestination: ids.has(requestedNotFound) ? requestedNotFound : usable[0].id,
    security: {
      allowedExternalOrigins: origins,
      allowedExternalProtocols: protocols.length ? protocols : ["https:"],
    },
    destinations: usable,
    mobileActionPanel: {
      variant: value.mobileActionPanel?.variant === "mobile-navigation" ? "mobile-navigation" : "",
      ariaLabel: String(value.mobileActionPanel?.ariaLabel || "")
        .trim()
        .slice(0, 80),
      items: mobileActionPanelItems,
    },
  };
}

const matchesPattern = (pathname, pattern) => {
  const pathSegments = pathname.split("/").filter(Boolean);
  const patternSegments = pattern.split("/").filter(Boolean);
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    if (expected === "*") return index === patternSegments.length - 1;
    if (expected.startsWith(":")) {
      if (!pathSegments[index]) return false;
      continue;
    }
    if (pathSegments[index] !== expected) return false;
  }
  return pathSegments.length === patternSegments.length;
};

export function resolveDestination(config, location) {
  const pathname = safePath(location?.pathname);
  const query = new URLSearchParams(location?.search || "");
  const pathMatch = config.destinations.find((item) =>
    item.patterns.some((pattern) => matchesPattern(pathname, pattern)),
  );
  if (pathMatch) return pathMatch;
  const tab = query.get("tab");
  const tabMatch = tab && config.destinations.find((item) => item.tab === tab);
  if (tabMatch) return tabMatch;
  return (
    config.destinations.find((item) => item.id === config.defaultDestination) ||
    config.destinations[0]
  );
}

export function buildDestinationLocation(destination, intent = {}) {
  const query = new URLSearchParams();
  if (destination.tab) query.set("tab", destination.tab);
  if (destination.product) query.set("product", destination.product);
  Object.entries(intent.query || {}).forEach(([key, value]) => {
    if (!ID_PATTERN.test(key) || value == null) return;
    query.set(key, String(value).slice(0, 500));
  });
  const params = intent.params || {};
  const destinationPath = destination.path.replace(/:([a-z0-9_-]+)/gi, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? encodeURIComponent(String(params[key]).slice(0, 300))
      : match,
  );
  return {
    pathname: safePath(intent.path || destinationPath),
    search: query.toString() ? `?${query.toString()}` : "",
    hash: "",
  };
}

export function resolveNavigationIntent(config, rawIntent, currentOrigin) {
  const intent =
    typeof rawIntent === "object" && rawIntent !== null ? rawIntent : { destination: rawIntent };
  const target = String(intent.destination || intent.id || intent.target || "");
  const destination = config.destinations.find((item) => item.id === target || item.tab === target);
  if (destination) {
    return {
      type: "internal",
      destination,
      location: buildDestinationLocation(destination, intent),
      replace: Boolean(intent.replace),
    };
  }
  if (target.startsWith("/") && !target.startsWith("//")) {
    return {
      type: "internal-path",
      location: { pathname: safePath(target), search: "", hash: "" },
      replace: Boolean(intent.replace),
    };
  }
  try {
    const url = new URL(target, currentOrigin);
    if (url.origin === currentOrigin) {
      return {
        type: "internal-path",
        location: { pathname: safePath(url.pathname), search: url.search, hash: url.hash },
        replace: Boolean(intent.replace),
      };
    }
    const protocolAllowed = config.security.allowedExternalProtocols.includes(url.protocol);
    const originAllowed = config.security.allowedExternalOrigins.includes(url.origin);
    if (protocolAllowed && originAllowed && !url.username && !url.password) {
      return {
        type: "external",
        url: url.toString(),
        target: intent.targetWindow === "_blank" ? "_blank" : "_self",
      };
    }
  } catch {}
  return { type: "blocked", reason: "Navigation target is invalid or is not allowlisted." };
}
